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
  loaded: ->
    @heartbeatTimer = 0
    @ws = new WebSocket("ws://#{location.host}/demo")
    $(@ws).one 'message', (e) =>
      @receiveMap(e.originalEvent)

  # Callback after the map was received.
  receiveMap: (e) ->
    @map = WorldMap.load decodeBase64(e.data)
    @commonInitialization()
    $(@ws).bind 'message', (e) =>
      @handleMessage(e.originalEvent) if @ws?

  # Callback after the welcome message was received.
  receiveWelcome: (tank) ->
    @player = tank
    @rebuildMapObjects()
    @renderer.initHud()
    @loop.start()

  # Send the heartbeat (an empty message) every 10 ticks / 400ms.
  tick: ->
    super
    if ++@heartbeatTimer == 10
      @heartbeatTimer = 0
      @ws.send('')

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
    e.preventDefault()
    return unless @ws?
    switch e.which
      when 32 then @ws.send net.START_SHOOTING
      when 37 then @ws.send net.START_TURNING_CCW
      when 38 then @ws.send net.START_ACCELERATING
      when 39 then @ws.send net.START_TURNING_CW
      when 40 then @ws.send net.START_BRAKING

  handleKeyup: (e) ->
    e.preventDefault()
    return unless @ws?
    switch e.which
      when 32 then @ws.send net.STOP_SHOOTING
      when 37 then @ws.send net.STOP_TURNING_CCW
      when 38 then @ws.send net.STOP_ACCELERATING
      when 39 then @ws.send net.STOP_TURNING_CW
      when 40 then @ws.send net.STOP_BRAKING

  buildOrder: (action, trees, cell) ->
    return unless @ws?
    trees ||= 0
    @ws.send [net.BUILD_ORDER, action, trees, cell.x, cell.y].join(',')

  #### Network message handlers.

  handleMessage: (e) ->
    @netRestore()
    @processingServerMessages = yes
    data = decodeBase64(e.data)
    pos = 0
    length = data.length
    while pos < length
      command = data[pos++]
      ate = @handleServerCommand command, data, pos
      if ate == -1
        error = yes
        break
      pos += ate
    if pos != length
      console.log "Message length mismatch, processed #{pos} / #{length} bytes"
      error = yes
    if error
      # FIXME: Do something better than this when console is not available.
      console.log "Message was:", data
      @loop.stop()
      @ws.close()
      @ws = null
    @processingServerMessages = no

  handleServerCommand: (command, data, offset) ->
    switch command
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
        # FIXME: Do something better than this when console is not available.
        console.log "Bad command '#{command}' from server, and offset #{offset - 1}"
        # Tell handleMessage to bail.
        -1

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
