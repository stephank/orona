###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{floor, ceil}      = Math
{TILE_SIZE_PIXEL}  = require '../constants'
{Common2dRenderer} = require './common_2d'


# This is probably the simplest possible renderer there is. It simply
# draws the map tile-for-tile each frame. This method appears to be
# fairly slow, at the time of writing.

class Direct2dRenderer extends Common2dRenderer
  onRetile: (cell, tx, ty) ->
    # Simply cache the tile index.
    cell.tile = [tx, ty]

  drawMap: (sx, sy, w, h) ->
    # Calculate pixel boundaries.
    ex = sx + w - 1
    ey = sy + h - 1

    # Calculate tile boundaries.
    stx = floor(sx / TILE_SIZE_PIXEL)
    sty = floor(sy / TILE_SIZE_PIXEL)
    etx =  ceil(ex / TILE_SIZE_PIXEL)
    ety =  ceil(ey / TILE_SIZE_PIXEL)

    # Iterate each tile in view.
    @map.each (cell) =>
      @drawTile cell.tile[0], cell.tile[1], cell.x * TILE_SIZE_PIXEL, cell.y * TILE_SIZE_PIXEL
    , stx, sty, etx, ety


# Exports
exports.Direct2dRenderer = Direct2dRenderer
