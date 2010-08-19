###
This is an extract from Socket.IO-node.

© 2010 Guillermo Rauch <guillermo@learnboost.com>
Adapted by Stéphan Kochen for Orona.

(The MIT License)

Copyright (c) 2010 LearnBoost <dev@learnboost.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
###

{EventEmitter} = require 'events'
{createHash}   = require 'crypto'


class WebSocket extends EventEmitter
  constructor: (@request, @connection, initialData) ->
    super()

    @connection.setTimeout 0
    @connection.setEncoding 'utf8'
    @connection.setNoDelay yes

    # FIXME: should be buffer
    @data = initialData.toString('binary')

    # @request and @queued are temporary, while the handshake is in progress.
    @queued = []

    process.nextTick => @_handshake()
    @connection.on 'data', (data) => @_onData(data)
    @connection.on 'end', => @_onClose()

  _handshake: ->
    return if @data.length < 8

    # Get the keys.
    k1 = @request.headers['sec-websocket-key1']
    k2 = @request.headers['sec-websocket-key2']
    return @_onClose unless k1 and k2
    k3 = @data.slice(0, 8)
    @data = @data.slice(8)

    # Calculate the challenge from the keys given by the client.
    md5 = createHash 'md5'
    for k in [k1, k2]
      n = parseInt(k.replace(/[^\d]/g, ''))
      spaces = k.replace(/[^ ]/g, '').length
      return @_onClose if spaces == 0 or n % spaces != 0
      n /= spaces
      md5.update(new Buffer([
        (n & 0xFF000000) >> 24,
        (n & 0x00FF0000) >> 16,
        (n & 0x0000FF00) >> 8,
        (n & 0x000000FF) >> 0
      ]))
    md5.update k3
    # There's no direct way to get a buffer, yet.
    md5 = new Buffer(md5.digest('base64'), 'base64')

    # Build the response headers.
    origin = @request.headers.origin
    headers = [
      'HTTP/1.1 101 WebSocket Protocol Handshake',
      'Upgrade: WebSocket',
      'Connection: Upgrade',
      'Sec-WebSocket-Origin: ' + (origin || 'null'),
      'Sec-WebSocket-Location: ws://' + @request.headers.host + @request.url
    ]
    if 'sec-websocket-protocol' in @request.headers
      headers.push('Sec-WebSocket-Protocol: ' + @request.headers['sec-websocket-protocol'])
    headers = headers.concat('', '').join('\r\n')

    # Send handshake.
    @connection.write headers, 'utf-8'
    @connection.write md5

    # Flush queued messages, and clean up stuff we no longer need.
    for messsage in @queued
      @sendMessage message
    delete @queued
    delete @request

    # Signal the user.
    @emit 'connect'

    # Flush any remaining messages in the buffer.
    @_onData() if @data.length > 0

  _onData: (data) ->
    # FIXME: cannot concatenate and slice buffers easily.
    @data += data if data?
    if @request?
      # The handshake is still waiting for the challenge.
      @_handshake()
    else
      # Split at the ending sentinel.
      chunks = @data.split '\ufffd'
      # The list element is either an empty string or incomplete message.
      @data = chunks.pop()
      # Check messages, then signal to the user.
      for chunk in chunks
        return @connection.end() unless chunk[0] == '\u0000'
        @emit 'message', chunk.slice(1)
    return
    
  _onClose: ->
    @connection.destroy()
    @emit 'end'

  sendMessage: (message) ->
    if @request?
      # Don't interrupt the handshake.
      @queued.push message
    else
      try
        @connection.write '\x00', 'binary'
        @connection.write message, 'utf8'
        @connection.write '\xFF', 'binary'
      catch e
        @_onClose()
    return


# Exports
module.exports = WebSocket
