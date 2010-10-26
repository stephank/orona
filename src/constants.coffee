# Constants used for conversion between units.
# The naming convention here is to always have the larger unit first and singular, and the smaller
# unit last and plural.

# A single CSS pixel's size in world units.
exports.PIXEL_SIZE_WORLD = 8

# A single tile's size in pixels and world units.
exports.TILE_SIZE_PIXELS = 32
exports.TILE_SIZE_WORLD = exports.TILE_SIZE_PIXELS * exports.PIXEL_SIZE_WORLD

# The map's total size in tiles, pixels and world units.
exports.MAP_SIZE_TILES = 256
exports.MAP_SIZE_PIXELS = exports.MAP_SIZE_TILES * exports.TILE_SIZE_PIXELS
exports.MAP_SIZE_WORLD = exports.MAP_SIZE_TILES * exports.TILE_SIZE_WORLD

# The game tick length in milliseconds.
exports.TICK_LENGTH_MS = 20
