###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

url       = require 'url'
connect   = require 'connect'
WebSocket = require './websocket'

# FIXME
{puts} = require 'sys'


handleWebsocket = (request, connection, initialData) ->
  path = url.parse(request.url).pathname
  return connection.destroy() unless request.method == 'GET' and path == '/bolo'

  ws = new WebSocket(request, connection, initialData)
  # FIXME
  ws.on 'connect', -> puts "WebSocket client connected."
  ws.on 'message', (message) -> puts "Got: '#{message}'"
  ws.on 'end', -> puts "WebSocket client disconnected."


app = connect.createServer(connect.staticProvider('public'))
# FIXME: There's no good way to deal with upgrades in connect, yet.
# (Servers that wrap this application will fail.)
app.on 'upgrade', handleWebsocket

module.exports = app
