require.define({ 'bolo/map': function(require, exports, module) {
var MAP_SIZE_TILES, Map, MapCell, MapView, TILE_SIZE_PIXEL, TILE_SIZE_WORLD, _a, _b, _c, _d, _e, floor, random, round, terrainTypes, type;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
_a = Math;
round = _a.round;
random = _a.random;
floor = _a.floor;
_b = require('./constants');
TILE_SIZE_WORLD = _b.TILE_SIZE_WORLD;
TILE_SIZE_PIXEL = _b.TILE_SIZE_PIXEL;
MAP_SIZE_TILES = _b.MAP_SIZE_TILES;
terrainTypes = {};
_d = [
  {
    ascii: '^',
    tankSpeed: 3,
    tankTurn: 0.50,
    manSpeed: 0,
    description: 'deep sea'
  }, {
    ascii: '|',
    tankSpeed: 0,
    tankTurn: 0.00,
    manSpeed: 0,
    description: 'building'
  }, {
    ascii: ' ',
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 0,
    description: 'river'
  }, {
    ascii: '~',
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4,
    description: 'swamp'
  }, {
    ascii: '%',
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4,
    description: 'crater'
  }, {
    ascii: '=',
    tankSpeed: 16,
    tankTurn: 1.00,
    manSpeed: 16,
    description: 'road'
  }, {
    ascii: '#',
    tankSpeed: 6,
    tankTurn: 0.50,
    manSpeed: 8,
    description: 'forest'
  }, {
    ascii: ':',
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4,
    description: 'rubble'
  }, {
    ascii: '.',
    tankSpeed: 12,
    tankTurn: 1.00,
    manSpeed: 16,
    description: 'grass'
  }, {
    ascii: '}',
    tankSpeed: 0,
    tankTurn: 0.00,
    manSpeed: 0,
    description: 'shot building'
  }, {
    ascii: 'b',
    tankSpeed: 16,
    tankTurn: 1.00,
    manSpeed: 16,
    description: 'river with boat'
  }
];
for (_c = 0, _e = _d.length; _c < _e; _c++) {
  type = _d[_c];
  terrainTypes[type.ascii] = type;
}
MapCell = function(_f, _g, _h) {
  this.y = _h;
  this.x = _g;
  this.map = _f;
  this.type = terrainTypes['^'];
  this.mine = false;
  return this;
};
MapCell.prototype.getTankSpeed = function(onBoat) {
  if ((this.pill == undefined ? undefined : this.pill.armour) > 0) {
    return 0;
  }
  if (onBoat && this.isType('^', ' ')) {
    return 16;
  }
  return this.type.tankSpeed;
};
MapCell.prototype.getTankTurn = function(onBoat) {
  if ((this.pill == undefined ? undefined : this.pill.armour) > 0) {
    return 0.00;
  }
  if (onBoat && this.isType('^', ' ')) {
    return 1.00;
  }
  return this.type.tankTurn;
};
MapCell.prototype.getManSpeed = function(onBoat) {
  if ((this.pill == undefined ? undefined : this.pill.armour) > 0) {
    return 0;
  }
  if (onBoat && this.isType('^', ' ')) {
    return 16;
  }
  return this.type.manSpeed;
};
MapCell.prototype.neigh = function(dx, dy) {
  return this.map.cellAtTile(this.x + dx, this.y + dy);
};
MapCell.prototype.isType = function() {
  var _f, i;
  _f = arguments.length;
  for (i = 0; (0 <= _f ? i <= _f : i >= _f); (0 <= _f ? i += 1 : i -= 1)) {
    type = arguments[i];
    if (this.type === type || this.type.ascii === type) {
      return true;
    }
  }
  return false;
};
MapCell.prototype.setType = function(newType, retileRadius) {
  var _f;
  retileRadius = retileRadius || 1;
  if (typeof (newType) === 'string') {
    this.type = terrainTypes[newType];
    if (newType.length !== 1 || !(typeof (_f = this.type) !== "undefined" && _f !== null)) {
      throw ("Invalid terrain type: " + (newType));
    }
  } else {
    this.type = newType;
  }
  return this.map.retile(this.x - retileRadius, this.y - retileRadius, this.x + retileRadius, this.y + retileRadius);
};
MapCell.prototype.setTile = function(tx, ty) {
  return this.map.view.onRetile(this, tx, ty);
};
MapCell.prototype.retile = function() {
  var _f, _g, _h;
  if ((typeof (_f = this.pill) !== "undefined" && _f !== null)) {
    return this.setTile(this.pill.armour, 4);
  } else if ((typeof (_g = this.base) !== "undefined" && _g !== null)) {
    return this.setTile(16, 4);
  } else {
    if ((_h = this.type.ascii) === '^') {
      return this.retileDeepSea();
    } else if (_h === '|') {
      return this.retileBuilding();
    } else if (_h === ' ') {
      return this.retileRiver();
    } else if (_h === '~') {
      return this.setTile(7, 1);
    } else if (_h === '%') {
      return this.setTile(5, 1);
    } else if (_h === '=') {
      return this.retileRoad();
    } else if (_h === '#') {
      return this.retileForest();
    } else if (_h === ':') {
      return this.setTile(4, 1);
    } else if (_h === '.') {
      return this.setTile(2, 1);
    } else if (_h === '}') {
      return this.setTile(8, 1);
    } else if (_h === 'b') {
      return this.retileBoat();
    }
  }
};
MapCell.prototype.retileDeepSea = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('^')) {
      return 'd';
    }
    if (n.isType(' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this);
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  if (aboveLeft !== 'd' && above !== 'd' && left !== 'd' && right === 'd' && below === 'd') {
    return this.setTile(10, 3);
  } else if (aboveRight !== 'd' && above !== 'd' && right !== 'd' && left === 'd' && below === 'd') {
    return this.setTile(11, 3);
  } else if (belowRight !== 'd' && below !== 'd' && right !== 'd' && left === 'd' && above === 'd') {
    return this.setTile(13, 3);
  } else if (belowLeft !== 'd' && below !== 'd' && left !== 'd' && right === 'd' && above === 'd') {
    return this.setTile(12, 3);
  } else if (left === 'w' && right === 'd') {
    return this.setTile(14, 3);
  } else if (below === 'w' && above === 'd') {
    return this.setTile(15, 3);
  } else if (above === 'w' && below === 'd') {
    return this.setTile(16, 3);
  } else if (right === 'w' && left === 'd') {
    return this.setTile(17, 3);
  } else {
    return this.setTile(0, 0);
  }
};
MapCell.prototype.retileBuilding = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('|', '}')) {
      return 'b';
    }
    return 'o';
  }, this);
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(17, 1);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b') {
    return this.setTile(30, 1);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft === 'b') {
    return this.setTile(22, 2);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft === 'b' && belowRight !== 'b' && belowLeft !== 'b') {
    return this.setTile(23, 2);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight === 'b' && belowLeft !== 'b') {
    return this.setTile(24, 2);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight === 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b') {
    return this.setTile(25, 2);
  } else if (aboveLeft === 'b' && above === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(16, 2);
  } else if (above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(17, 2);
  } else if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b') {
    return this.setTile(18, 2);
  } else if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(19, 2);
  } else if (left === 'b' && right === 'b' && above === 'b' && below === 'b' && aboveRight === 'b' && belowLeft === 'b' && aboveLeft !== 'b' && belowRight !== 'b') {
    return this.setTile(20, 2);
  } else if (left === 'b' && right === 'b' && above === 'b' && below === 'b' && belowRight === 'b' && aboveLeft === 'b' && aboveRight !== 'b' && belowLeft !== 'b') {
    return this.setTile(21, 2);
  } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b' && aboveRight === 'b') {
    return this.setTile(8, 2);
  } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && aboveLeft === 'b') {
    return this.setTile(9, 2);
  } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight === 'b') {
    return this.setTile(10, 2);
  } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && aboveLeft === 'b' && aboveRight === 'b') {
    return this.setTile(11, 2);
  } else if (above === 'b' && below === 'b' && left === 'b' && right !== 'b' && belowLeft === 'b' && aboveLeft !== 'b') {
    return this.setTile(12, 2);
  } else if (above === 'b' && below === 'b' && right === 'b' && belowRight === 'b' && left !== 'b' && aboveRight !== 'b') {
    return this.setTile(13, 2);
  } else if (above === 'b' && below === 'b' && right === 'b' && aboveRight === 'b' && belowRight !== 'b') {
    return this.setTile(14, 2);
  } else if (above === 'b' && below === 'b' && left === 'b' && aboveLeft === 'b' && belowLeft !== 'b') {
    return this.setTile(15, 2);
  } else if (right === 'b' && above === 'b' && left === 'b' && below !== 'b' && aboveLeft !== 'b' && aboveRight !== 'b') {
    return this.setTile(26, 1);
  } else if (right === 'b' && below === 'b' && left === 'b' && belowLeft !== 'b' && belowRight !== 'b') {
    return this.setTile(27, 1);
  } else if (right === 'b' && above === 'b' && below === 'b' && aboveRight !== 'b' && belowRight !== 'b') {
    return this.setTile(28, 1);
  } else if (below === 'b' && above === 'b' && left === 'b' && aboveLeft !== 'b' && belowLeft !== 'b') {
    return this.setTile(29, 1);
  } else if (left === 'b' && right === 'b' && above === 'b' && aboveRight === 'b' && aboveLeft !== 'b') {
    return this.setTile(4, 2);
  } else if (left === 'b' && right === 'b' && above === 'b' && aboveLeft === 'b' && aboveRight !== 'b') {
    return this.setTile(5, 2);
  } else if (left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight !== 'b') {
    return this.setTile(6, 2);
  } else if (left === 'b' && right === 'b' && below === 'b' && above !== 'b' && belowRight === 'b' && belowLeft !== 'b') {
    return this.setTile(7, 2);
  } else if (right === 'b' && above === 'b' && below === 'b') {
    return this.setTile(0, 2);
  } else if (left === 'b' && above === 'b' && below === 'b') {
    return this.setTile(1, 2);
  } else if (right === 'b' && left === 'b' && below === 'b') {
    return this.setTile(2, 2);
  } else if (right === 'b' && above === 'b' && left === 'b') {
    return this.setTile(3, 2);
  } else if (right === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(18, 1);
  } else if (left === 'b' && below === 'b' && belowLeft === 'b') {
    return this.setTile(19, 1);
  } else if (right === 'b' && above === 'b' && aboveRight === 'b') {
    return this.setTile(20, 1);
  } else if (left === 'b' && above === 'b' && aboveLeft === 'b') {
    return this.setTile(21, 1);
  } else if (right === 'b' && below === 'b') {
    return this.setTile(22, 1);
  } else if (left === 'b' && below === 'b') {
    return this.setTile(23, 1);
  } else if (right === 'b' && above === 'b') {
    return this.setTile(24, 1);
  } else if (left === 'b' && above === 'b') {
    return this.setTile(25, 1);
  } else if (left === 'b' && right === 'b') {
    return this.setTile(11, 1);
  } else if (above === 'b' && below === 'b') {
    return this.setTile(12, 1);
  } else if (right === 'b') {
    return this.setTile(13, 1);
  } else if (left === 'b') {
    return this.setTile(14, 1);
  } else if (below === 'b') {
    return this.setTile(15, 1);
  } else if (above === 'b') {
    return this.setTile(16, 1);
  } else {
    return this.setTile(6, 1);
  }
};
MapCell.prototype.retileRiver = function() {
  var above, below, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('=')) {
      return 'r';
    }
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this);
  above = neighbourSignificance(0, -1);
  right = neighbourSignificance(1, 0);
  below = neighbourSignificance(0, 1);
  left = neighbourSignificance(-1, 0);
  if (above === 'l' && below === 'l' && right === 'l' && left === 'l') {
    return this.setTile(30, 2);
  } else if (above === 'l' && below === 'l' && right === 'w' && left === 'l') {
    return this.setTile(26, 2);
  } else if (above === 'l' && below === 'l' && right === 'l' && left === 'w') {
    return this.setTile(27, 2);
  } else if (above === 'l' && below === 'w' && right === 'l' && left === 'l') {
    return this.setTile(28, 2);
  } else if (above === 'w' && below === 'l' && right === 'l' && left === 'l') {
    return this.setTile(29, 2);
  } else if (above === 'l' && left === 'l') {
    return this.setTile(6, 3);
  } else if (above === 'l' && right === 'l') {
    return this.setTile(7, 3);
  } else if (below === 'l' && left === 'l') {
    return this.setTile(8, 3);
  } else if (below === 'l' && right === 'l') {
    return this.setTile(9, 3);
  } else if (below === 'l' && above === 'l' && below === 'l') {
    return this.setTile(0, 3);
  } else if (left === 'l' && right === 'l') {
    return this.setTile(1, 3);
  } else if (left === 'l') {
    return this.setTile(2, 3);
  } else if (below === 'l') {
    return this.setTile(3, 3);
  } else if (right === 'l') {
    return this.setTile(4, 3);
  } else if (above === 'l') {
    return this.setTile(5, 3);
  } else {
    return this.setTile(1, 0);
  }
};
MapCell.prototype.retileRoad = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('=')) {
      return 'r';
    }
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this);
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  if (aboveLeft !== 'r' && above === 'r' && aboveRight !== 'r' && left === 'r' && right === 'r' && belowLeft !== 'r' && below === 'r' && belowRight !== 'r') {
    return this.setTile(11, 0);
  } else if (above === 'r' && left === 'r' && right === 'r' && below === 'r') {
    return this.setTile(10, 0);
  } else if (left === 'w' && right === 'w' && above === 'w' && below === 'w') {
    return this.setTile(26, 0);
  } else if (right === 'r' && below === 'r' && left === 'w' && above === 'w') {
    return this.setTile(20, 0);
  } else if (left === 'r' && below === 'r' && right === 'w' && above === 'w') {
    return this.setTile(21, 0);
  } else if (above === 'r' && left === 'r' && below === 'w' && right === 'w') {
    return this.setTile(22, 0);
  } else if (right === 'r' && above === 'r' && left === 'w' && below === 'w') {
    return this.setTile(23, 0);
  } else if (above === 'w' && below === 'w') {
    return this.setTile(24, 0);
  } else if (left === 'w' && right === 'w') {
    return this.setTile(25, 0);
  } else if (above === 'w' && below === 'r') {
    return this.setTile(16, 0);
  } else if (right === 'w' && left === 'r') {
    return this.setTile(17, 0);
  } else if (below === 'w' && above === 'r') {
    return this.setTile(18, 0);
  } else if (left === 'w' && right === 'r') {
    return this.setTile(19, 0);
  } else if (right === 'r' && below === 'r' && above === 'r' && (aboveRight === 'r' || belowRight === 'r')) {
    return this.setTile(27, 0);
  } else if (left === 'r' && right === 'r' && below === 'r' && (belowLeft === 'r' || belowRight === 'r')) {
    return this.setTile(28, 0);
  } else if (left === 'r' && above === 'r' && below === 'r' && (belowLeft === 'r' || aboveLeft === 'r')) {
    return this.setTile(29, 0);
  } else if (left === 'r' && right === 'r' && above === 'r' && (aboveRight === 'r' || aboveLeft === 'r')) {
    return this.setTile(30, 0);
  } else if (left === 'r' && right === 'r' && below === 'r') {
    return this.setTile(12, 0);
  } else if (left === 'r' && above === 'r' && below === 'r') {
    return this.setTile(13, 0);
  } else if (left === 'r' && right === 'r' && above === 'r') {
    return this.setTile(14, 0);
  } else if (right === 'r' && above === 'r' && below === 'r') {
    return this.setTile(15, 0);
  } else if (below === 'r' && right === 'r' && belowRight === 'r') {
    return this.setTile(6, 0);
  } else if (below === 'r' && left === 'r' && belowLeft === 'r') {
    return this.setTile(7, 0);
  } else if (above === 'r' && left === 'r' && aboveLeft === 'r') {
    return this.setTile(8, 0);
  } else if (above === 'r' && right === 'r' && aboveRight === 'r') {
    return this.setTile(9, 0);
  } else if (below === 'r' && right === 'r') {
    return this.setTile(2, 0);
  } else if (below === 'r' && left === 'r') {
    return this.setTile(3, 0);
  } else if (above === 'r' && left === 'r') {
    return this.setTile(4, 0);
  } else if (above === 'r' && right === 'r') {
    return this.setTile(5, 0);
  } else if (right === 'r' || left === 'r') {
    return this.setTile(0, 1);
  } else if (above === 'r' || below === 'r') {
    return this.setTile(1, 1);
  } else {
    return this.setTile(10, 0);
  }
};
MapCell.prototype.retileForest = function() {
  var above, below, left, right;
  above = this.neigh(0, -1).isType('#');
  right = this.neigh(1, 0).isType('#');
  below = this.neigh(0, 1).isType('#');
  left = this.neigh(-1, 0).isType('#');
  if (!above && !left && right && below) {
    return this.setTile(9, 9);
  } else if (!above && left && !right && below) {
    return this.setTile(10, 9);
  } else if (above && left && !right && !below) {
    return this.setTile(11, 9);
  } else if (above && !left && right && !below) {
    return this.setTile(12, 9);
  } else if (above && !left && !right && !below) {
    return this.setTile(16, 9);
  } else if (!above && !left && !right && below) {
    return this.setTile(15, 9);
  } else if (!above && left && !right && !below) {
    return this.setTile(14, 9);
  } else if (!above && !left && right && !below) {
    return this.setTile(13, 9);
  } else if (!above && !left && !right && !below) {
    return this.setTile(8, 9);
  } else {
    return this.setTile(3, 1);
  }
};
MapCell.prototype.retileBoat = function() {
  var above, below, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this);
  above = neighbourSignificance(0, -1);
  right = neighbourSignificance(1, 0);
  below = neighbourSignificance(0, 1);
  left = neighbourSignificance(-1, 0);
  if (above !== 'w' && left !== 'w') {
    return this.setTile(15, 6);
  } else if (above !== 'w' && right !== 'w') {
    return this.setTile(16, 6);
  } else if (below !== 'w' && right !== 'w') {
    return this.setTile(17, 6);
  } else if (below !== 'w' && left !== 'w') {
    return this.setTile(14, 6);
  } else if (left !== 'w') {
    return this.setTile(12, 6);
  } else if (right !== 'w') {
    return this.setTile(13, 6);
  } else if (below !== 'w') {
    return this.setTile(10, 6);
  } else {
    return this.setTile(11, 6);
  }
};
MapView = function() {};
MapView.prototype.onRetile = function(cell, tx, ty) {};
Map = function(_f) {
  var row, x, y;
  this.view = _f;
  this.view = this.view || new MapView();
  this.pills = [];
  this.bases = [];
  this.starts = [];
  this.cells = new Array(MAP_SIZE_TILES);
  for (y = 0; (0 <= MAP_SIZE_TILES ? y < MAP_SIZE_TILES : y > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? y += 1 : y -= 1)) {
    row = (this.cells[y] = new Array(MAP_SIZE_TILES));
    for (x = 0; (0 <= MAP_SIZE_TILES ? x < MAP_SIZE_TILES : x > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? x += 1 : x -= 1)) {
      row[x] = new MapCell(this, x, y);
    }
  }
  return this;
};
Map.prototype.getRandomStart = function() {
  return this.starts[round(random() * (this.starts.length - 1))];
};
Map.prototype.cellAtTile = function(x, y) {
  var cell;
  return (cell = this.cells[y] == undefined ? undefined : this.cells[y][x]) ? cell : new MapCell(x, y);
};
Map.prototype.cellAtPixel = function(x, y) {
  return this.cellAtTile(floor(x / TILE_SIZE_PIXEL), floor(y / TILE_SIZE_PIXEL));
};
Map.prototype.cellAtWorld = function(x, y) {
  return this.cellAtTile(floor(x / TILE_SIZE_WORLD), floor(y / TILE_SIZE_WORLD));
};
Map.prototype.each = function(cb, sx, sy, ex, ey) {
  var row, x, y;
  if (!((typeof sx !== "undefined" && sx !== null) && sx >= 0)) {
    sx = 0;
  }
  if (!((typeof sy !== "undefined" && sy !== null) && sy >= 0)) {
    sy = 0;
  }
  if (!((typeof ex !== "undefined" && ex !== null) && ex < MAP_SIZE_TILES)) {
    ex = MAP_SIZE_TILES - 1;
  }
  if (!((typeof ey !== "undefined" && ey !== null) && ey < MAP_SIZE_TILES)) {
    ey = MAP_SIZE_TILES - 1;
  }
  for (y = sy; (sy <= ey ? y <= ey : y >= ey); (sy <= ey ? y += 1 : y -= 1)) {
    row = this.cells[y];
    for (x = sx; (sx <= ex ? x <= ex : x >= ex); (sx <= ex ? x += 1 : x -= 1)) {
      cb(row[x]);
    }
  }
  return this;
};
Map.prototype.clear = function(sx, sy, ex, ey) {
  return this.each(function(cell) {
    cell.type = terrainTypes['^'];
    return (cell.mine = false);
  }, sx, sy, ex, ey);
};
Map.prototype.retile = function(sx, sy, ex, ey) {
  return this.each(function(cell) {
    return cell.retile();
  }, sx, sy, ex, ey);
};
Map.prototype.load = function(data) {
  var _f, _g, _h, _i, _j, _k, base, cell, eachInSection, i, line, lines, newline, pill, re, row, x, y;
  this.clear();
  i = data.indexOf('\n');
  if (i < 19) {
    throw 'Not a Bolo map.';
  }
  newline = data.charAt(i - 1) === '\r' ? '\r\n' : '\n';
  lines = data.split(newline);
  if (lines[0] !== 'Bolo map, version 0') {
    throw 'Not a Bolo map.';
  }
  if (lines[1] !== '') {
    throw 'Not a Bolo map.';
  }
  line = lines[(i = 2)];
  eachInSection = function(section, cb) {
    if (line !== (section + ':')) {
      throw 'Corrupt map.';
    }
    line = lines[++i];
    while (!(line === '')) {
      if (line.substr(0, 2) !== '  ') {
        throw 'Corrupt map.';
      }
      cb(line.substr(2));
      line = lines[++i];
    }
    return (line = lines[++i]);
  };
  this.pills = [];
  re = /^@(\d+),(\d+)\s+owner:(\d+)\s+armour:(\d+)\s+speed:(\d+)$/;
  eachInSection('Pillboxes', __bind(function(pillDesc) {
    var matches;
    if (!(matches = re.exec(pillDesc))) {
      throw 'Corrupt map.';
    }
    return this.pills.push({
      x: parseInt(matches[1]),
      y: parseInt(matches[2]),
      owner: parseInt(matches[3]),
      armour: parseInt(matches[4]),
      speed: parseInt(matches[5])
    });
  }, this));
  this.bases = [];
  re = /^@(\d+),(\d+)\s+owner:(\d+)\s+armour:(\d+)\s+shells:(\d+)\s+mines:(\d+)$/;
  eachInSection('Bases', __bind(function(baseDesc) {
    var matches;
    if (!(matches = re.exec(baseDesc))) {
      throw 'Corrupt map.';
    }
    return this.bases.push({
      x: parseInt(matches[1]),
      y: parseInt(matches[2]),
      owner: parseInt(matches[3]),
      armour: parseInt(matches[4]),
      shells: parseInt(matches[5]),
      mines: parseInt(matches[6])
    });
  }, this));
  this.starts = [];
  re = /^@(\d+),(\d+)\s+direction:(\d+)$/;
  eachInSection('Starting positions', __bind(function(startDesc) {
    var matches;
    if (!(matches = re.exec(startDesc))) {
      throw 'Corrupt map.';
    }
    return this.starts.push({
      x: parseInt(matches[1]),
      y: parseInt(matches[2]),
      direction: parseInt(matches[3])
    });
  }, this));
  for (y = 0; (0 <= MAP_SIZE_TILES ? y < MAP_SIZE_TILES : y > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? y += 1 : y -= 1)) {
    line = lines[i + y];
    row = this.cells[y];
    for (x = 0; (0 <= MAP_SIZE_TILES ? x < MAP_SIZE_TILES : x > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? x += 1 : x -= 1)) {
      cell = row[x];
      if (!(cell.type = terrainTypes[line.charAt(x * 2)])) {
        throw 'Corrupt map, invalid terrain type: ' + line.charAt(x * 2);
      }
      if (line.charAt(x * 2 + 1) === '*') {
        cell.mine = true;
      }
    }
  }
  _g = this.pills;
  for (_f = 0, _h = _g.length; _f < _h; _f++) {
    pill = _g[_f];
    pill.cell = this.cells[pill.y][pill.x];
    pill.cell.pill = pill;
  }
  _j = this.bases;
  for (_i = 0, _k = _j.length; _i < _k; _i++) {
    base = _j[_i];
    base.cell = this.cells[base.y][base.x];
    base.cell.base = base;
    base.cell.type = terrainTypes['='];
    base.cell.mine = false;
  }
  return this.retile();
};
exports.terrainTypes = terrainTypes;
exports.MapCell = MapCell;
exports.MapView = MapView;
exports.Map = Map;
}}, ['bolo/constants']);require.define({ 'bolo/tank': function(require, exports, module) {
var PI, TILE_SIZE_WORLD, Tank, _a, _b, ceil, cos, max, min, round, sin;
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
_a = Math;
round = _a.round;
ceil = _a.ceil;
min = _a.min;
max = _a.max;
sin = _a.sin;
cos = _a.cos;
PI = _a.PI;
_b = require('./constants');
TILE_SIZE_WORLD = _b.TILE_SIZE_WORLD;
Tank = function(_c, startingPos) {
  this.game = _c;
  this.x = (startingPos.x + 0.5) * TILE_SIZE_WORLD;
  this.y = (startingPos.y + 0.5) * TILE_SIZE_WORLD;
  this.direction = startingPos.direction * 16;
  this.cell = this.game.map.cells[startingPos.y][startingPos.x];
  this.speed = 0.00;
  this.accelerating = false;
  this.braking = false;
  this.turningClockwise = false;
  this.turningCounterClockwise = false;
  this.turnSpeedup = 0;
  this.shells = 40;
  this.mines = 0;
  this.armour = 40;
  this.trees = 0;
  this.reload = 0;
  this.shooting = false;
  this.onBoat = true;
  return this;
};
Tank.prototype.getDirection16th = function() {
  return round((this.direction - 1) / 16) % 16;
};
Tank.prototype.getTile = function() {
  var tx, ty;
  tx = this.getDirection16th();
  ty = 12;
  if (this.onBoat) {
    ty += 1;
  }
  return [tx, ty];
};
Tank.prototype.update = function() {
  this.shootOrReload();
  this.turn();
  this.accelerate();
  if (this.speed > 0) {
    return this.move();
  }
};
Tank.prototype.shootOrReload = function() {
  if (this.reload > 0) {
    this.reload--;
  }
  if (!(this.shooting && this.reload === 0 && this.shells > 0)) {
    return null;
  }
  this.reload = 13;
  this.shells--;
  return console.debug('BAM!');
};
Tank.prototype.turn = function() {
  var acceleration, maxTurn;
  maxTurn = this.cell.getTankTurn(this.onBoat);
  if (this.turningClockwise === this.turningCounterClockwise) {
    this.turnSpeedup = 0;
    return null;
  }
  if (this.turningCounterClockwise) {
    acceleration = maxTurn;
    this.turnSpeedup < 10 ? acceleration /= 2 : null;
    this.turnSpeedup < 0 ? (this.turnSpeedup = 0) : null;
    this.turnSpeedup++;
  } else {
    acceleration = -maxTurn;
    this.turnSpeedup > -10 ? acceleration /= 2 : null;
    this.turnSpeedup > 0 ? (this.turnSpeedup = 0) : null;
    this.turnSpeedup--;
  }
  this.direction += acceleration;
  while (this.direction < 0) {
    this.direction += 256;
  }
  if (this.direction >= 256) {
    return this.direction %= 256;
  }
};
Tank.prototype.accelerate = function() {
  var acceleration, maxSpeed;
  maxSpeed = this.cell.getTankSpeed(this.onBoat);
  if (this.speed > maxSpeed) {
    acceleration = -0.25;
  } else if (this.accelerating === this.braking) {
    acceleration = 0.00;
  } else if (this.accelerating) {
    acceleration = 0.25;
  } else {
    acceleration = -0.25;
  }
  if (acceleration > 0.00 && this.speed < maxSpeed) {
    return (this.speed = min(maxSpeed, this.speed + acceleration));
  } else if (acceleration < 0.00 && this.speed > 0.00) {
    return (this.speed = max(0.00, this.speed + acceleration));
  }
};
Tank.prototype.move = function() {
  var aheadx, aheady, dx, dy, newx, newy, oldcell, rad, slowDown;
  rad = (256 - this.getDirection16th() * 16) * 2 * PI / 256;
  newx = this.x + (dx = round(cos(rad) * ceil(this.speed)));
  newy = this.y + (dy = round(sin(rad) * ceil(this.speed)));
  slowDown = true;
  if (!(dx === 0)) {
    aheadx = dx > 0 ? newx + 64 : newx - 64;
    aheadx = this.game.map.cellAtWorld(aheadx, newy);
    if (!(aheadx.getTankSpeed(this.onBoat) === 0)) {
      slowDown = false;
      if (!(this.onBoat && !aheadx.isType(' ', '^') && this.speed < 16)) {
        this.x = newx;
      }
    }
  }
  if (!(dy === 0)) {
    aheady = dy > 0 ? newy + 64 : newy - 64;
    aheady = this.game.map.cellAtWorld(newx, aheady);
    if (!(aheady.getTankSpeed(this.onBoat) === 0)) {
      slowDown = false;
      if (!(this.onBoat && !aheady.isType(' ', '^') && this.speed < 16)) {
        this.y = newy;
      }
    }
  }
  slowDown ? (this.speed = max(0.00, this.speed - 1)) : null;
  oldcell = this.cell;
  this.cell = this.game.map.cellAtWorld(this.x, this.y);
  if (this.onBoat) {
    if (!(this.cell.isType(' ', '^'))) {
      return this.leaveBoat(oldcell);
    }
  } else {
    if (this.cell.isType('b')) {
      return this.enterBoat();
    }
  }
};
Tank.prototype.leaveBoat = function(oldcell) {
  if (this.cell.isType('b')) {
    return this.cell.setType(' ', 0);
  } else {
    oldcell.isType(' ') ? oldcell.setType('b', 0) : null;
    return (this.onBoat = false);
  }
};
Tank.prototype.enterBoat = function() {
  this.cell.setType(' ', 0);
  return (this.onBoat = true);
};
exports.Tank = Tank;
}}, ['bolo/constants']);require.define({ 'bolo/client': function(require, exports, module) {
var CachedSegment, MAP_SIZE_SEGMENTS, MAP_SIZE_TILES, Map, MapCell, MapView, OffscreenMapView, PI, PIXEL_SIZE_WORLD, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_TILES, TICK_LENGTH_MS, TILE_SIZE_PIXEL, Tank, _a, _b, _c, _d, c, canvas, ceil, cos, draw, drawOverlay, drawTank, floor, game, gameTimer, handleKeydown, handleKeyup, handleResize, hud, init, initHud, lastTick, mapview, round, sin, start, stop, tick, tilemap, timerCallback, updateHud;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__superClass__ = parent.prototype;
  };
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
_a = Math;
round = _a.round;
floor = _a.floor;
ceil = _a.ceil;
cos = _a.cos;
sin = _a.sin;
PI = _a.PI;
_b = require('./tank');
Tank = _b.Tank;
_c = require('./map');
MapCell = _c.MapCell;
MapView = _c.MapView;
Map = _c.Map;
_d = require('./constants');
TILE_SIZE_PIXEL = _d.TILE_SIZE_PIXEL;
PIXEL_SIZE_WORLD = _d.PIXEL_SIZE_WORLD;
TICK_LENGTH_MS = _d.TICK_LENGTH_MS;
MAP_SIZE_TILES = _d.MAP_SIZE_TILES;
tilemap = null;
canvas = null;
hud = null;
c = null;
mapview = null;
game = null;
init = function() {
  if (!(typeof tilemap !== "undefined" && tilemap !== null)) {
    tilemap = new Image();
    $(tilemap).load(init);
    tilemap.src = 'img/tiles2x.png';
    return null;
  }
  canvas = $('#game');
  handleResize();
  $(window).resize(handleResize);
  c = canvas[0].getContext('2d');
  $(document).keydown(handleKeydown).keyup(handleKeyup);
  return $.ajax({
    url: 'maps/everard-island.txt',
    dataType: 'text',
    success: function(data) {
      var startingPos;
      game = {};
      mapview = new OffscreenMapView();
      game.map = new Map(mapview);
      mapview.map = game.map;
      game.map.load(data);
      startingPos = game.map.getRandomStart();
      game.player = new Tank(game, startingPos);
      hud = $('#hud');
      initHud();
      return start();
    }
  });
};
handleResize = function() {
  canvas[0].width = window.innerWidth;
  canvas[0].height = window.innerHeight;
  return canvas.css({
    width: window.innerWidth + 'px',
    height: window.innerHeight + 'px'
  });
};
handleKeydown = function(e) {
  var _e;
  if (!(typeof game !== "undefined" && game !== null)) {
    return null;
  }
  if ((_e = e.which) === 32) {
    game.player.shooting = true;
  } else if (_e === 37) {
    game.player.turningCounterClockwise = true;
  } else if (_e === 38) {
    game.player.accelerating = true;
  } else if (_e === 39) {
    game.player.turningClockwise = true;
  } else if (_e === 40) {
    game.player.braking = true;
  } else {
    return null;
  }
  return e.preventDefault();
};
handleKeyup = function(e) {
  var _e;
  if (!(typeof game !== "undefined" && game !== null)) {
    return null;
  }
  if ((_e = e.which) === 32) {
    game.player.shooting = false;
  } else if (_e === 37) {
    game.player.turningCounterClockwise = false;
  } else if (_e === 38) {
    game.player.accelerating = false;
  } else if (_e === 39) {
    game.player.turningClockwise = false;
  } else if (_e === 40) {
    game.player.braking = false;
  } else {
    return null;
  }
  return e.preventDefault();
};
gameTimer = null;
lastTick = null;
start = function() {
  if (typeof gameTimer !== "undefined" && gameTimer !== null) {
    return null;
  }
  tick();
  lastTick = Date.now();
  return (gameTimer = window.setInterval(timerCallback, TICK_LENGTH_MS));
};
stop = function() {
  if (!(typeof gameTimer !== "undefined" && gameTimer !== null)) {
    return null;
  }
  window.clearInterval(gameTimer);
  gameTimer = null;
  return (lastTick = null);
};
timerCallback = function() {
  var now;
  now = Date.now();
  while (now - lastTick >= TICK_LENGTH_MS) {
    tick();
    lastTick += TICK_LENGTH_MS;
  }
  return draw();
};
tick = function() {
  return game.player.update();
};
SEGMENT_SIZE_TILES = 16;
MAP_SIZE_SEGMENTS = MAP_SIZE_TILES / SEGMENT_SIZE_TILES;
SEGMENT_SIZE_PIXEL = SEGMENT_SIZE_TILES * TILE_SIZE_PIXEL;
CachedSegment = function(_e, x, y) {
  this.view = _e;
  this.sx = x * SEGMENT_SIZE_TILES;
  this.sy = y * SEGMENT_SIZE_TILES;
  this.ex = this.sx + SEGMENT_SIZE_TILES - 1;
  this.ey = this.sy + SEGMENT_SIZE_TILES - 1;
  this.psx = x * SEGMENT_SIZE_PIXEL;
  this.psy = y * SEGMENT_SIZE_PIXEL;
  this.pex = this.psx + SEGMENT_SIZE_PIXEL - 1;
  this.pey = this.psy + SEGMENT_SIZE_PIXEL - 1;
  this.canvas = null;
  return this;
};
CachedSegment.prototype.isInView = function(sx, sy, ex, ey) {
  if (ex < this.psx || ey < this.psy) {
    return false;
  } else if (sx > this.pex || sy > this.pey) {
    return false;
  } else {
    return true;
  }
};
CachedSegment.prototype.build = function() {
  this.canvas = $('<canvas/>')[0];
  this.canvas.width = (this.canvas.height = SEGMENT_SIZE_PIXEL);
  this.ctx = this.canvas.getContext('2d');
  this.ctx.translate(-this.psx, -this.psy);
  return this.view.map.each(__bind(function(cell) {
    return this.onRetile(cell, cell.tile[0], cell.tile[1]);
  }, this), this.sx, this.sy, this.ex, this.ey);
};
CachedSegment.prototype.clear = function() {
  return (this.canvas = (this.ctx = null));
};
CachedSegment.prototype.onRetile = function(cell, tx, ty) {
  if (!(this.canvas)) {
    return null;
  }
  return this.ctx.drawImage(tilemap, tx * TILE_SIZE_PIXEL, ty * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, cell.x * TILE_SIZE_PIXEL, cell.y * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
};
OffscreenMapView = function() {
  var row, x, y;
  this.cache = new Array(MAP_SIZE_SEGMENTS);
  for (y = 0; (0 <= MAP_SIZE_SEGMENTS ? y < MAP_SIZE_SEGMENTS : y > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? y += 1 : y -= 1)) {
    row = (this.cache[y] = new Array(MAP_SIZE_SEGMENTS));
    for (x = 0; (0 <= MAP_SIZE_SEGMENTS ? x < MAP_SIZE_SEGMENTS : x > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? x += 1 : x -= 1)) {
      row[x] = new CachedSegment(this, x, y);
    }
  }
  return this;
};
__extends(OffscreenMapView, MapView);
OffscreenMapView.prototype.onRetile = function(cell, tx, ty) {
  var segx, segy;
  cell.tile = [tx, ty];
  segx = floor(cell.x / SEGMENT_SIZE_TILES);
  segy = floor(cell.y / SEGMENT_SIZE_TILES);
  return this.cache[segy][segx].onRetile(cell, tx, ty);
};
OffscreenMapView.prototype.draw = function(sx, sy, w, h) {
  var _e, _f, _g, _h, _i, _j, alreadyBuiltOne, ex, ey, row, segment;
  ex = sx + w - 1;
  ey = sy + h - 1;
  alreadyBuiltOne = false;
  _f = this.cache;
  for (_e = 0, _g = _f.length; _e < _g; _e++) {
    row = _f[_e];
    _i = row;
    for (_h = 0, _j = _i.length; _h < _j; _h++) {
      segment = _i[_h];
      if (!segment.isInView(sx, sy, ex, ey)) {
        if (segment.canvas) {
          segment.clear();
        }
        continue;
      }
      if (!(segment.canvas)) {
        if (alreadyBuiltOne) {
          continue;
        }
        segment.build();
        alreadyBuiltOne = true;
      }
      c.drawImage(segment.canvas, 0, 0, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL, segment.psx, segment.psy, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL);
    }
  }
  return null;
};
draw = function() {
  var _e, height, left, top, width;
  c.save();
  _e = canvas[0];
  width = _e.width;
  height = _e.height;
  left = round(game.player.x / PIXEL_SIZE_WORLD - width / 2);
  top = round(game.player.y / PIXEL_SIZE_WORLD - height / 2);
  c.translate(-left, -top);
  mapview.draw(left, top, width, height);
  drawTank(game.player);
  drawOverlay();
  c.restore();
  return updateHud();
};
drawTank = function(tank) {
  var px, py, tile;
  tile = tank.getTile();
  px = round(tank.x / PIXEL_SIZE_WORLD);
  py = round(tank.y / PIXEL_SIZE_WORLD);
  return c.drawImage(tilemap, tile[0] * TILE_SIZE_PIXEL, tile[1] * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, px - TILE_SIZE_PIXEL / 2, py - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
};
drawOverlay = function() {
  var distance, rad, x, y;
  distance = 7 * TILE_SIZE_PIXEL;
  rad = (256 - game.player.direction) * 2 * PI / 256;
  x = round(game.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance);
  y = round(game.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance);
  return c.drawImage(tilemap, 17 * TILE_SIZE_PIXEL, 4 * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
};
initHud = function() {
  var _e, _f, _g, _h, _i, _j, base, container, pill;
  hud.html('');
  container = $('<div/>', {
    id: 'pillStatus'
  }).appendTo(hud);
  $('<div/>', {
    "class": 'deco'
  }).appendTo(container);
  _f = game.map.pills;
  for (_e = 0, _g = _f.length; _e < _g; _e++) {
    pill = _f[_e];
    $('<div/>', {
      "class": 'pill'
    }).appendTo(container).data('pill', pill);
  }
  container = $('<div/>', {
    id: 'baseStatus'
  }).appendTo(hud);
  $('<div/>', {
    "class": 'deco'
  }).appendTo(container);
  _i = game.map.bases;
  for (_h = 0, _j = _i.length; _h < _j; _h++) {
    base = _i[_h];
    $('<div/>', {
      "class": 'base'
    }).appendTo(container).data('base', base);
  }
  if (!(location.host === 'localhost')) {
    $('<div/>').text('This is a work-in-progress; less than alpha quality!').css({
      'position': 'absolute',
      'top': '8px',
      'left': '0px',
      'width': '100%',
      'text-align': 'center',
      'font-family': 'monospace',
      'font-size': '16px',
      'font-weight': 'bold',
      'color': 'white'
    }).appendTo(hud);
    $('<a href="http://github.com/stephank/orona"></a>').css({
      'position': 'absolute',
      'top': '0px',
      'right': '0px'
    }).html('<img src="http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub">').appendTo(hud);
  }
  return updateHud();
};
updateHud = function() {
  $('#pillStatus .pill').each(__bind(function(i, node) {
    return $(node).attr('status', 'neutral');
  }, this));
  return $('#baseStatus .base').each(__bind(function(i, node) {
    return $(node).attr('status', 'neutral');
  }, this));
};
exports.init = init;
exports.start = start;
exports.stop = stop;
}}, ['bolo/tank', 'bolo/map', 'bolo/constants']);require.define({ 'bolo/constants': function(require, exports, module) {
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
exports.TILE_SIZE_WORLD = 256;
exports.TILE_SIZE_PIXEL = 32;
exports.PIXEL_SIZE_WORLD = 8;
exports.MAP_SIZE_TILES = 256;
exports.TICK_LENGTH_MS = 20;
}}, []);