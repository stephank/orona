# This renderer builds on the Direct2dRenderr, but caches segments of the map, and then blits these
# larger segments rather than individual tiles. The idea is to reduce the large amount of drawImage
# calls.
#
# At the time of writing, this doesn't appear to increase performance in Chromium at all, compared
# to Direct2dRenderer. However, Firefox does get a really nice speed boost out of it.


{floor}            = Math
{TILE_SIZE_PIXELS,
 MAP_SIZE_TILES}   = require '../../constants'
Common2dRenderer   = require './common_2d'


# The width and height of segments. The total map size in tiles should be divisible by this number.
SEGMENT_SIZE_TILES = 16
# The width and height of the map in segments.
MAP_SIZE_SEGMENTS = MAP_SIZE_TILES / SEGMENT_SIZE_TILES
# The width and height of a segment in pixels.
SEGMENT_SIZE_PIXEL = SEGMENT_SIZE_TILES * TILE_SIZE_PIXELS


#### Cached segment

# This class represents a single map segment.
class CachedSegment
  constructor: (@renderer, x, y) ->
    # Tile bounds
    @sx = x * SEGMENT_SIZE_TILES
    @sy = y * SEGMENT_SIZE_TILES
    @ex = @sx + SEGMENT_SIZE_TILES - 1
    @ey = @sy + SEGMENT_SIZE_TILES - 1

    # Pixel bounds
    @psx = x * SEGMENT_SIZE_PIXEL
    @psy = y * SEGMENT_SIZE_PIXEL
    @pex = @psx + SEGMENT_SIZE_PIXEL - 1
    @pey = @psy + SEGMENT_SIZE_PIXEL - 1

    @canvas = null

  isInView: (sx, sy, ex, ey) ->
    # Compare canvas pixel bounds to our own.
    # We can reduce the number of conditions by checking if we don't overlap, rather than if we do.
    if      ex < @psx or ey < @psy then false
    else if sx > @pex or sy > @pey then false
    else true

  build: ->
    # Create the canvas.
    @canvas = $('<canvas/>')[0]
    @canvas.width = @canvas.height = SEGMENT_SIZE_PIXEL
    @ctx = @canvas.getContext('2d')

    # Apply a permanent translation, so we can draw regular map pixel coordinates.
    @ctx.translate(-@psx, -@psy)

    # Iterate the map tiles in this segment, and draw them.
    @renderer.sim.map.each (cell) =>
      @onRetile(cell, cell.tile[0], cell.tile[1])
    , @sx, @sy, @ex, @ey

  clear: ->
    @canvas = @ctx = null

  onRetile: (cell, tx, ty) ->
    return unless @canvas
    if obj = cell.pill || cell.base
      @renderer.drawStyledTile cell.tile[0], cell.tile[1], obj.owner?.$.team,
          cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, @ctx
    else
      @renderer.drawTile       cell.tile[0], cell.tile[1],
          cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, @ctx


#### Renderer

# The off-screen renderer keeps a 2D array of instances of MapSegment.
class Offscreen2dRenderer extends Common2dRenderer
  constructor: (images, soundkit, sim) ->
    super

    @cache = new Array(MAP_SIZE_SEGMENTS)
    for y in [0...MAP_SIZE_SEGMENTS]
      row = @cache[y] = new Array(MAP_SIZE_SEGMENTS)
      for x in [0...MAP_SIZE_SEGMENTS]
        row[x] = new CachedSegment(this, x, y)

  # When a cell is retiled, we store the tile index and update the segment.
  onRetile: (cell, tx, ty) ->
    cell.tile = [tx, ty]

    segx = floor(cell.x / SEGMENT_SIZE_TILES)
    segy = floor(cell.y / SEGMENT_SIZE_TILES)
    @cache[segy][segx].onRetile(cell, tx, ty)

  # Drawing the map is a matter of iterating the map segments that are on-screen, and blitting
  # the off-screen canvas to the main canvas. The segments are prepared on-demand from here, and
  # extra care is taken to only build one segment per frame.
  drawMap: (sx, sy, w, h) ->
    ex = sx + w - 1
    ey = sy + h - 1

    alreadyBuiltOne = no
    for row in @cache
      for segment in row
        # Skip if not in view.
        if not segment.isInView(sx, sy, ex, ey)
          segment.clear() if segment.canvas
          continue

        # Make sure the segment buffer is available.
        unless segment.canvas
          continue if alreadyBuiltOne
          segment.build()
          alreadyBuiltOne = yes

        # Blit the segment to the screen.
        @ctx.drawImage segment.canvas,
          0,           0,           SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL,
          segment.psx, segment.psy, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL

    return


#### Exports
module.exports = Offscreen2dRenderer
