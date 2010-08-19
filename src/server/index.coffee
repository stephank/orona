###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

fs        = require 'fs'
url       = require 'url'
connect   = require 'connect'
WebSocket = require './websocket'

# FIXME
{puts} = require 'sys'


getSocketPathHandler = (path) ->
  if path == '/lobby'
    # FIXME: Simple lobby with chat and match making.
    false
  else if path.indexOf('/match/') == 0
    # FIXME: Match joining based on a UUID.
    false
  else if path == '/demo'
    # FIXME: This is the temporary entry point while none of the above is implemented.
    (ws) ->
      ws.on 'connect', ->
        fs.readFile 'maps/everard-island.map', (err, data) ->
          ws.sendMessage data.toString('base64')
  else
    false

handleWebsocket = (request, connection, initialData) ->
  return connection.destroy() unless request.method == 'GET'

  path = url.parse(request.url).pathname
  handler = getSocketPathHandler(path)
  return connection.destroy() if handler == false

  ws = new WebSocket(request, connection, initialData)
  handler(ws)


# Don't export a server directly, but this factory function. Once called, the timer loop will
# start. Do that explicitely in this function, rather than when the module is simply require()'d.
createBoloServer = ->
  # FIXME: Correct way to find the path to the 'public' directory?
  server = connect.createServer(connect.logger(), connect.staticProvider('public'))
  # FIXME: There's no good way to deal with upgrades in Connect, yet.
  # (Servers that wrap this application will fail.)
  server.on 'upgrade', handleWebsocket
  server

module.exports = createBoloServer
