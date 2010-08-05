// Constants used for conversion between units.
// The naming convention here is to always have the larger unit first.

// A single tile's size in world units.
var TILE_SIZE_WORLD = 256;
// A single tile's size in CSS pixels.
var TILE_SIZE_PIXEL = 32;

// A single CSS pixel's size in world units.
var PIXEL_SIZE_WORLD = 8;

// The map's total size in tiles.
var MAP_SIZE_TILES = 256;

// The game tick length in milliseconds.
var TICK_LENGTH_MS = 20;


// Global variables.

// The tilemap Image object.
var tilemap = null;
// The jQuery object referring to the canvas.
var canvas = null;
// The canvas 2D drawing context.
var c = null;

// Structure that holds the different terrain types and their properties.
// The ASCII character is mapped to an object.
var terrainTypes = null;
// The singleton terrain map. Besides an object with methods, it is also a two-dimensional
// array of MapCells, indexed as map[y][x].
var map = null;

// The Tank object controlled by the player.
var player = null;
