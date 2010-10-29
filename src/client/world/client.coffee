ClientWorld      = require 'villain/world/net/client'
WorldMap         = require '../../world_map'
allObjects       = require '../../objects/all'
WorldPillbox     = require '../../objects/world_pillbox'
WorldBase        = require '../../objects/world_base'
{unpack}         = require '../../struct'
{decodeBase64}   = require '../base64'
net              = require '../../net'
helpers          = require '../../helpers'

# FIXME: Better error handling all around.


## Networked game

# The `BoloClientWorld` class implements a networked game using a WebSocket.

class BoloClientWorld extends ClientWorld

  authority: no

  constructor: ->
    super
    @mapChanges = {}
    @processingServerMessages = no

  # Callback after resources have been loaded.
  loaded: (@vignette) ->
    @vignette.message 'Connecting to the multiplayer game'
    @heartbeatTimer = 0

    if m = /^\?([a-z]{20})$/.exec(location.search)
      path = "/match/#{m[1]}"
    else if location.search
      return @vignette.message 'Invalid game ID'
    else
      path = "/demo"
    @ws = new WebSocket("ws://#{location.host}#{path}")
    ws = $(@ws)
    ws.one 'open.bolo', =>
      @connected()
    ws.one 'close.bolo', =>
      @failure 'Connection lost'

  connected: ->
    @vignette.message 'Waiting for the game map'
    ws = $(@ws)
    ws.one 'message.bolo', (e) =>
      @receiveMap(e.originalEvent)

  # Callback after the map was received.
  receiveMap: (e) ->
    @map = WorldMap.load decodeBase64(e.data)
    @commonInitialization()
    @vignette.message 'Waiting for the game state'
    $(@ws).bind 'message.bolo', (e) =>
      @handleMessage(e.originalEvent)

  # Callback after the server tells us we are synchronized.
  synchronized: ->
    @rebuildMapObjects()
    @vignette.destroy()
    @vignette = null
    @loop.start()

  # Callback after the welcome message was received.
  receiveWelcome: (tank) ->
    @player = tank
    @renderer.initHud()

  # Send the heartbeat (an empty message) every 10 ticks / 400ms.
  tick: ->
    super

    if @increasingRange != @decreasingRange
      if ++@rangeAdjustTimer == 6
        if @increasingRange then @ws.send net.INC_RANGE
        else @ws.send net.DEC_RANGE
        @rangeAdjustTimer = 0
    else
      @rangeAdjustTimer = 0

    if ++@heartbeatTimer == 10
      @heartbeatTimer = 0
      @ws.send('')

  failure: (message) ->
    if @ws
      @ws.close()
      $(@ws).unbind '.bolo'
      @ws = null
    super

  # On the client, this is a no-op.
  soundEffect: (sfx, x, y, owner) ->

  # Keep track of map changes that we made locally. We only remember the last state of a cell
  # that the server told us about, so we can restore it to that state before processing
  # server updates.
  mapChanged: (cell, oldType, hadMine, oldLife) ->
    return if @processingServerMessages
    unless @mapChanges[cell.idx]?
      cell._net_oldType = oldType
      cell._net_hadMine = hadMine
      cell._net_oldLife = oldLife
      @mapChanges[cell.idx] = cell
    return

  #### Input handlers.

  handleKeydown: (e) ->
    return unless @ws and @player
    switch e.which
      when 32 then @ws.send net.START_SHOOTING
      when 37 then @ws.send net.START_TURNING_CCW
      when 38 then @ws.send net.START_ACCELERATING
      when 39 then @ws.send net.START_TURNING_CW
      when 40 then @ws.send net.START_BRAKING

  handleKeyup: (e) ->
    return unless @ws and @player
    switch e.which
      when 32 then @ws.send net.STOP_SHOOTING
      when 37 then @ws.send net.STOP_TURNING_CCW
      when 38 then @ws.send net.STOP_ACCELERATING
      when 39 then @ws.send net.STOP_TURNING_CW
      when 40 then @ws.send net.STOP_BRAKING

  buildOrder: (action, trees, cell) ->
    return unless @ws and @player
    trees ||= 0
    @ws.send [net.BUILD_ORDER, action, trees, cell.x, cell.y].join(',')

  #### Network message handlers.

  handleMessage: (e) ->
    error = null
    if e.data.charAt(0) == '{'
      try
        @handleJsonCommand JSON.parse(e.data)
      catch e
        error = e
    else
      @netRestore()
      try
        data = decodeBase64(e.data)
        pos = 0
        length = data.length
        @processingServerMessages = yes
        while pos < length
          command = data[pos++]
          ate = @handleBinaryCommand command, data, pos
          pos += ate
        @processingServerMessages = no
        if pos != length
          error = new Error("Message length mismatch, processed #{pos} out of #{length} bytes")
      catch e
        error = e
    if error
      @failure 'Connection lost (protocol error)'
      console?.log "Following exception occurred while processing message:", data
      throw error

  handleBinaryCommand: (command, data, offset) ->
    switch command
      when net.SYNC_MESSAGE
        @synchronized()
        0

      when net.WELCOME_MESSAGE
        [[tank_idx], bytes] = unpack('H', data, offset)
        @receiveWelcome @objects[tank_idx]
        bytes

      when net.CREATE_MESSAGE
        @netSpawn data, offset

      when net.DESTROY_MESSAGE
        @netDestroy data, offset

      when net.MAPCHANGE_MESSAGE
        [[x, y, code, life, mine], bytes] = unpack('BBBBf', data, offset)
        ascii = String.fromCharCode(code)
        cell = @map.cells[y][x]
        cell.setType(ascii, mine)
        cell.life = life
        bytes

      when net.SOUNDEFFECT_MESSAGE
        [[sfx, x, y, owner], bytes] = unpack('BHHH', data, offset)
        @renderer.playSound(sfx, x, y, @objects[owner])
        bytes

      when net.TINY_UPDATE_MESSAGE
        [[idx], bytes] = unpack('H', data, offset)
        bytes += @netUpdate @objects[idx], data, offset + bytes
        bytes

      when net.UPDATE_MESSAGE
        @netTick data, offset

      else
        throw new Error "Bad command '#{command}' from server, at offset #{offset - 1}"

  handleJsonCommand: (data) ->
    switch data.command
      when 'nick'
        @objects[data.idx].name = data.nick
      else
        throw new Error "Bad JSON command '#{data.command}' from server."

  #### Helpers

  # Fill `@map.pills` and `@map.bases` based on the current object list.
  rebuildMapObjects: ->
    @map.pills = []; @map.bases = []
    for obj in @objects
      if      obj instanceof WorldPillbox then @map.pills.push(obj)
      else if obj instanceof WorldBase    then @map.bases.push(obj)
      else continue
      obj.cell?.retile()
    return

  # Override that reverts map changes as well.
  netRestore: ->
    super
    for idx, cell of @mapChanges
      cell.setType cell._net_oldType, cell._net_hadMine
      cell.life = cell._net_oldLife
    @mapChanges = {}

helpers.extend BoloClientWorld.prototype, require('./mixin')
allObjects.registerWithWorld BoloClientWorld.prototype


## Exports
module.exports = BoloClientWorld
