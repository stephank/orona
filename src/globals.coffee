###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# FIXME: This should be refactored into the modules.


# Constants used for conversion between units.
# The naming convention here is to always have the larger unit first.

# A single tile's size in world units.
window.TILE_SIZE_WORLD = 256
# A single tile's size in CSS pixels.
window.TILE_SIZE_PIXEL = 32

# A single CSS pixel's size in world units.
window.PIXEL_SIZE_WORLD = 8

# The map's total size in tiles.
window.MAP_SIZE_TILES = 256

# The game tick length in milliseconds.
window.TICK_LENGTH_MS = 20


# Global variables.

# The tilemap Image object.
window.tilemap = null
# The jQuery object referring to the canvas.
window.canvas = null
# The jQuery object referring to the HUD.
window.hud = null
# The canvas 2D drawing context.
window.c = null

# Structure that holds the different terrain types and their properties.
# The ASCII character is mapped to an object.
window.terrainTypes = null
# The singleton terrain map. Besides an object with methods, it is also a two-dimensional
# array of MapCells, indexed as map[y][x].
window.map = null

# The Tank object controlled by the player.
window.player = null
