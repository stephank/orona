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
    @map.world = this
    @oddTick = no
    @spawnMapObjects()

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
    tank = @spawn Tank
    packet = @changesPacket(yes)
    packet = new Buffer(packet).toString('base64')
    for {client} in @tanks when client?
      client.sendMessage(packet)

    # Set-up the websocket parameters.
    tank.client = ws
    ws.setTimeout 10000 # Disconnect after 10s of inactivity.
    ws.heartbeatTimer = 0
    ws.on 'message', (message) => @onMessage(tank, message)
    ws.on 'end', => @onEnd(tank)
    ws.on 'error', (exception) => @onError(tank, exception)
    ws.on 'timeout', => @onError(tank, 'Timed out')

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
    packet = packet.concat pack('BH', net.WELCOME_MESSAGE, tank.idx)
    packet = new Buffer(packet).toString('base64')
    ws.sendMessage(packet)

  onEnd: (tank) ->
    return unless ws = tank.client
    tank.client = null
    ws.end()
    @onDisconnect(tank)

  onError: (tank, exception) ->
    return unless ws = tank.client
    tank.client = null
    # FIXME: log exception
    ws.destroy()
    @onDisconnect(tank)

  onDisconnect: (tank) ->
    @destroy tank

  onMessage: (tank, message) ->
    return unless tank.client?
    switch message.charAt(0)
      when '' then tank.client.heartbeatTimer = 0
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
          @onError(tank, 'Received invalid build order')
        else
          builder.performOrder action, trees, @map.cellAtTile(x, y)
      else @onError(tank, 'Received an unknown command')

  #### Helpers

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

    for {client} in @tanks when client?
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

  constructor: (@base) ->
    @games = {}

    @mapPath = path.join path.dirname(fs.realpathSync(__filename)), '../../maps'

    # FIXME: The interval should be deactivated automatically when
    # there are no games. (And reactivated once a new one starts.)
    # Maybe we shouldn't update empty games either?
    @loop = new Loop(this)
    @loop.tickRate = TICK_LENGTH_MS
    @loop.start()

    # FIXME: this is for the demo
    @demo = @createGame('everard-island')

  createGameId: ->
    charset = 'abcdefghijklmnopqrstuvwxyz'
    loop
      gid = for i in [1..20]
        charset.charAt(round(random() * (charset.length - 1)))
      gid = gid.join('')
      break unless @games.hasOwnProperty(gid)
    gid

  createGame: (mapName) ->
    data = fs.readFileSync "#{@mapPath}/#{mapName}.map"
    map = WorldMap.load data

    gid = @createGameId()
    @games[gid] = game = new BoloServerWorld(map)
    game.gid = gid
    game.url = "#{@base}/match/#{gid}"
    console.log "Created game '#{gid}'"

    game

  #### Loop callbacks

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
    else if path == '/demo' then (ws) => @demo.onConnect ws

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
  if options.log
    server.use '/', connect.logger()
  server.use '/', redirector(options.base)
  if options.gzip
    server.use '/', connect.staticGzip(
      root: webroot,
      compress: [
        'text/html', 'text/cache-manifest', 'text/css', 'application/javascript',
        'image/png', 'application/ogg']
    )
  server.use '/', connect.staticProvider(webroot)

  # FIXME: There's no good way to deal with upgrades in Connect, yet. (issue #61)
  # (Servers that wrap this application will fail.)
  server.app = new Application(options.base)
  server.on 'upgrade', (request, connection, initialData) ->
    server.app.handleWebsocket(request, connection, initialData)

  server


## Exports
module.exports = createBoloAppServer
