# This is a base class used to share common code between the Canvas2D renderers. It deals with a
# fair amount of work concerning canvas initialization, preparing styled tilemaps and drawing
# individual tiles. Subclasses differ mostly in the way they deal with drawing the map.


{min, round, PI, sin, cos} = Math
{TILE_SIZE_PIXELS, PIXEL_SIZE_WORLD} = require '../../constants'
{distance, heading} = require '../../helpers'
BaseRenderer = require './base'
TEAM_COLORS  = require '../../team_colors'


class Common2dRenderer extends BaseRenderer

  setup: ->
    # Initialize the canvas.
    try
      @ctx = @canvas[0].getContext('2d')
      @ctx.drawImage  # Just access it, see if it throws.
    catch e
      throw "Could not initialize 2D canvas: #{e.message}"

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
    [left, top, width, height] = @getViewAreaAtWorld x, y
    @ctx.translate(-left, -top)
    cb left, top, width, height
    @ctx.restore()

  drawBuilderIndicator: (b) ->
    player = b.owner.$
    return if (dist = distance(player, b)) <= 128
    px = player.x / PIXEL_SIZE_WORLD; py = player.y / PIXEL_SIZE_WORLD
    @ctx.save()

    @ctx.globalCompositeOperation = 'source-over'
    @ctx.globalAlpha = min(1.0, (dist - 128) / 1024)
    offset = min(50, dist / 10240 * 50) + 32
    rad = heading(player, b)
    @ctx.beginPath()
    @ctx.moveTo(x = px + cos(rad) * offset, y = py + sin(rad) * offset)
    rad += PI
    @ctx.lineTo(x + cos(rad - 0.4) * 10, y + sin(rad - 0.4) * 10)
    @ctx.lineTo(x + cos(rad + 0.4) * 10, y + sin(rad + 0.4) * 10)
    @ctx.closePath()
    @ctx.fillStyle = 'yellow'
    @ctx.fill()

    @ctx.restore()

  drawNames: ->
    @ctx.save()
    @ctx.strokeStyle = @ctx.fillStyle = 'white'
    @ctx.font = 'sans-serif 11px'
    @ctx.textBaselines = 'alphabetic'
    @ctx.textAlign = 'left'
    player = @world.player
    for tank in @world.tanks when tank.name and tank.armour != 255 and tank != player
      if player
        continue if (dist = distance(player, tank)) <= 768
        @ctx.globalAlpha = min(1.0, (dist - 768) / 1536)
      else
        @ctx.globalAlpha = 1.0
      metrics = @ctx.measureText tank.name
      @ctx.beginPath()
      @ctx.moveTo(
        x = round(tank.x / PIXEL_SIZE_WORLD) + 16,
        y = round(tank.y / PIXEL_SIZE_WORLD) - 16)
      @ctx.lineTo x += 12, y -= 9
      @ctx.lineTo x + metrics.width, y
      @ctx.stroke()
      @ctx.fillText tank.name, x, y - 2
    @ctx.restore()

#### Exports
module.exports = Common2dRenderer
