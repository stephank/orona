# This module contains all the juicy code related to the server. It exposes a factory function
# that returns a Connect-based HTTP server. A single server is capable of hosting multiple games,
# sharing the interval timer and the lobby across these games.


fs               = require 'fs'
url              = require 'url'
connect          = require 'connect'
Loop             = require 'villain/loop'
ServerWorld      = require 'villain/world/net/server'
{pack}           = require 'villain/struct'
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

  tick: ->
    super

    WebSocket.prototype.buffered()

    @sendChanges()
    @sendUpdate() if @oddTick = !@oddTick

    for {client} in @tanks when client != null
      client.heartbeatTimer++ if @oddTick
      client.flush()

  # Emit a sound effect from the given location. `owner` is optional.
  soundEffect: (sfx, x, y, owner) ->
    owner = if owner? then owner.idx else 65535
    @changes.push ['soundEffect', sfx, x, y, owner]

  # Record map changes.
  mapChanged: (cell, oldType, hadMine, oldLife) ->
    asciiCode = cell.type.ascii.charCodeAt(0)
    @changes.push ['mapChange', cell.x, cell.y, asciiCode, cell.life, cell.mine]

  #### Connection handling.

  onConnect: (ws) ->
    tank = @spawn Tank
    @sendChanges()
    tank.client = ws

    # Set-up the websocket parameters.
    ws.setTimeout 10000 # Disconnect after 10s of inactivity.
    ws.heartbeatTimer = 0
    ws.on 'message', (message) => @onMessage(tank, message)
    ws.on 'end', => @onEnd(tank)
    ws.on 'error', (exception) => @onError(tank, exception)
    ws.on 'timeout', => @onError(tank, 'Timed out')

    ws.buffered =>
      # Send the current map state. We don't send pillboxes and bases, because the client
      # receives create messages for those, and then fills the map structure based on those.
      mapData = new Buffer(@map.dump noPills: yes, noBases: yes)
      ws.sendMessage mapData.toString('base64')

      # To synchronize the object list to the client, we simulate creation of all objects.
      data = []
      for obj in @objects
        data = data.concat [net.CREATE_MESSAGE, obj._net_type_idx]
      data = data.concat [net.UPDATE_MESSAGE], @dump(yes)
      data = new Buffer(data)
      ws.sendMessage data.toString('base64')

      # Send the welcome message, along with the index of this player's tank.
      data = new Buffer(pack('BH', net.WELCOME_MESSAGE, tank.idx))
      ws.sendMessage data.toString('base64')

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
    switch message
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
      else @onError(tank, 'Received an unknown command')

  #### Helpers

  # Broadcast a message to all connected clients.
  broadcast: (message) ->
    for {client} in @tanks when client?
      client.sendMessage(message)
    return

  # An unreliable broadcast message is a message that may be dropped. Each client sends a periodic
  # hearbeat. If not received in a timely fashion, we drop some of the client's messages.
  broadcastUnreliable: (message) ->
    for {client} in @tanks when client?
      # Ticks are every 20ms. Network updates are every odd tick, i.e. every 40ms.
      # Allow a client to lag 20 updates behind, i.e. 800ms, before dropping messages.
      client.sendMessage(message) unless client.heartbeatTimer > 20
    return

  # Send critical updates.
  sendChanges: ->
    return unless @changes.length > 0
    data = []
    for change in @changes
      type = change.shift()
      data = switch type
        when 'create'
          data.concat [net.CREATE_MESSAGE],      pack.apply(null,     ['B'].concat change)
        when 'destroy'
          data.concat [net.DESTROY_MESSAGE],     pack.apply(null,     ['H'].concat change)
        when 'mapChange'
          data.concat [net.MAPCHANGE_MESSAGE],   pack.apply(null, ['BBBBf'].concat change)
        when 'soundEffect'
          data.concat [net.SOUNDEFFECT_MESSAGE], pack.apply(null,  ['BHHH'].concat change)
    data = new Buffer(data)
    @broadcast data.toString('base64')
    @changes = []

  # Send an update.
  sendUpdate: ->
    data = [net.UPDATE_MESSAGE].concat @dump()
    data = new Buffer(data)
    @broadcastUnreliable data.toString('base64')

helpers.extend BoloServerWorld.prototype, BoloWorldMixin
allObjects.registerWithWorld BoloServerWorld.prototype


## HTTP server application

class Application

  constructor: ->
    @games = []

    # FIXME: The interval should be deactivated automatically when
    # there are no games. (And reactivated once a new one starts.)
    # Maybe we shouldn't update empty games either?
    @loop = new Loop(this)
    @loop.tickRate = TICK_LENGTH_MS
    @loop.start()

    # FIXME: this is for the demo
    data = fs.readFileSync 'maps/everard-island.map'
    map = WorldMap.load data
    @games.push new BoloServerWorld(map)

  #### Loop callbacks

  tick: ->
    for game in @games
      game.tick()
    return

  idle: ->

  #### WebSocket handling

  # Determine what will handle a WebSocket's 'connect' event, based on the requested resource.
  getSocketPathHandler: (path) ->
    # FIXME: Simple lobby with chat and match making.
    if path == '/lobby' then false

    # FIXME: Match joining based on a UUID.
    else if path.indexOf('/match/') == 0 then false

    # FIXME: This is the temporary entry point while none of the above is implemented.
    else if path == '/demo' then (ws) => @games[0].onConnect ws

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

# Helper middleware to direct from the root.
redirectMiddleware = (req, res, next) ->
  requrl = url.parse(req.url)
  return next() unless requrl.pathname == '/'
  host = requrl.host || req.headers['host']
  res.writeHead 301, 'Location': "http://#{host}/bolo.html"
  res.end()

# Don't export a server directly, but this factory function. Once called, the timer loop will
# start. I believe it's untidy to have timer loops start after a simple require().
createBoloServer = ->
  # FIXME: Correct way to find the path to the 'public' directory?
  logger = connect.logger()
  gzip = connect.staticGzip
    root: 'public',
    compress: [
      'text/html', 'text/cache-manifest', 'text/css', 'application/javascript',
      'image/png', 'application/ogg']
  static = connect.staticProvider 'public'
  server = connect.createServer(logger, redirectMiddleware, gzip, static)

  # FIXME: There's no good way to deal with upgrades in Connect, yet. (issue #61)
  # (Servers that wrap this application will fail.)
  boloApp = new Application()
  server.on 'upgrade', (request, connection, initialData) ->
    boloApp.handleWebsocket(request, connection, initialData)

  server


## Exports
module.exports = createBoloServer
