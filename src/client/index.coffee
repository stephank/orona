###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# FIXME: Better error handling all around.

{round, cos, sin, PI} = Math
Simulation            = require '..'
net                   = require '../net'
map                   = require '../map'
{unpack}              = require '../struct'
{TILE_SIZE_PIXELS,
 PIXEL_SIZE_WORLD,
 TICK_LENGTH_MS}      = require '../constants'
ClientContext         = require './net'
Loader                = require './loader'
{decodeBase64}        = require './base64'
Offscreen2dRenderer   = require './renderer/offscreen_2d'
EverardIsland         = require './everard'


class BaseGame
  constructor: ->
    # Setup the page.
    @hud = $('<div/>').appendTo('body')
    $(document).keydown (e) =>
      @handleKeydown(e) if @sim?
    $(document).keyup (e) =>
      @handleKeyup(e) if @sim?

    # Setup game state.
    @gameTimer = @lastTick = null
    @lastCenter = [0, 0]

    # Load resources.
    loader = new Loader()
    loader.onComplete = =>
      @resources = loader.resources
      @startup()

    loader.image 'base'
    loader.image 'styled'
    loader.image 'overlay'

    loader.finish()

  # Common initialization once the map is available
  commonInitialization: (gameMap) ->
    @sim = new Simulation(gameMap)

    @renderer = new Offscreen2dRenderer(@resources.images, gameMap)
    @sim.map.setView(@renderer)

    @initHud()

  # Game loop.

  start: ->
    return if @gameTimer?

    # Are we networked or not?
    @tick()
    @lastTick = Date.now()

    @gameTimer = window.setInterval =>
      @timerCallback()
    , TICK_LENGTH_MS

  stop: ->
    return unless @gameTimer?
    window.clearInterval(@gameTimer)
    @gameTimer = @lastTick = null

  timerCallback: ->
    now = Date.now()
    while now - @lastTick >= TICK_LENGTH_MS
      @tick()
      @lastTick += TICK_LENGTH_MS
    @draw()


  # Graphics.

  draw: ->
    {x, y} = @sim.player

    # Remember or restore the last center position. We use this after tank
    # death, so as to keep drawing something useful while we fade.
    if x == -1 or y == -1
      [x, y] = @lastCenter
    else
      @lastCenter = [x, y]

    @renderer.centerOn x, y, (left, top, width, height) =>
      # Draw all canvas elements.
      @renderer.drawMap(left, top, width, height)
      for obj in @sim.objects when obj.x? and obj.x != -1 and obj.y? and obj.y != -1
        # FIXME: Massive assumption! Actually check if it's a tank.
        @drawTank(obj)
      @drawOverlay()

    # Update all DOM HUD elements.
    @updateHud()

  drawTank: (tank) ->
    tile = tank.getTile()
    x = round(tank.x / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2
    y = round(tank.y / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2

    @renderer.drawStyledTile tile[0], tile[1], tank.team, x, y

  drawOverlay: ->
    # FIXME: variable firing distance
    # FIXME: hide when dead
    distance = 7 * TILE_SIZE_PIXELS
    rad = (256 - @sim.player.direction) * 2 * PI / 256
    x = round(@sim.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance) - TILE_SIZE_PIXELS / 2
    y = round(@sim.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance) - TILE_SIZE_PIXELS / 2

    @renderer.drawTile 17, 4, x, y

  initHud: ->
    # Clear the HUD container contents.
    @hud.html('')

    # Create the pillbox status indicator.
    container = $('<div/>', id: 'pillStatus').appendTo(@hud)
    $('<div/>', class: 'deco').appendTo(container)
    $('<div/>', class: 'pill').appendTo(container).data('pill', pill) for pill in @sim.map.pills

    # Create the base status indicator.
    container = $('<div/>', id: 'baseStatus').appendTo(@hud)
    $('<div/>', class: 'deco').appendTo(container)
    $('<div/>', class: 'base').appendTo(container).data('base', base) for base in @sim.map.bases

    # Show WIP notice. This is really a temporary hack, so FIXME someday.
    if location.hostname.split('.')[1] == 'github'
      $('<div/>').html('''
        This is a work-in-progress; less than alpha quality!<br>
        To see multiplayer in action, follow instructions on Github.
      ''').css(
        'position': 'absolute', 'top': '8px', 'left': '0px', 'width': '100%', 'text-align': 'center',
        'font-family': 'monospace', 'font-size': '16px', 'font-weight': 'bold', 'color': 'white'
      ).appendTo(@hud);
      $('<a href="http://github.com/stephank/orona"></a>')
        .css('position': 'absolute', 'top': '0px', 'right': '0px')
        .html('<img src="http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub">')
        .appendTo(@hud);

    # One-shot update to set all the real-time attributes.
    @updateHud()

  updateHud: ->
    # Pillboxes.
    @hud.find('#pillStatus .pill').each (i, node) =>
      # FIXME: allegiance
      $(node).attr('status', 'neutral')

    # Bases.
    @hud.find('#baseStatus .base').each (i, node) =>
      # FIXME: allegiance
      $(node).attr('status', 'neutral')


  # Abstract methods.

  # Called after resources are loaded.
  startup: ->

  # Simulate a tick.
  tick: ->

  # Key press handlers.
  handleKeydown: (e) ->
  handleKeyup: (e) ->


class LocalGame extends BaseGame
  startup: ->
    gameMap = map.load decodeBase64(EverardIsland)
    @commonInitialization(gameMap)
    @sim.player = @sim.addTank()
    @start()

  tick: ->
    @sim.tick()

  # Key press handlers.

  handleKeydown: (e) ->
    switch e.which
      when 32 then @sim.player.shooting = yes
      when 37 then @sim.player.turningCounterClockwise = yes
      when 38 then @sim.player.accelerating = yes
      when 39 then @sim.player.turningClockwise = yes
      when 40 then @sim.player.braking = yes
    e.preventDefault()

  handleKeyup: (e) ->
    switch e.which
      when 32 then @sim.player.shooting = no
      when 37 then @sim.player.turningCounterClockwise = no
      when 38 then @sim.player.accelerating = no
      when 39 then @sim.player.turningClockwise = no
      when 40 then @sim.player.braking = no
      else return
    e.preventDefault()


class NetworkGame extends BaseGame
  constructor: ->
    @heartbeatTimer = 0
    super

  startup: ->
    @ws = new WebSocket("ws://#{location.host}/demo")
    $(@ws).one 'message', (e) =>
      @receiveMap(e.originalEvent)

  receiveMap: (e) ->
    gameMap = map.load decodeBase64(e.data)
    @commonInitialization(gameMap)
    @netctx = new ClientContext(@sim)
    $(@ws).bind 'message', (e) =>
      @handleMessage(e.originalEvent) if @ws?

  receiveWelcome: (tank) ->
    @sim.player = tank
    @start()

  tick: ->
    @netctx.authoritative = no
    net.inContext @netctx, =>
      @sim.tick()

    # Send the heartbeat (an empty message) every 10 ticks / 400ms.
    if ++@heartbeatTimer == 10
      @heartbeatTimer = 0
      @ws.send('')

  # Key press handlers.

  handleKeydown: (e) ->
    switch e.which
      when 32 then @ws.send net.START_SHOOTING
      when 37 then @ws.send net.START_TURNING_CCW
      when 38 then @ws.send net.START_ACCELERATING
      when 39 then @ws.send net.START_TURNING_CW
      when 40 then @ws.send net.START_BRAKING
      else return
    e.preventDefault()

  handleKeyup: (e) ->
    switch e.which
      when 32 then @ws.send net.STOP_SHOOTING
      when 37 then @ws.send net.STOP_TURNING_CCW
      when 38 then @ws.send net.STOP_ACCELERATING
      when 39 then @ws.send net.STOP_TURNING_CW
      when 40 then @ws.send net.STOP_BRAKING
      else return
    e.preventDefault()

  # Network message handlers.

  handleMessage: (e) ->
    @netctx.authoritative = yes
    net.inContext @netctx, =>
      data = decodeBase64(e.data)
      pos = 0
      length = data.length
      while pos < length
        command = data[pos++]
        ate = @handleServerCommand command, data, pos
        return if ate == -1
        pos += ate

  handleServerCommand: (command, data, offset) ->
    switch command
      when net.WELCOME_MESSAGE
        tank_idx = unpack('I', data, offset)[0]
        @receiveWelcome @sim.objects[tank_idx]
        # We ate 4 bytes.
        4

      when net.CREATE_MESSAGE
        type = net.getTypeFromCode data[offset]
        obj = @sim.spawn type.fromNetwork
        # Eat the type byte, plus whatever the type needs to deserialize.
        1 + obj.deserialize(data, offset + 1)

      when net.DESTROY_MESSAGE
        obj_idx = unpack('I', data, offset)[0]
        obj = @sim.objects[obj_idx]
        @sim.destroy obj, obj.destroyFromNetwork
        # We ate 4 bytes.
        4

      when net.MAPCHANGE_MESSAGE
        [x, y, code, mine] = unpack('BBBBf', data, offset)
        ascii = String.fromCharCode(code)
        @sim.map.cells[y][x].setType(ascii, mine)
        # We ate 5 bytes.
        5

      when net.UPDATE_MESSAGE
        bytes = 0
        for obj in @sim.objects
          bytes += obj.deserialize data, offset + bytes
        # The sum of what each object needed to deserialize.
        bytes

      else
        # FIXME: nag
        @stop()
        @ws.close()
        @ws = null
        # Tell handleMessage to bail.
        -1


game = null

init = ->
  if location.hostname.split('.')[1] == 'github'
    game = new LocalGame()
  else
    game = new NetworkGame()


# Exports.
exports.init  = init
exports.start = -> game.start()
exports.stop  = -> game.stop()
