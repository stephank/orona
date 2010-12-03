(function() {
  exports.PIXEL_SIZE_WORLD = 8;
  exports.TILE_SIZE_PIXELS = 32;
  exports.TILE_SIZE_WORLD = exports.TILE_SIZE_PIXELS * exports.PIXEL_SIZE_WORLD;
  exports.MAP_SIZE_TILES = 256;
  exports.MAP_SIZE_PIXELS = exports.MAP_SIZE_TILES * exports.TILE_SIZE_PIXELS;
  exports.MAP_SIZE_WORLD = exports.MAP_SIZE_TILES * exports.TILE_SIZE_WORLD;
  exports.TICK_LENGTH_MS = 20;
}).call(this);
