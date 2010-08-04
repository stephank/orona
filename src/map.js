// Constructor.
var MapCell = function(x, y) {
  this.x = x;
  this.y = y;
  this.type = '^';
  this.tile = [0, 0];
  this.mine = true;
};

// Get the cell at offset +dx+,+dy+ from this cell.
// Most commonly used to get one of the neighbouring cells.
// Will return a dummy deep sea cell if the location is off the map.
MapCell.prototype.neigh = function(dx, dy) {
  var x = this.x + dx,
      y = this.y + dy;
  return map.cellAtTile(x, y);
};

// Check whether the cell is one of the give types.
MapCell.prototype.isType = function() {
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] === this.type)
      return true;
  }
  return false;
};

// Cache the tile index to use for drawing this cell.
MapCell.prototype.setTile = function(tx, ty) {
  this.tile = [tx, ty];
};

// Retile this cell. See map#retile.
MapCell.prototype.retile = function() {
  if (this.pill) {
    // FIXME: allegiance
    this.setTile(this.pill.armour, 4);
  }
  else if (this.base) {
    // FIXME: allegiance
    this.setTile(16, 4);
  }
  else {
    switch (this.type) {
      case '^': this.retileDeepSea(); break;
      case '|': this.retileBuilding(); break;
      case ' ': this.retileRiver(); break;
      case '~': this.setTile(7, 1); break;
      case '%': this.setTile(5, 1); break;
      case '=': this.retileRoad(); break;
      case '#': this.retileForest(); break;
      case ':': this.setTile(4, 1); break;
      case '.': this.setTile(2, 1); break;
      case '}': this.setTile(8, 1); break;
      case 'b': this.retileBoat(); break;
    }

    // FIXME: draw mine
  }
};

MapCell.prototype.retileDeepSea = function() {
  var self = this;

  // We only care if our neighbours are deep sea, water or land.
  var neighbourSignificance = function(dx, dy) {
    var n = self.neigh(dx, dy);
    if (n.isType('^')) return 'd';
    if (n.isType(' ', 'b')) return 'w';
    return 'l';
  };

  var above      = neighbourSignificance( 0, -1);
  var aboveRight = neighbourSignificance( 1, -1);
  var right      = neighbourSignificance( 1,  0);
  var belowRight = neighbourSignificance( 1,  1);
  var below      = neighbourSignificance( 0,  1);
  var belowLeft  = neighbourSignificance(-1,  1);
  var left       = neighbourSignificance(-1,  0);
  var aboveLeft  = neighbourSignificance(-1, -1);

  if (aboveLeft !== 'd' && above !== 'd' && left !== 'd' && right === 'd' && below === 'd')
    this.setTile(10, 3);
  else if (aboveRight !== 'd' && above !== 'd' && right !== 'd' && left === 'd' && below === 'd')
    this.setTile(11, 3);
  else if (belowRight !== 'd' && below !== 'd' && right !== 'd' && left === 'd' && above === 'd')
    this.setTile(13, 3);
  else if (belowLeft !== 'd' && below !== 'd' && left !== 'd' && right === 'd' && above === 'd')
    this.setTile(12, 3);
  else if (left === 'w' && right === 'd')
    this.setTile(14, 3);
  else if (below === 'w' && above === 'd')
    this.setTile(15, 3);
  else if (above === 'w' && below === 'd')
    this.setTile(16, 3);
  else if (right === 'w' && left === 'd')
    this.setTile(17, 3);
  else
    this.setTile(0, 0);
};

MapCell.prototype.retileBuilding = function() {
  var self = this;

  // We only care if our neighbours are buildings or not.
  var neighbourSignificance = function(dx, dy) {
    var n = self.neigh(dx, dy);
    if (n.isType('|', '}')) return 'b';
    return 'o';
  };

  var above      = neighbourSignificance( 0, -1);
  var aboveRight = neighbourSignificance( 1, -1);
  var right      = neighbourSignificance( 1,  0);
  var belowRight = neighbourSignificance( 1,  1);
  var below      = neighbourSignificance( 0,  1);
  var belowLeft  = neighbourSignificance(-1,  1);
  var left       = neighbourSignificance(-1,  0);
  var aboveLeft  = neighbourSignificance(-1, -1);

  if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b')
    this.setTile(17, 1);
  else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b')
    this.setTile(30, 1);
  else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft === 'b')
    this.setTile(22, 2);
  else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft === 'b' && belowRight !== 'b' && belowLeft !== 'b')
    this.setTile(23, 2);
  else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight === 'b' && belowLeft !== 'b')
    this.setTile(24, 2);
  else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight === 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b')
    this.setTile(25, 2);

  else if (aboveLeft === 'b' && above === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b')
    this.setTile(16, 2);
  else if (above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b')
    this.setTile(17, 2);
  else if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b')
    this.setTile(18, 2);
  else if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b')
    this.setTile(19, 2);

  else if (left === 'b' && right === 'b' && above === 'b' && below === 'b' && aboveRight === 'b' && belowLeft === 'b' && aboveLeft !== 'b' && belowRight !== 'b')
    this.setTile(20, 2);
  else if (left === 'b' && right === 'b' && above === 'b' && below === 'b' && belowRight === 'b' && aboveLeft === 'b' && aboveRight !== 'b' && belowLeft !== 'b')
    this.setTile(21, 2);

  else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b' && aboveRight === 'b')
    this.setTile(8, 2);
  else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && aboveLeft === 'b')
    this.setTile(9, 2);
  else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight === 'b')
    this.setTile(10, 2);
  else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && aboveLeft === 'b' && aboveRight === 'b')
    this.setTile(11, 2);
  else if (above === 'b' && below === 'b' && left === 'b' && right !== 'b' && belowLeft === 'b' && aboveLeft !== 'b')
    this.setTile(12, 2);
  else if (above === 'b' && below === 'b' && right === 'b' && belowRight === 'b' && left !== 'b' && aboveRight !== 'b')
    this.setTile(13, 2);
  else if (above === 'b' && below === 'b' && right === 'b' && aboveRight === 'b' && belowRight !== 'b')
    this.setTile(14, 2);
  else if (above === 'b' && below === 'b' && left === 'b' && aboveLeft === 'b' && belowLeft !== 'b')
    this.setTile(15, 2);

  else if (right === 'b' && above === 'b' && left === 'b' && below !== 'b' && aboveLeft !== 'b' && aboveRight !== 'b')
    this.setTile(26, 1);
  else if (right === 'b' && below === 'b' && left === 'b' && belowLeft !== 'b' && belowRight !== 'b')
    this.setTile(27, 1);
  else if (right === 'b' && above === 'b' && below === 'b' && aboveRight !== 'b' && belowRight !== 'b')
    this.setTile(28, 1);
  else if (below === 'b' && above === 'b' && left === 'b' && aboveLeft !== 'b' && belowLeft !== 'b')
    this.setTile(29, 1);

  else if (left === 'b' && right === 'b' && above === 'b' && aboveRight === 'b' && aboveLeft !== 'b')
    this.setTile(4, 2);
  else if (left === 'b' && right === 'b' && above === 'b' && aboveLeft === 'b' && aboveRight !== 'b')
    this.setTile(5, 2);
  else if (left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight !== 'b')
    this.setTile(6, 2);
  else if (left === 'b' && right === 'b' && below === 'b' && above !== 'b' && belowRight === 'b' && belowLeft !== 'b')
    this.setTile(7, 2);

  else if (right === 'b' && above === 'b' && below === 'b')
    this.setTile(0, 2);
  else if (left === 'b' && above === 'b' && below === 'b')
    this.setTile(1, 2);
  else if (right === 'b' && left === 'b' && below === 'b')
    this.setTile(2, 2);
  else if (right === 'b' && above === 'b' && left === 'b')
    this.setTile(3, 2);

  else if (right === 'b' && below === 'b' && belowRight === 'b')
    this.setTile(18, 1);
  else if (left === 'b' && below === 'b' && belowLeft === 'b')
    this.setTile(19, 1);
  else if (right === 'b' && above === 'b' && aboveRight === 'b')
    this.setTile(20, 1);
  else if (left === 'b' && above === 'b' && aboveLeft === 'b')
    this.setTile(21, 1);

  else if (right === 'b' && below === 'b')
    this.setTile(22, 1);
  else if (left === 'b' && below === 'b')
    this.setTile(23, 1);
  else if (right === 'b' && above === 'b')
    this.setTile(24, 1);
  else if (left === 'b' && above === 'b')
    this.setTile(25, 1);
  else if (left === 'b' && right === 'b')
    this.setTile(11, 1);
  else if (above === 'b' && below === 'b')
    this.setTile(12, 1);
  else if (right === 'b')
    this.setTile(13, 1);
  else if (left === 'b')
    this.setTile(14, 1);
  else if (below === 'b')
    this.setTile(15, 1);
  else if (above === 'b')
    this.setTile(16, 1);
  else
    this.setTile(6, 1);
};

MapCell.prototype.retileRiver = function() {
  var self = this;

  // We only care if our neighbours are road, water, or land.
  var neighbourSignificance = function(dx, dy) {
    var n = self.neigh(dx, dy);
    if (n.type == '=') return 'r';
    if (n.isType('^', ' ', 'b')) return 'w';
    return 'l';
  };

  var above = neighbourSignificance( 0, -1);
  var right = neighbourSignificance( 1,  0);
  var below = neighbourSignificance( 0,  1);
  var left  = neighbourSignificance(-1,  0);

  if (above === 'l' && below === 'l' && right === 'l' && left === 'l')
    this.setTile(30, 2);
  else if (above === 'l' && below === 'l' && right === 'w' && left === 'l')
    this.setTile(26, 2);
  else if (above === 'l' && below === 'l' && right === 'l' && left === 'w')
    this.setTile(27, 2);
  else if (above === 'l' && below === 'w' && right === 'l' && left === 'l')
    this.setTile(28, 2);
  else if (above === 'w' && below === 'l' &&  right === 'l' && left === 'l')
    this.setTile(29, 2);

  else if (above === 'l' && left === 'l')
    this.setTile(6, 3);
  else if (above === 'l' && right === 'l')
    this.setTile(7, 3);
  else if (below === 'l' && left === 'l')
    this.setTile(8, 3);
  else if (below === 'l' && right === 'l')
    this.setTile(9, 3);
  else if (below === 'l' && above === 'l' && below === 'l')
    this.setTile(0, 3);
  else if (left === 'l' && right === 'l')
    this.setTile(1, 3);
  else if (left === 'l')
    this.setTile(2, 3);
  else if (below === 'l')
    this.setTile(3, 3);
  else if (right === 'l')
    this.setTile(4, 3);
  else if (above === 'l')
    this.setTile(5, 3);

  else
    this.setTile(1, 0);
};

MapCell.prototype.retileRoad = function() {
  var self = this;

  // We only care if our neighbours are road, water, or land.
  var neighbourSignificance = function(dx, dy) {
    var n = self.neigh(dx, dy);
    if (n.type === '=') return 'r';
    if (n.isType('^', ' ', 'b')) return 'w';
    return 'l';
  };

  var above      = neighbourSignificance( 0, -1);
  var aboveRight = neighbourSignificance( 1, -1);
  var right      = neighbourSignificance( 1,  0);
  var belowRight = neighbourSignificance( 1,  1);
  var below      = neighbourSignificance( 0,  1);
  var belowLeft  = neighbourSignificance(-1,  1);
  var left       = neighbourSignificance(-1,  0);
  var aboveLeft  = neighbourSignificance(-1, -1);

  if (aboveLeft !== 'r' && above === 'r' && aboveRight !== 'r' && left === 'r' && right === 'r' && belowLeft !== 'r' && below === 'r' && belowRight !== 'r')
    this.setTile(11, 0);
  else if (above === 'r' && left === 'r' && right === 'r' && below === 'r')
    this.setTile(10, 0);
  else if (left === 'w' && right === 'w' && above === 'w' && below === 'w')
    this.setTile(26, 0);
  else if (right === 'r' && below === 'r' && left === 'w' && above === 'w')
    this.setTile(20, 0);
  else if (left === 'r' && below === 'r' && right === 'w' && above === 'w')
    this.setTile(21, 0);
  else if (above === 'r' && left === 'r' && below === 'w' && right === 'w')
    this.setTile(22, 0);
  else if (right === 'r' && above === 'r'  && left === 'w' && below === 'w')
    this.setTile(23, 0);
  else if(above === 'w' && below === 'w') // left === 'r' || right === 'r'
    this.setTile(24, 0);
  else if(left === 'w' && right === 'w') // above === 'r' || below === 'r'
    this.setTile(25, 0);
  else if (above === 'w' && below === 'r')
    this.setTile(16, 0);
  else if (right === 'w' && left === 'r')
    this.setTile(17, 0);
  else if (below === 'w' && above === 'r')
    this.setTile(18, 0);
  else if (left === 'w' && right === 'r')
    this.setTile(19, 0);

  else if (right === 'r' && below === 'r' && above === 'r' && (aboveRight === 'r' || belowRight === 'r'))
    this.setTile(27, 0);
  else if (left === 'r' && right === 'r' && below === 'r' && (belowLeft === 'r' || belowRight === 'r'))
    this.setTile(28, 0);
  else if (left === 'r' && above === 'r' && below === 'r' && (belowLeft === 'r' || aboveLeft === 'r'))
    this.setTile(29, 0);
  else if (left === 'r' && right === 'r' && above === 'r' && (aboveRight === 'r' || aboveLeft === 'r'))
    this.setTile(30, 0);
  
  else if (left === 'r' && right === 'r' && below === 'r')
    this.setTile(12, 0);
  else if (left === 'r' && above === 'r' && below === 'r')
    this.setTile(13, 0);
  else if (left === 'r' && right === 'r' && above === 'r')
    this.setTile(14, 0);
  else if (right === 'r' && above === 'r' && below === 'r')
    this.setTile(15, 0);
  else if (below === 'r' && right === 'r' && belowRight === 'r')
    this.setTile(6, 0);
  else if (below === 'r' && left === 'r' && belowLeft === 'r')
    this.setTile(7, 0);
  else if (above === 'r' && left === 'r' && aboveLeft === 'r')
    this.setTile(8, 0);
  else if (above === 'r' && right === 'r' && aboveRight === 'r')
    this.setTile(9, 0);
  else if (below === 'r' && right === 'r')
    this.setTile(2, 0);
  else if (below === 'r' && left === 'r')
    this.setTile(3, 0);
  else if (above === 'r' && left === 'r')
    this.setTile(4, 0);
  else if (above === 'r' && right === 'r')
    this.setTile(5, 0);
  else if (right === 'r' || left === 'r')
    this.setTile(0, 1);
  else if (above === 'r' || below === 'r')
    this.setTile(1, 1);
  else
    this.setTile(10, 0);
};

MapCell.prototype.retileForest = function() {
  var above = this.neigh( 0, -1).type;
  var right = this.neigh( 1,  0).type;
  var below = this.neigh( 0,  1).type;
  var left  = this.neigh(-1,  0).type;

  if (above !== '#' && left !== '#' && right === '#' && below === '#')
    this.setTile(9, 9);
  else if (above !== '#' && left === '#' && right !== '#' && below === '#')
    this.setTile(10, 9);
  else if (above === '#' && left === '#' && right !== '#' && below !== '#')
    this.setTile(11, 9);
  else if (above === '#' && left !== '#' && right === '#' && below !== '#')
    this.setTile(12, 9);
  else if (above === '#' && left !== '#' && right !== '#' && below !== '#')
    this.setTile(16, 9);
  else if (above !== '#' && left !== '#' && right !== '#' && below === '#')
    this.setTile(15, 9);
  else if (above !== '#' && left === '#' && right !== '#' && below !== '#')
    this.setTile(14, 9);
  else if (above !== '#' && left !== '#' && right === '#' && below !== '#')
    this.setTile(13, 9);
  else if (above !== '#' && below !== '#' && left !== '#' && right !== '#')
    this.setTile(8, 9);
  else
    this.setTile(3, 1);
};

MapCell.prototype.retileBoat = function() {
  var self = this;

  // We only care if our neighbours are water or land.
  var neighbourSignificance = function(dx, dy) {
    var n = self.neigh(dx, dy);
    if (n.isType('^', ' ', 'b')) return 'w';
    return 'l';
  };

  var above = neighbourSignificance( 0, -1);
  var right = neighbourSignificance( 1,  0);
  var below = neighbourSignificance( 0,  1);
  var left  = neighbourSignificance(-1,  0);

  if (above !== 'w' && left !== 'w')
    this.setTile(15, 6);
  else if (above !== 'w' && right !== 'w')
    this.setTile(16, 6);
  else if (below !== 'w' && right !== 'w')
    this.setTile(17, 6);
  else if (below !== 'w' && left !== 'w')
    this.setTile(14, 6);
  else if (left !== 'w')
    this.setTile(12, 6);
  else if (right !== 'w')
    this.setTile(13, 6);
  else if (below !== 'w')
    this.setTile(10, 6);
  else
    this.setTile(11, 6);
};


// Initialize the map array.
(function() {
  map = new Array(MAP_SIZE_TILES);
  for (var y = 0; y < MAP_SIZE_TILES; y++) {
    var row = map[y] = new Array(MAP_SIZE_TILES);
    for (var x = 0; x < MAP_SIZE_TILES; x++) {
      row[x] = new MapCell(x, y);
    }
  }
}());

// Get the cell at the given tile coordinates, or return a dummy cell.
map.cellAtTile = function(x, y) {
  var row = map[y];
  if (row === undefined) return new MapCell(x, y);
  var cell = row[x];
  if (cell === undefined) return new MapCell(x, y);
  return cell;
};

// Get the cell at the given pixel coordinates, or return a dummy cell.
map.cellAtPixel = function(x, y) {
  return map.cellAtTile(Math.round(this.x / TILE_SIZE_PIXEL), Math.round(this.y / TILE_SIZE_PIXEL));
};

// Get the cell at the given world coordinates, or return a dummy cell.
map.cellAtWorld = function(x, y) {
  return map.cellAtTile(Math.round(this.x / TILE_SIZE_WORLD), Math.round(this.y / TILE_SIZE_WORLD));
};

// Iterate over the map cells, either the complete map or a specific area.
// The callback function will have each cell available as +this+.
map.each = function(cb, sx, sy, ex, ey) {
  if (sx === undefined || sx < 0) sx = 0;
  if (sy === undefined || sy < 0) sy = 0;
  if (ex === undefined || ex >= MAP_SIZE_TILES) ex = MAP_SIZE_TILES - 1;
  if (ey === undefined || ey >= MAP_SIZE_TILES) ey = MAP_SIZE_TILES - 1;

  for (var y = sy; y <= ey; y++) {
    var row = map[y];
    for (var x = sx; x <= ex; x++) {
      cb.apply(row[x]);
    }
  }
};

// Clear the map, or a specific area, by filling it with deep sea tiles.
map.clear = function(sx, sy, ex, ey) {
  this.each(function() {
    this.type = '^';
    this.mine = false;
  }, sx, sy, ex, ey);
};

// Recalculate the tile cache for each cell, or for a specific area.
map.retile = function(sx, sy, ex, ey) {
  this.each(function() {
    this.retile();
  }, sx, sy, ex, ey);
};

// Draw the map area at the given pixel coordinates to the canvas.
map.draw = function(sx, sy, ex, ey) {
  var stx = Math.floor(sx / TILE_SIZE_PIXEL);
  var sty = Math.floor(sy / TILE_SIZE_PIXEL);
  var etx = Math.ceil(ex / TILE_SIZE_PIXEL);
  var ety = Math.ceil(ey / TILE_SIZE_PIXEL);

  map.each(function() {
    var sx = this.tile[0] * TILE_SIZE_PIXEL, sy = this.tile[1] * TILE_SIZE_PIXEL;
    var dx = this.x * TILE_SIZE_PIXEL, dy = this.y * TILE_SIZE_PIXEL;
    c.drawImage(tilemap, sx, sy, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
        dx, dy, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
  }, stx, sty, etx, ety);
};

// Load the map from the string in +data+.
map.load = function(data) {
  map.clear();

  // Determine which kind of newline we're dealing with.
  var i = data.indexOf('\n');
  if (i < 19) throw 'Not a Bolo map.';
  var newline = '\n';
  if (data.charAt(i - 1) === '\r') newline = '\r\n';

  // Read the version line.
  var lines = data.split(newline);
  if (lines[0] !== 'Bolo map, version 0') throw 'Not a Bolo map.';
  if (lines[1] !== '') throw 'Corrupt map.';

  // Iteration helpers
  var line = lines[i = 2];
  var eachInSection = function(section, cb) {
    if (line !== (section + ':')) throw 'Corrupt map.';
    line = lines[++i];
    while (line !== '') {
      if (line.substr(0, 2) !== '  ') throw 'Corrupt map.';
      cb(line.substr(2));
      line = lines[++i];
    }
    line = lines[++i];
  }

  // Read the various sections on map attributes.
  var re, matches;

  map.pills = [];
  re = /^@(\d+),(\d+)\s+owner:(\d+)\s+armour:(\d+)\s+speed:(\d+)$/
  eachInSection('Pillboxes', function(pillDesc) {
    if (!(matches = re.exec(pillDesc))) throw 'Corrupt map.';
    // FIXME: check input
    map.pills.push({
      x: parseInt(matches[1]),
      y: parseInt(matches[2]),
      owner: parseInt(matches[3]),
      armour: parseInt(matches[4]),
      speed: parseInt(matches[5])
    });
  });

  map.bases = [];
  re = /^@(\d+),(\d+)\s+owner:(\d+)\s+armour:(\d+)\s+shells:(\d+)\s+mines:(\d+)$/
  eachInSection('Bases', function(baseDesc) {
    if (!(matches = re.exec(baseDesc))) throw 'Corrupt map.';
    // FIXME: check input
    map.bases.push({
      x: parseInt(matches[1]),
      y: parseInt(matches[2]),
      owner: parseInt(matches[3]),
      armour: parseInt(matches[4]),
      shells: parseInt(matches[5]),
      mines: parseInt(matches[6])
    });
  });

  map.starts = []
  re = /^@(\d+),(\d+)\s+direction:(\d+)$/
  eachInSection('Starting positions', function(startDesc) {
    if (!(matches = re.exec(startDesc))) throw 'Corrupt map.';
    // FIXME: check input
    map.starts.push({
      x: parseInt(matches[1]),
      y: parseInt(matches[2]),
      direction: parseInt(matches[3])
    });
  });

  // Process the terrain.
  for (var y = 0; y < MAP_SIZE_TILES; y++) {
    var line = lines[i + y];
    var row = map[y];
    for (var x = 0; x < MAP_SIZE_TILES; x++) {
      var cell = row[x];
      // FIXME: check input
      cell.type = line.charAt(x * 2);
      if (line.charAt(x * 2 + 1) === '*')
        // FIXME: check if the specific terrain can even have a mine
        cell.mine = true;
    }
  }

  // Link pills and bases to their cells.
  for (i = 0; i < map.pills.length; i++) {
    var pill = map.pills[i];
    pill.cell = map[pill.y][pill.x];
    pill.cell.pill = pill;
  }
  for (i = 0; i < map.bases.length; i++) {
    var base = map.bases[i];
    base.cell = map[base.y][base.x];
    base.cell.base = base;
    // Override cell type.
    base.cell.type = '=';
    base.cell.mine = false;
  }

  // Update DOM.
  map.retile();
};
