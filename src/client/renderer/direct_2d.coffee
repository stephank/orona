# The Direct2D renderer is probably the simplest possible renderer there is. It has nothing to do
# with the DirectX technology. The name simply means that is draws the map tile-for-tile each frame.
# This method appears to be fairly slow, at the time of writing.


{floor, ceil}      = Math
{TILE_SIZE_PIXELS} = require '../../constants'
Common2dRenderer   = require './common_2d'


class Direct2dRenderer extends Common2dRenderer
  onRetile: (cell, tx, ty) ->
    # Simply cache the tile index.
    cell.tile = [tx, ty]

  drawMap: (sx, sy, w, h) ->
    # Calculate pixel boundaries.
    ex = sx + w - 1
    ey = sy + h - 1

    # Calculate tile boundaries.
    stx = floor(sx / TILE_SIZE_PIXELS)
    sty = floor(sy / TILE_SIZE_PIXELS)
    etx =  ceil(ex / TILE_SIZE_PIXELS)
    ety =  ceil(ey / TILE_SIZE_PIXELS)

    # Iterate each tile in view.
    @sim.map.each (cell) =>
      if obj = cell.pill || cell.base
        @drawStyledTile cell.tile[0], cell.tile[1], obj.owner?.team,
            cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS
      else
        @drawTile       cell.tile[0], cell.tile[1],
            cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS
    , stx, sty, etx, ety


#### Exports
module.exports = Direct2dRenderer
