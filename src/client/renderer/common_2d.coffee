###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{round}            = Math
{TILE_SIZE_PIXELS,
 PIXEL_SIZE_WORLD} = require '../../constants'


class Common2dRenderer
  constructor: (@tilemap, @map) ->
    # Initialize the canvas.
    @canvas = $('<canvas/>')
    try
      @ctx = @canvas[0].getContext('2d')
      @ctx.drawImage  # Just access it, see if it throws.
    catch e
      throw "Could not initialize 2D canvas: #{e.message}"
    @canvas.appendTo('body')

    # Handle resizes.
    @handleResize()
    $(window).resize => @handleResize()

  handleResize: ->
    @canvas[0].width  = window.innerWidth
    @canvas[0].height = window.innerHeight
    @canvas.css(
      width:  window.innerWidth + 'px'
      height: window.innerHeight + 'px'
    )

  drawTile: (tx, ty, dx, dy) ->
    @ctx.drawImage @tilemap,
      tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS,
      dx,                    dy,                    TILE_SIZE_PIXELS, TILE_SIZE_PIXELS

  centerOnObject: (obj, cb) ->
    @ctx.save()

    # Apply a translation that centers everything around the player.
    {width, height} = @canvas[0]
    left = round(obj.x / PIXEL_SIZE_WORLD - width  / 2)
    top =  round(obj.y / PIXEL_SIZE_WORLD - height / 2)
    @ctx.translate(-left, -top)

    cb left, top, width, height

    @ctx.restore()


# Exports.
module.exports = Common2dRenderer
