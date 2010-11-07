# This module contains all the juicy code related to the server. It exposes a factory function
# that returns a Connect-based HTTP server. A single server is capable of hosting multiple games,
# sharing the interval timer and the lobby across these games.


{random, round} = Math

fs   = require 'fs'
url  = require 'url'
path = require 'path'

connect = require 'connect'

Loop        = require 'villain/loop'
ServerWorld = require 'villain/world/net/server'
{pack}      = require 'villain/struct'

WebSocket        = require './websocket'
MapIndex         = require './map_index'
helpers          = require '../helpers'
BoloWorldMixin   = require '../world_mixin'
allObjects       = require '../objects/all'
Tank             = require '../objects/tank'
WorldMap         = require '../world_map'
net              = require '../net'
{TICK_LENGTH_MS} = require '../constants'


## Server world

class BoloServerWorld extends ServerWorld

  authority: yes

  constructor: (@map) ->
    super
    @boloInit()
    @clients = []
    @map.world = this
    @oddTick = no
    @spawnMapObjects()

  close: ->
    for client in @clients
      client.end()

  #### Callbacks

  # Update, and then send packets to the client.
  tick: ->
    super
    @sendPackets()

  # Emit a sound effect from the given location. `owner` is optional.
  soundEffect: (sfx, x, y, owner) ->
    ownerIdx = if owner? then owner.idx else 65535
    @changes.push ['soundEffect', sfx, x, y, ownerIdx]

  # Record map changes.
  mapChanged: (cell, oldType, hadMine, oldLife) ->
    ascii = cell.type.ascii
    @changes.push ['mapChange', cell.x, cell.y, ascii, cell.life, cell.mine]

  #### Connection handling.

  onConnect: (ws) ->
    # Set-up the websocket parameters.
    @clients.push ws
    ws.setTimeout 10000 # Disconnect after 10s of inactivity.
    ws.heartbeatTimer = 0
    ws.on 'message', (message) => @onMessage(ws, message)
    ws.on 'end', => @onEnd(ws)
    ws.on 'error', (error) => @onError ws, error
    ws.on 'timeout', => @onError ws, new Error('Connection timed out')

    # Send the current map state. We don't send pillboxes and bases, because the client
    # receives create messages for those, and then fills the map structure based on those.
    # The client expects this as a separate message.
    packet = @map.dump(noPills: yes, noBases: yes)
    packet = new Buffer(packet).toString('base64')
    ws.sendMessage(packet)

    # To synchronize the object list to the client, we simulate creation of all objects.
    # Then, we tell the client which tank is his, using the welcome message.
    packet = []
    for obj in @objects
      packet = packet.concat [net.CREATE_MESSAGE, obj._net_type_idx]
    packet = packet.concat [net.UPDATE_MESSAGE], @dumpTick(yes)
    packet = new Buffer(packet).toString('base64')
    ws.sendMessage(packet)

    # Synchronize all player names.
    messages = for tank in @tanks
      { command: 'nick', idx: tank.idx, nick: tank.name }
    messages = JSON.stringify(messages)
    ws.sendMessage(messages)

    # Finish with a 'sync' message.
    packet = new Buffer([net.SYNC_MESSAGE]).toString('base64')
    ws.sendMessage(packet)

  onEnd: (ws) ->
    ws.end()
    @onDisconnect(ws)

  onError: (ws, error) ->
    console.log(error?.toString() or 'Unknown error on client connection')
    ws.destroy()
    @onDisconnect(ws)

  onDisconnect: (ws) ->
    @destroy ws.tank if ws.tank
    ws.tank = null
    if (idx = @clients.indexOf(ws)) != -1
      @clients.splice(idx, 1)

  onMessage: (ws, message) ->
    if message == '' then ws.heartbeatTimer = 0
    else if message.charAt(0) == '{' then @onJsonMessage(ws, message)
    else @onSimpleMessage(ws, message)

  onSimpleMessage: (ws, message) ->
    unless tank = ws.tank
      return @onError ws, new Error("Received a game command from a spectator")
    command = message.charAt(0)
    switch command
      when net.START_TURNING_CCW  then tank.turningCounterClockwise = yes
      when net.STOP_TURNING_CCW   then tank.turningCounterClockwise = no
      when net.START_TURNING_CW   then tank.turningClockwise = yes
      when net.STOP_TURNING_CW    then tank.turningClockwise = no
      when net.START_ACCELERATING then tank.accelerating = yes
      when net.STOP_ACCELERATING  then tank.accelerating = no
      when net.START_BRAKING      then tank.braking = yes
      when net.STOP_BRAKING       then tank.braking = no
      when net.START_SHOOTING     then tank.shooting = yes
      when net.STOP_SHOOTING      then tank.shooting = no
      when net.INC_RANGE          then tank.increaseRange()
      when net.DEC_RANGE          then tank.decreaseRange()
      when net.BUILD_ORDER
        [action, trees, x, y] = message.slice(2).split(',')
        trees = parseInt(trees); x = parseInt(x); y = parseInt(y)
        builder = tank.builder.$
        if trees < 0 or not builder.states.actions.hasOwnProperty(action)
          @onError ws, new Error("Received invalid build order")
        else
          builder.performOrder action, trees, @map.cellAtTile(x, y)
      else
        sanitized = command.replace(/\W+/, '')
        @onError ws, new Error("Received an unknown command: #{sanitized}")

  onJsonMessage: (ws, message) ->
    try
      message = JSON.parse(message)
      unless typeof(message.command) == 'string'
        throw new Error("Received an invalid JSON message")
    catch e
      return @onError ws, e
    if message.command == 'join'
      if ws.tank
        @onError ws, new Error("Client tried to join twice.")
      else
        @onJoinMessage ws, message
      return
    unless tank = ws.tank
      return @onError ws, new Error("Received a JSON message from a spectator")
    switch message.command
      when 'msg'     then @onTextMessage(ws, tank, message)
      when 'teamMsg' then @onTeamTextMessage(ws, tank, message)
      else
        sanitized = message.command.slice(0, 10).replace(/\W+/, '')
        @onError ws, new Error("Received an unknown JSON command: #{sanitized}")

  # Creates a tank for a connection and synchronizes it to everyone. Then tells the connection
  # that this new tank is his.
  onJoinMessage: (ws, message) ->
    if typeof(message.nick) != 'string' or message.nick.length > 20
      @onError ws, new Error("Client specified invalid nickname.")
    if typeof(message.team) != 'number' or not (message.team == 0 or message.team == 1)
      @onError ws, new Error("Client specified invalid team.")

    ws.tank = @spawn Tank, message.team
    packet = @changesPacket(yes)
    packet = new Buffer(packet).toString('base64')
    @broadcast packet

    ws.tank.name = message.name
    @broadcast JSON.stringify
      command: 'nick'
      idx: ws.tank.idx
      nick: message.nick

    packet = pack('BH', net.WELCOME_MESSAGE, ws.tank.idx)
    packet = new Buffer(packet).toString('base64')
    ws.sendMessage(packet)

  onTextMessage: (ws, tank, message) ->
    if typeof(message.text) != 'string' or message.text.length > 140
      @onError ws, new Error("Client sent an invalid text message.")

    @broadcast JSON.stringify
      command: 'msg'
      idx: tank.idx
      text: message.text

  onTeamTextMessage: (ws, tank, message) ->
    if typeof(message.text) != 'string' or message.text.length > 140
      @onError ws, new Error("Client sent an invalid text message.")
    if tank.team == 255 then return

    out = JSON.stringify
      command: 'teamMsg'
      idx: tank.idx
      text: message.text
    for client in @clients when client.tank.team == tank.team
      client.sendMessage(out)

  #### Helpers

  # Simple helper to send a message to everyone.
  broadcast: (message) ->
    for client in @clients
      client.sendMessage(message)

  # We send critical updates every frame, and non-critical updates every other frame. On top of
  # that, non-critical updates may be dropped, if the client's hearbeats are interrupted.
  sendPackets: ->
    if @oddTick = !@oddTick
      smallPacket = @changesPacket(yes)
      smallPacket = new Buffer(smallPacket).toString('base64')
      largePacket = smallPacket
    else
      smallPacket = @changesPacket(no)
      largePacket = smallPacket.concat @updatePacket()
      smallPacket = new Buffer(smallPacket).toString('base64')
      largePacket = new Buffer(largePacket).toString('base64')

    for client in @clients
      if client.heartbeatTimer > 40
        client.sendMessage(smallPacket)
      else
        client.sendMessage(largePacket)
        client.heartbeatTimer++

  # Get a data stream for critical updates. The optional `fullCreate` flag is used to transmit
  # create messages that include state, which is needed when not followed by an update packet.
  changesPacket: (fullCreate) ->
    return [] unless @changes.length > 0

    data = []
    needUpdate = []

    for change in @changes
      type = change.shift()

      switch type
        when 'create'
          [obj, idx] = change
          needUpdate.push obj if fullCreate
          data = data.concat [net.CREATE_MESSAGE], pack('B', obj._net_type_idx)

        when 'destroy'
          [obj, idx] = change
          for other, i in needUpdate
            if other == obj
              needUpdate.splice i, 1
              break
          data = data.concat [net.DESTROY_MESSAGE], pack('H', idx)

        when 'mapChange'
          [x, y, ascii, life, mine] = change
          asciiCode = ascii.charCodeAt(0)
          data = data.concat [net.MAPCHANGE_MESSAGE], pack('BBBBf', x, y, asciiCode, life, mine)

        when 'soundEffect'
          [sfx, x, y, ownerIdx] = change
          data = data.concat [net.SOUNDEFFECT_MESSAGE], pack('BHHH', sfx, x, y, ownerIdx)

    for obj in needUpdate
      data = data.concat [net.TINY_UPDATE_MESSAGE], pack('H', obj.idx), @dump(obj)

    data

  # Get a data stream for non-critical updates.
  updatePacket: -> [net.UPDATE_MESSAGE].concat @dumpTick()

helpers.extend BoloServerWorld.prototype, BoloWorldMixin
allObjects.registerWithWorld BoloServerWorld.prototype


## HTTP server application
class Application

  constructor: (@httpServer, @options) ->
    @games = {}
    @ircClients = []

    mapPath = path.join path.dirname(fs.realpathSync(__filename)), '../../maps'
    @maps = new MapIndex mapPath, =>
      @resetDemo (err) ->
        console.log err if err

    @loop = new Loop(this)
    @loop.tickRate = TICK_LENGTH_MS

  # FIXME: this is for the demo
  resetDemo: (cb) ->
    @closeGame(@demo) if @demo
    unless everard = @maps.get('Everard Island')
      return cb? "Could not find Everard Island."
    fs.readFile everard.path, (err, data) =>
      return cb? "Unable to start demo game: #{err.toString()}" if err
      @demo = @createGame(data)
      cb?()

  haveOpenSlots: ->
    Object.getOwnPropertyNames(@games).length < @options.general.maxgames

  createGameId: ->
    charset = 'abcdefghijklmnopqrstuvwxyz'
    loop
      gid = for i in [1..20]
        charset.charAt(round(random() * (charset.length - 1)))
      gid = gid.join('')
      break unless @games.hasOwnProperty(gid)
    gid

  createGame: (mapData) ->
    map = WorldMap.load mapData

    gid = @createGameId()
    @games[gid] = game = new BoloServerWorld(map)
    game.gid = gid
    game.url = "#{@options.general.base}/match/#{gid}"
    console.log "Created game '#{gid}'"
    @startLoop()

    game

  closeGame: (game) ->
    delete @games[game.gid]
    @possiblyStopLoop()
    game.close()
    console.log "Closed game '#{game.gid}'"

  registerIrcClient: (irc) ->
    @ircClients.push irc

  shutdown: ->
    for client in @ircClients
      client.shutdown()
    for gid, game of @games
      game.close()
    @loop.stop()
    @httpServer.close()

  #### Loop control

  startLoop: ->
    @loop.start()

  possiblyStopLoop: ->
    @loop.stop() unless @haveOpenSlots()

  tick: ->
    for gid, game of @games
      game.tick()
    return

  idle: ->

  #### WebSocket handling

  # Determine what will handle a WebSocket's 'connect' event, based on the requested resource.
  getSocketPathHandler: (path) ->
    # FIXME: Simple lobby with chat and match making.
    if path == '/lobby' then false

    # FIXME: Match joining based on a UUID.
    else if m = /^\/match\/([a-z]{20})$/.exec(path)
      if @games.hasOwnProperty(m[1])
        (ws) => @games[m[1]].onConnect ws
      else
        false

    # FIXME: This is the temporary entry point.
    else if path == '/demo' and @demo then (ws) => @demo.onConnect ws

    else false

  # Handle the 'upgrade' event.
  handleWebsocket: (request, connection, initialData) ->
    return connection.destroy() unless request.method == 'GET'

    path = url.parse(request.url).pathname
    handler = @getSocketPathHandler(path)
    return connection.destroy() if handler == false

    ws = new WebSocket(request, connection, initialData)
    ws.on 'connect', -> handler(ws)


## Entry point

# Helper middleware to redirect from the root or from '/match/*'.
redirector = (base) ->
  (req, res, next) ->
    requrl = url.parse(req.url)
    if requrl.pathname == '/'
      query = ''
    else if m = /^\/match\/([a-z]{20})$/.exec(requrl.pathname)
      query = "?#{m[1]}"
    else
      return next()
    res.writeHead 301, 'Location': "#{base}/bolo.html#{query}"
    res.end()

# Don't export a server directly, but this factory function. Once called, the timer loop will
# start. I believe it's untidy to have timer loops start after a simple require().
createBoloAppServer = (options) ->
  options ||= {}
  webroot = path.join path.dirname(fs.realpathSync(__filename)), '../../public'

  server = connect.createServer()
  if options.web.log
    server.use '/', connect.logger()
  server.use '/', redirector(options.general.base)
  if options.web.gzip
    server.use '/', connect.staticGzip(
      root: webroot,
      compress: [
        'text/html', 'text/cache-manifest', 'text/css', 'application/javascript',
        'image/png', 'application/ogg']
    )
  server.use '/', connect.staticProvider(webroot)

  # FIXME: There's no good way to deal with upgrades in Connect, yet. (issue #61)
  # (Servers that wrap this application will fail.)
  server.app = new Application(server, options)
  server.on 'upgrade', (request, connection, initialData) ->
    server.app.handleWebsocket(request, connection, initialData)

  server


## Exports
module.exports = createBoloAppServer
