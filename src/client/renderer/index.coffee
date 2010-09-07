###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{MapView} = require '../../map'


# This interface describes the methods a renderer is expected to provide.
# It's not a real class, it isn't used anywhere, it's mostly here for documentation.
class Renderer extends MapView
  # The constructor takes the Image object that represents the tilemap image, and the Map instance
  # for the map it needs to draw. Once the constructor finishes, Map#setView is called to hook up
  # this renderer instance, which causes onRetile to be invoked once for each tile to initialize.
  constructor: (images, map) ->

  # This methods takes x and y coordinates to center the screen on. The callback provided should be
  # invoked exactly once. Any drawing operations used from within the callback will have a
  # translation applied so that the given coordinates become the center on the screen.
  centerOn: (x, y, cb) ->

  # Draw the tile (tx,ty), which are x and y indices in the base tilemap (and not pixel
  # coordinates), so that the top left corner of the tile is placed at (sdx,sdy) pixel coordinates
  # on the screen. The destination coordinates may be subject to translation from centerOn.
  drawTile: (tx, ty, sdx, sdy) ->

  # Similar to drawTile, but draws from the styled tilemap. Takes an additional parameter `style`,
  # which is a selection from the team colors. The overlay tile is drawn in this color on top of
  # the tile from the styled tilemap. If the style doesn't exist, no overlay is drawn.
  drawStyledTile: (tx, ty, style, sdx, sdy) ->

  # Draw the map section that intersects with the given boundary box (sx,sy,w,h). The boundary
  # box is given in pixel coordinates. This may very well be a no-op if the renderer can do all of
  # its work in onRetile.
  drawMap: (sx, sy, w, h) ->

  # Inherited from MapView.
  onRetile: (cell, tx, ty) ->


# Exports.
module.exports = Renderer
