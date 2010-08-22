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
Simulation       = require '..'
map              = require '../map'
{TICK_LENGTH_MS} = require '../constants'


class Game
  constructor: (gameMap) ->
    @sim = new Simulation(gameMap)

  tick: ->
    @sim.tick()

  onConnect: (ws) ->
    tank = @sim.addTank()
    tank.client = ws

    mapData = new Buffer(@sim.map.dump())
    ws.sendMessage mapData.toString('base64')

    # FIXME: install message event handlers.


class Application
  constructor: ->
    @games = []
    @timer = setTimeout =>
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
