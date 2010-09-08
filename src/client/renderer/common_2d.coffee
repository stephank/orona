###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{min, round}       = Math
BaseRenderer       = require '.'
{TILE_SIZE_PIXELS,
 PIXEL_SIZE_WORLD} = require '../../constants'
TEAM_COLORS        = require '../../team_colors'


class Common2dRenderer extends BaseRenderer
  constructor: (images, sim) ->
    super

    # Initialize the canvas.
    @canvas = $('<canvas/>')
    try
      @ctx = @canvas[0].getContext('2d')
      @ctx.drawImage  # Just access it, see if it throws.
    catch e
      throw "Could not initialize 2D canvas: #{e.message}"
    @canvas.appendTo('body')

    # We need to get the raw pixel data from the overlay.
    img = @images.overlay
    # Create a temporary canvas.
    temp = $('<canvas/>')[0]
    temp.width  = img.width
    temp.height = img.height
    # Copy the Image onto the canvas.
    ctx = temp.getContext('2d')
    ctx.globalCompositeOperation = 'copy'
    ctx.drawImage img, 0, 0
    # Get the CanvasPixelArray object representing the overlay.
    imageData = ctx.getImageData 0, 0, img.width, img.height
    @overlay = imageData.data

    # This contains prestyled tilemaps, index by style/team.
    @prestyled = {}

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

  # We use an extra parameter `ctx` here, so that the offscreen renderer can
  # use the context specific to segments.
  drawTile: (tx, ty, dx, dy, ctx) ->
    (ctx || @ctx).drawImage @images.base,
      tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS,
      dx,                    dy,                    TILE_SIZE_PIXELS, TILE_SIZE_PIXELS

  createPrestyled: (color) ->
    # Get the base image and it's width and height.
    base = @images.styled
    {width, height} = base

    # Create the new canvas.
    source = $('<canvas/>')[0]
    source.width  = width
    source.height = height

    # Copy the base image into it.
    ctx = source.getContext('2d')
    ctx.globalCompositeOperation = 'copy'
    ctx.drawImage base, 0, 0

    # Use pixel manipulation to blit the overlay.
    imageData = ctx.getImageData 0, 0, width, height
    data = imageData.data
    for x in [0...width]
      for y in [0...height]
        i = 4 * (y * width + x)
        factor = @overlay[i] / 255
        data[i+0] = round(factor * color.r + (1 - factor) * data[i+0])
        data[i+1] = round(factor * color.g + (1 - factor) * data[i+1])
        data[i+2] = round(factor * color.b + (1 - factor) * data[i+2])
        data[i+3] = min(255, data[i+3] + @overlay[i])
    ctx.putImageData imageData, 0, 0

    # All done, return.
    source

  drawStyledTile: (tx, ty, style, dx, dy, ctx) ->
    # Get the prestyled tilemap, or create it.
    unless source = @prestyled[style]
      source =
        if color = TEAM_COLORS[style]
          @prestyled[style] = @createPrestyled(color)
        else
          @images.styled

    # Draw from the prestyled tilemap.
    (ctx || @ctx).drawImage source,
      tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS,
      dx,                    dy,                    TILE_SIZE_PIXELS, TILE_SIZE_PIXELS

  centerOn: (x, y, cb) ->
    @ctx.save()

    # Apply a translation that centers everything around the player.
    {width, height} = @canvas[0]
    left = round(x / PIXEL_SIZE_WORLD - width  / 2)
    top =  round(y / PIXEL_SIZE_WORLD - height / 2)
    @ctx.translate(-left, -top)

    cb left, top, width, height

    @ctx.restore()


# Exports.
module.exports = Common2dRenderer
