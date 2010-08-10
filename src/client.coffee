###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{round, floor, ceil, cos, sin, PI}  = Math
{Tank}                              = require './tank'
{MapCell, MapView, Map}             = require './map'
{TILE_SIZE_PIXEL, PIXEL_SIZE_WORLD,
 TICK_LENGTH_MS, MAP_SIZE_TILES}    = require './constants'


# Global variables.

# The tilemap Image object.
tilemap = null
# The jQuery object referring to the canvas.
canvas = null
# The jQuery object referring to the HUD.
hud = null
# The canvas 2D drawing context.
c = null
# The map view we use to draw the map.
mapview = null
# The game state object.
game = null


init = ->
  # First, make sure the tilemap is loaded.
  unless tilemap?
    tilemap = new Image()
    $(tilemap).load(init)
    # FIXME: Handle errors
    tilemap.src = 'img/tiles2x.png'
    return

  # Initialize the canvas.
  canvas = $('#game')
  handleResize(); $(window).resize(handleResize)
  c = canvas[0].getContext('2d')

  # Install key handlers.
  $(document).keydown(handleKeydown).keyup(handleKeyup)

  # Fetch and load the map.
  $.ajax(
    url: 'maps/everard-island.txt'
    dataType: 'text'
    success: (data) ->
      # Initialize the game state object.
      game = {}

      # Initialize the map.
      mapview = new OffscreenMapView()
      game.map = new Map(mapview)

      # Load the data we received into the map.
      game.map.load data

      # Create a player tank.
      startingPos = game.map.getRandomStart()
      game.player = new Tank(game, startingPos)

      # Initialize the HUD.
      hud = $('#hud')
      initHud()

      # Start the game loop.
      start()
  )


# Event handlers.

handleResize = ->
  canvas[0].width  = window.innerWidth
  canvas[0].height = window.innerHeight
  canvas.css(
    width:  window.innerWidth + 'px'
    height: window.innerHeight + 'px'
  )

handleKeydown = (e) ->
  return unless game?
  switch e.which
    when 32 then game.player.shooting = yes
    when 37 then game.player.turningCounterClockwise = yes
    when 38 then game.player.accelerating = yes
    when 39 then game.player.turningClockwise = yes
    when 40 then game.player.braking = yes
    else return
  e.preventDefault()

handleKeyup = (e) ->
  return unless game?
  switch e.which
    when 32 then game.player.shooting = no
    when 37 then game.player.turningCounterClockwise = no
    when 38 then game.player.accelerating = no
    when 39 then game.player.turningClockwise = no
    when 40 then game.player.braking = no
    else return
  e.preventDefault()


# Game loop.

gameTimer = null
lastTick = null

start = ->
  return if gameTimer?

  tick()
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
    tick()
    lastTick += TICK_LENGTH_MS
  draw()


# Simulation.

tick = ->
  game.player.update()


# Graphics.

draw = ->
  c.save()

  # Apply a translation that centers everything around the player.
  {width, height} = canvas[0]
  left = round(game.player.x / PIXEL_SIZE_WORLD - width  / 2)
  top =  round(game.player.y / PIXEL_SIZE_WORLD - height / 2)
  c.translate(-left, -top)

  # Draw all canvas elements.
  mapview.draw(left, top, width, height)
  drawTank(game.player)
  drawOverlay()

  c.restore()

  updateHud()

class OffscreenMapView extends MapView
  constructor: ->
    @canvas = $('<canvas/>')[0]
    @canvas.width = @canvas.height = MAP_SIZE_TILES * TILE_SIZE_PIXEL
    @ctx = @canvas.getContext('2d')

  onRetile: (cell, tx, ty) ->
    @ctx.drawImage tilemap,
      tx * TILE_SIZE_PIXEL,     ty * TILE_SIZE_PIXEL,     TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
      cell.x * TILE_SIZE_PIXEL, cell.y * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL

  draw: (sx, sy, w, h) ->
    c.drawImage @canvas, sx, sy, w, h, sx, sy, w, h

drawTank = (tank) ->
  tile = tank.getTile()
  px = round(tank.x / PIXEL_SIZE_WORLD)
  py = round(tank.y / PIXEL_SIZE_WORLD)

  c.drawImage tilemap,
    tile[0] * TILE_SIZE_PIXEL, tile[1] * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
    px - TILE_SIZE_PIXEL / 2,  py - TILE_SIZE_PIXEL / 2,  TILE_SIZE_PIXEL, TILE_SIZE_PIXEL

drawOverlay = ->
  # FIXME: variable firing distance
  # FIXME: hide when dead
  # FIXME: just use the DOM for this?
  distance = 7 * TILE_SIZE_PIXEL
  rad = (256 - game.player.direction) * 2 * PI / 256
  x = round(game.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance)
  y = round(game.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance)

  c.drawImage tilemap,
    17 * TILE_SIZE_PIXEL,    4 * TILE_SIZE_PIXEL,     TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
    x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL

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
  unless location.host == 'localhost'
    $('<div/>').text('This is a work-in-progress; less than alpha quality!').css(
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
