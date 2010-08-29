###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

fs               = require 'fs'
url              = require 'url'
connect          = require 'connect'
WebSocket        = require './websocket'
ServerContext    = require './net'
Simulation       = require '..'
map              = require '../map'
net              = require '../net'
{TICK_LENGTH_MS} = require '../constants'


class Game
  constructor: (gameMap) ->
    @sim = new Simulation(gameMap)
    @netctx = new ServerContext(@sim)
    @oddTick = no

  # Connection handling.

  onConnect: (ws) ->
    tank = @sim.addTank()
    tank.client = ws

    ws.setTimeout 10000 # Disconnect after 10s of inactivity.
    ws.heartbeatTimer = 0
    ws.on 'message', => (message) @onMessage(tank, message)
    ws.on 'end', => @onEnd(tank)
    ws.on 'error', (exception) => @onError(tank, exception)
    ws.on 'timeout', => @onError(tank, 'Timed out')

    # Send the current map state.
    mapData = new Buffer(@sim.map.dump())
    ws.sendMessage mapData.toString('base64')

    # FIXME: Synchronize the object list with this new client

  onEnd: (tank) ->
    tank.client.end()
    @onDisconnect(tank)

  onError: (tank, exception) ->
    # FIXME: log exception
    tank.client.destroy()
    @onDisconnect(tank)

  onDisconnect: (tank) ->
    @sim.removeTank(tank)
    # FIXME: notify clients

  onMessage: (tank, message) ->
    # FIXME: do something with the command here.

  # Broadcast a message to all connected clients.
  broadcast: (message) ->
    for {client} in @sim.tanks
      client.sendMessage(message)
    return

  # An unreliable broadcast message is a message that may be dropped. Each client sends a periodic
  # hearbeat. If not received in a timely fashion, we drop some of the client's messages.
  broadcastUnreliable: (message) ->
    for {client} in @sim.tanks
      # Ticks are every 20ms. Network updates are every odd tick, i.e. every 40ms.
      # Allow a client to lag 20 updates behind, i.e. 800ms, before dropping messages.
      continue if client.heartbeatTimer > 20
      client.sendMessage(message)
    return

  # Simulation updates.

  tick: ->
    net.inContext @netctx, => @sim.tick()

    # FIXME: Somehow buffer and flush here. Right now, it's sending a packet for every socket
    # write, which results in 6 packets: '\x00', criticals, '\xFF', '\x00', attributes, '\xFF'.

    # Send critical updates.
    if @netctx.changes.length > 0
      data = new Buffer(@netctx.changes)
      @broadcast data.toString('base64')

    # Send attribute updates at half the tickrate.
    if @oddTick = !@oddTick
      data = new Buffer(@netctx.dump())
      @broadcastUnreliable data.toString('base64')
      # Increment the heartbeat counters.
      client.heartbeatTimer++ for {client} in @sim.tanks

    return


class Application
  constructor: ->
    @games = []
    @timer = setInterval =>
      game.tick() for game in @games
      return
    , TICK_LENGTH_MS

    # FIXME: this is for the demo
    data = fs.readFileSync 'maps/everard-island.map'
    gameMap = map.load data
    @games.push new Game(gameMap)

  destroy: ->
    # FIXME: The interval should be deactivated automatically when
    # there are no games. (And reactivated once a new one starts.)
    # Maybe we shouldn't update empty games either?
    clearInterval @timer

  # Determine what will handle a WebSocket's 'connect' event, based on
  # the resource that was requested.
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


# Don't export a server directly, but this factory function. Once called, the timer loop will
# start. I believe it's untidy to have timer loops start after a simple require().
createBoloServer = ->
  # FIXME: Correct way to find the path to the 'public' directory?
  server = connect.createServer(connect.logger(), connect.staticProvider('public'))

  # FIXME: There's no good way to deal with upgrades in Connect, yet. (issue #61)
  # (Servers that wrap this application will fail.)
  boloApp = new Application()
  server.on 'upgrade', (request, connection, initialData) ->
    boloApp.handleWebsocket(request, connection, initialData)

  server


# Exports.
module.exports = createBoloServer
