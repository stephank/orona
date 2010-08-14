###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{floor, ceil}     = Math
{MapView}         = require '../map'
{TILE_SIZE_PIXEL} = require '../constants'


# This is probably the simplest possible map view there is. It simply
# draws the map tile for tile each frame. This method appears to be
# fairly slow, at the time of writing.

class Direct2dMapView extends MapView
  constructor: (@tilemap, @map) ->

  onRetile: (cell, tx, ty) ->
    # Simply cache the tile index.
    cell.tile = [tx, ty]

  draw: (c, sx, sy, w, h) ->
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
      # Calculate tilemap coordinates.
      sx = cell.tile[0] * TILE_SIZE_PIXEL
      sy = cell.tile[1] * TILE_SIZE_PIXEL

      # Calculate pixel boundaries of this tile on the map.
      dx = cell.x * TILE_SIZE_PIXEL
      dy = cell.y * TILE_SIZE_PIXEL
      
      # Draw.
      c.drawImage @tilemap,
        sx, sy, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
        dx, dy, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL
    , stx, sty, etx, ety


# Exports
exports.Direct2dMapView = Direct2dMapView
