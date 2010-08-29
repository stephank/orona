###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{round, cos, sin, PI} = Math
Simulation            = require '..'
net                   = require '../net'
map                   = require '../map'
{unpack}              = require '../struct'
{TILE_SIZE_PIXEL,
 PIXEL_SIZE_WORLD,
 TICK_LENGTH_MS}      = require '../constants'
ClientContext         = require './net'
{decodeBase64}        = require './util'
Offscreen2dRenderer   = require './renderer/offscreen_2d'
EverardIsland         = require './everard'


# Global variables.

# The tilemap Image object.
tilemap = null
# The jQuery object referring to the HUD.
hud = null
# The game state object.
game = null
# The network context.
netctx = null
# The renderer instance to use.
renderer = null
# The WebSocket connection.
ws = null


init = ->
  # First, make sure the tilemap is loaded.
  unless tilemap?
    tilemap = new Image()
    $(tilemap).load(init)
    # FIXME: Handle errors
    tilemap.src = 'img/tiles2x.png'
    return

  # Initialize all the basics.
  hud = $('<div/>').appendTo('body')
  $(document).keydown(handleKeydown).keyup(handleKeyup)

  if location.hostname.split('.')[1] == 'github'
    # Start a local game.
    # FIXME: find a neater way to do this. Perhaps we should have two classes on the client,
    # just like Game on the server, to handle the different situations.
    gameMap = map.load decodeBase64(EverardIsland)
    game = new Simulation(gameMap)
    renderer = new Offscreen2dRenderer(tilemap, game.map)
    game.map.setView(renderer)
    game.player = game.addTank()
    initHud()
    start()
  else
    # Connect and wait for the map.
    ws = new WebSocket("ws://#{location.host}/demo")
    ws.onmessage = (event) ->
      # Load the map we just received.
      gameMap = map.load decodeBase64(event.data)

      # Initialize the game state.
      game = new Simulation(gameMap)
      renderer = new Offscreen2dRenderer(tilemap, game.map)
      game.map.setView(renderer)
      netctx = new ClientContext(game)

      # Initialize the HUD.
      initHud()

      # Reconnect the socket message handler, and receive regular updates.
      # The game loop will start on the welcome message.
      ws.onmessage = handleMessage


# Keyboard event handlers.

handleKeydown = (e) ->
  # Are we networked?
  if ws?
    switch e.which
      when 32 then ws.send net.START_SHOOTING
      when 37 then ws.send net.START_TURNING_CCW
      when 38 then ws.send net.START_ACCELERATING
      when 39 then ws.send net.START_TURNING_CW
      when 40 then ws.send net.START_BRAKING
      else return
  # Or running locally?
  else if game?
    switch e.which
      when 32 then game.player.shooting = yes
      when 37 then game.player.turningCounterClockwise = yes
      when 38 then game.player.accelerating = yes
      when 39 then game.player.turningClockwise = yes
      when 40 then game.player.braking = yes
  # Or just not finished loading at all?
  else
    return
  e.preventDefault()

handleKeyup = (e) ->
  # Are we networked?
  if ws?
    switch e.which
      when 32 then ws.send net.STOP_SHOOTING
      when 37 then ws.send net.STOP_TURNING_CCW
      when 38 then ws.send net.STOP_ACCELERATING
      when 39 then ws.send net.STOP_TURNING_CW
      when 40 then ws.send net.STOP_BRAKING
      else return
  # Or running locally?
  else if game?
    switch e.which
      when 32 then game.player.shooting = no
      when 37 then game.player.turningCounterClockwise = no
      when 38 then game.player.accelerating = no
      when 39 then game.player.turningClockwise = no
      when 40 then game.player.braking = no
      else return
  # Or just not finished loading at all?
  else
    return
  e.preventDefault()


# Socket event handlers.

handleMessage = (e) ->
  netctx.authoritative = yes
  net.inContext netctx, ->
    data = decodeBase64(e.data)
    pos = 0
    length = data.length
    while pos < length
      command = data[pos++]
      ate = handleServerCommand command, data, pos
      return if ate == -1
      pos += ate

handleServerCommand = (command, data, offset) ->
  switch command
    when net.WELCOME_MESSAGE
      # Identify which tank we control.
      tank_idx = unpack('I', data, offset)[0]
      game.player = game.objects[tank_idx]
      # Start the game loop.
      start()
      # We ate 4 bytes.
      4

    when net.CREATE_MESSAGE
      type = net.getTypeFromCode data[offset]
      obj = game.spawn type.fromNetwork
      # Eat the type byte, plus whatever the type needs to deserialize.
      1 + obj.deserialize(data, offset + 1)

    when net.DESTROY_MESSAGE
      obj_idx = unpack('I', data, offset)[0]
      obj = game.objects[obj_idx]
      game.destroy obj
      # We ate 4 bytes.
      4

    when net.MAPCHANGE_MESSAGE
      [x, y, code, mine] = unpack('BBBBf', data, offset)
      ascii = String.fromCharCode(code)
      game.map.cells[y][x].setType(ascii, mine)
      # We ate 5 bytes.
      5

    when net.UPDATE_MESSAGE
      bytes = 0
      for obj in game.objects
        bytes += obj.deserialize data, offset + bytes
      # The sum of what each object needed to deserialize.
      bytes

    else
      # FIXME: nag
      stop()
      ws.close()
      ws = null
      # Tell handleMessage to bail.
      -1


# Game loop.

gameTimer = null
lastTick = null
heartbeatTimer = 0

start = ->
  return if gameTimer?

  # Are we networked or not?
  if netctx != null
    netctx.authoritative = no
    net.inContext netctx, -> game.tick()
  else
    game.tick()
  lastTick = Date.now()

  gameTimer = window.setInterval(timerCallback, TICK_LENGTH_MS)

stop = ->
  return unless gameTimer?

  window.clearInterval(gameTimer)

  gameTimer = null
  lastTick = null

timerCallback = ->
  now = Date.now()
  while now - lastTick >= TICK_LENGTH_MS
    # Are we networked or not?
    if netctx != null
      netctx.authoritative = no
      net.inContext netctx, -> game.tick()
    else
      game.tick()
    lastTick += TICK_LENGTH_MS

    # Send the heartbeat (an empty message) every 10 ticks / 400ms.
    if ws != null and ++heartbeatTimer == 10
      heartbeatTimer = 0
      ws.send('')

  draw()


# Graphics.

draw = ->
  renderer.centerOnObject game.player, (left, top, width, height) ->
    # Draw all canvas elements.
    renderer.drawMap(left, top, width, height)
    for obj in game.objects
      # FIXME: Massive assumption! Actually check if it's a tank.
      drawTank(obj)
    drawOverlay()

  # Update all DOM HUD elements.
  updateHud()

drawTank = (tank) ->
  tile = tank.getTile()
  x = round(tank.x / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXEL / 2
  y = round(tank.y / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXEL / 2

  renderer.drawTile tile[0], tile[1], x, y

drawOverlay = ->
  # FIXME: variable firing distance
  # FIXME: hide when dead
  distance = 7 * TILE_SIZE_PIXEL
  rad = (256 - game.player.direction) * 2 * PI / 256
  x = round(game.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance) - TILE_SIZE_PIXEL / 2
  y = round(game.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance) - TILE_SIZE_PIXEL / 2

  renderer.drawTile 17, 4, x, y

initHud = ->
  # Clear all existing contents
  hud.html('')

  # Create the pillbox status indicator.
  container = $('<div/>', id: 'pillStatus').appendTo(hud)
  $('<div/>', class: 'deco').appendTo(container)
  $('<div/>', class: 'pill').appendTo(container).data('pill', pill) for pill in game.map.pills

  # Create the base status indicator.
  container = $('<div/>', id: 'baseStatus').appendTo(hud)
  $('<div/>', class: 'deco').appendTo(container)
  $('<div/>', class: 'base').appendTo(container).data('base', base) for base in game.map.bases

  # Show WIP notice. This is really a temporary hack, so FIXME someday.
  if location.hostname.split('.')[1] == 'github'
    $('<div/>').html('''
      This is a work-in-progress; less than alpha quality!<br>
      To see multiplayer in action, follow instructions on Github.
    ''').css(
      'position': 'absolute', 'top': '8px', 'left': '0px', 'width': '100%', 'text-align': 'center',
      'font-family': 'monospace', 'font-size': '16px', 'font-weight': 'bold', 'color': 'white'
    ).appendTo(hud);
    $('<a href="http://github.com/stephank/orona"></a>')
      .css('position': 'absolute', 'top': '0px', 'right': '0px')
      .html('<img src="http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub">')
      .appendTo(hud);

  # One-shot update to set all the real-time attributes.
  updateHud()

updateHud = ->
  # Pillboxes.
  $('#pillStatus .pill').each (i, node) =>
    # FIXME: allegiance
    $(node).attr('status', 'neutral')

  # Bases.
  $('#baseStatus .base').each (i, node) =>
    # FIXME: allegiance
    $(node).attr('status', 'neutral')


# Exports.
exports.init = init
exports.start = start
exports.stop = stop
