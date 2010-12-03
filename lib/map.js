(function() {
  var Base, MAP_SIZE_TILES, Map, MapCell, MapObject, MapView, Pillbox, Start, TERRAIN_TYPES, createTerrainMap, floor, min, round;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice;
  round = Math.round, floor = Math.floor, min = Math.min;
  MAP_SIZE_TILES = require('./constants').MAP_SIZE_TILES;
  TERRAIN_TYPES = [
    {
      ascii: '|',
      description: 'building'
    }, {
      ascii: ' ',
      description: 'river'
    }, {
      ascii: '~',
      description: 'swamp'
    }, {
      ascii: '%',
      description: 'crater'
    }, {
      ascii: '=',
      description: 'road'
    }, {
      ascii: '#',
      description: 'forest'
    }, {
      ascii: ':',
      description: 'rubble'
    }, {
      ascii: '.',
      description: 'grass'
    }, {
      ascii: '}',
      description: 'shot building'
    }, {
      ascii: 'b',
      description: 'river with boat'
    }, {
      ascii: '^',
      description: 'deep sea'
    }
  ];
  createTerrainMap = function() {
    var type, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = TERRAIN_TYPES.length; _i < _len; _i++) {
      type = TERRAIN_TYPES[_i];
      _results.push(TERRAIN_TYPES[type.ascii] = type);
    }
    return _results;
  };
  createTerrainMap();
  MapCell = function() {
    function MapCell(map, x, y) {
      this.map = map;
      this.x = x;
      this.y = y;
      this.type = TERRAIN_TYPES['^'];
      this.mine = this.isEdgeCell();
      this.idx = this.y * MAP_SIZE_TILES + this.x;
    }
    MapCell.prototype.neigh = function(dx, dy) {
      return this.map.cellAtTile(this.x + dx, this.y + dy);
    };
    MapCell.prototype.isType = function() {
      var i, type, _ref;
      for (i = 0, _ref = arguments.length; (0 <= _ref ? i <= _ref : i >= _ref); (0 <= _ref ? i += 1 : i -= 1)) {
        type = arguments[i];
        if (this.type === type || this.type.ascii === type) {
          return true;
        }
      }
      return false;
    };
    MapCell.prototype.isEdgeCell = function() {
      return this.x <= 20 || this.x >= 236 || this.y <= 20 || this.y >= 236;
    };
    MapCell.prototype.getNumericType = function() {
      var num;
      if (this.type.ascii === '^') {
        return -1;
      }
      num = TERRAIN_TYPES.indexOf(this.type);
      if (this.mine) {
        num += 8;
      }
      return num;
    };
    MapCell.prototype.setType = function(newType, mine, retileRadius) {
      var hadMine, oldType;
      retileRadius || (retileRadius = 1);
      oldType = this.type;
      hadMine = this.mine;
      if (mine !== void 0) {
        this.mine = mine;
      }
      if (typeof newType === 'string') {
        this.type = TERRAIN_TYPES[newType];
        if (newType.length !== 1 || !(this.type != null)) {
          throw "Invalid terrain type: " + newType;
        }
      } else if (typeof newType === 'number') {
        if (newType >= 10) {
          newType -= 8;
          this.mine = true;
        } else {
          this.mine = false;
        }
        this.type = TERRAIN_TYPES[newType];
        if (!(this.type != null)) {
          throw "Invalid terrain type: " + newType;
        }
      } else {
        if (newType !== null) {
          this.type = newType;
        }
      }
      if (this.isEdgeCell()) {
        this.mine = true;
      }
      if (retileRadius >= 0) {
        return this.map.retile(this.x - retileRadius, this.y - retileRadius, this.x + retileRadius, this.y + retileRadius);
      }
    };
    MapCell.prototype.setTile = function(tx, ty) {
      if (this.mine && !((this.pill != null) || (this.base != null))) {
        ty += 10;
      }
      return this.map.view.onRetile(this, tx, ty);
    };
    MapCell.prototype.retile = function() {
      if (this.pill != null) {
        return this.setTile(this.pill.armour, 2);
      } else if (this.base != null) {
        return this.setTile(16, 0);
      } else {
        switch (this.type.ascii) {
          case '^':
            return this.retileDeepSea();
          case '|':
            return this.retileBuilding();
          case ' ':
            return this.retileRiver();
          case '~':
            return this.setTile(7, 1);
          case '%':
            return this.setTile(5, 1);
          case '=':
            return this.retileRoad();
          case '#':
            return this.retileForest();
          case ':':
            return this.setTile(4, 1);
          case '.':
            return this.setTile(2, 1);
          case '}':
            return this.setTile(8, 1);
          case 'b':
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
    return MapCell;
  }();
  MapView = function() {
    function MapView() {}
    MapView.prototype.onRetile = function(cell, tx, ty) {};
    return MapView;
  }();
  MapObject = function() {
    function MapObject(map) {
      this.map = map;
      this.cell = this.map.cells[this.y][this.x];
    }
    return MapObject;
  }();
  Pillbox = function() {
    function Pillbox(map, x, y, owner_idx, armour, speed) {
      this.x = x;
      this.y = y;
      this.owner_idx = owner_idx;
      this.armour = armour;
      this.speed = speed;
      Pillbox.__super__.constructor.apply(this, arguments);
    }
    __extends(Pillbox, MapObject);
    return Pillbox;
  }();
  Base = function() {
    function Base(map, x, y, owner_idx, armour, shells, mines) {
      this.x = x;
      this.y = y;
      this.owner_idx = owner_idx;
      this.armour = armour;
      this.shells = shells;
      this.mines = mines;
      Base.__super__.constructor.apply(this, arguments);
    }
    __extends(Base, MapObject);
    return Base;
  }();
  Start = function() {
    function Start(map, x, y, direction) {
      this.x = x;
      this.y = y;
      this.direction = direction;
      Start.__super__.constructor.apply(this, arguments);
    }
    __extends(Start, MapObject);
    return Start;
  }();
  Map = function() {
    function Map() {
      var row, x, y;
      this.view = new MapView();
      this.pills = [];
      this.bases = [];
      this.starts = [];
      this.cells = new Array(MAP_SIZE_TILES);
      for (y = 0; (0 <= MAP_SIZE_TILES ? y < MAP_SIZE_TILES : y > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? y += 1 : y -= 1)) {
        row = this.cells[y] = new Array(MAP_SIZE_TILES);
        for (x = 0; (0 <= MAP_SIZE_TILES ? x < MAP_SIZE_TILES : x > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? x += 1 : x -= 1)) {
          row[x] = new this.CellClass(this, x, y);
        }
      }
    }
    Map.prototype.CellClass = MapCell;
    Map.prototype.PillboxClass = Pillbox;
    Map.prototype.BaseClass = Base;
    Map.prototype.StartClass = Start;
    Map.prototype.setView = function(view) {
      this.view = view;
      return this.retile();
    };
    Map.prototype.cellAtTile = function(x, y) {
      var cell, _ref;
      if (cell = (_ref = this.cells[y]) != null ? _ref[x] : void 0) {
        return cell;
      } else {
        return new this.CellClass(this, x, y, {
          isDummy: true
        });
      }
    };
    Map.prototype.each = function(cb, sx, sy, ex, ey) {
      var row, x, y;
      if (!((sx != null) && sx >= 0)) {
        sx = 0;
      }
      if (!((sy != null) && sy >= 0)) {
        sy = 0;
      }
      if (!((ex != null) && ex < MAP_SIZE_TILES)) {
        ex = MAP_SIZE_TILES - 1;
      }
      if (!((ey != null) && ey < MAP_SIZE_TILES)) {
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
        cell.type = TERRAIN_TYPES['^'];
        return cell.mine = cell.isEdgeCell();
      }, sx, sy, ex, ey);
    };
    Map.prototype.retile = function(sx, sy, ex, ey) {
      return this.each(function(cell) {
        return cell.retile();
      }, sx, sy, ex, ey);
    };
    Map.prototype.findCenterCell = function() {
      var b, l, r, t, x, y;
      t = l = MAP_SIZE_TILES - 1;
      b = r = 0;
      this.each(function(c) {
        if (l > c.x) {
          l = c.x;
        }
        if (r < c.x) {
          r = c.x;
        }
        if (t > c.y) {
          t = c.y;
        }
        if (b < c.y) {
          return b = c.y;
        }
      });
      if (l > r) {
        t = l = 0;
        b = r = MAP_SIZE_TILES - 1;
      }
      x = round(l + (r - l) / 2);
      y = round(t + (b - t) / 2);
      return this.cellAtTile(x, y);
    };
    Map.prototype.dump = function(options) {
      var b, bases, c, consecutiveCells, data, encodeNibbles, ensureRunSpace, ex, flushRun, flushSequence, p, pills, run, s, seq, starts, sx, y, _fn, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _results;
      options || (options = {});
      consecutiveCells = function(row, cb) {
        var cell, count, currentType, num, startx, x, _len;
        currentType = null;
        startx = null;
        count = 0;
        for (x = 0, _len = row.length; x < _len; x++) {
          cell = row[x];
          num = cell.getNumericType();
          if (currentType === num) {
            count++;
            continue;
          }
          if (currentType != null) {
            cb(currentType, count, startx);
          }
          currentType = num;
          startx = x;
          count = 1;
        }
        if (currentType != null) {
          cb(currentType, count, startx);
        }
        return;
      };
      encodeNibbles = function(nibbles) {
        var i, nibble, octets, val, _len;
        octets = [];
        val = null;
        for (i = 0, _len = nibbles.length; i < _len; i++) {
          nibble = nibbles[i];
          nibble = nibble & 0x0F;
          if (i % 2 === 0) {
            val = nibble << 4;
          } else {
            octets.push(val + nibble);
            val = null;
          }
        }
        if (val != null) {
          octets.push(val);
        }
        return octets;
      };
      pills = options.noPills ? [] : this.pills;
      bases = options.noBases ? [] : this.bases;
      starts = options.noStarts ? [] : this.starts;
      data = function() {
        _ref = 'BMAPBOLO';
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          _results.push(c.charCodeAt(0));
        }
        return _results;
      }();
      data.push(1, pills.length, bases.length, starts.length);
      for (_j = 0, _len2 = pills.length; _j < _len2; _j++) {
        p = pills[_j];
        data.push(p.x, p.y, p.owner_idx, p.armour, p.speed);
      }
      for (_k = 0, _len3 = bases.length; _k < _len3; _k++) {
        b = bases[_k];
        data.push(b.x, b.y, b.owner_idx, b.armour, b.shells, b.mines);
      }
      for (_l = 0, _len4 = starts.length; _l < _len4; _l++) {
        s = starts[_l];
        data.push(s.x, s.y, s.direction);
      }
      run = seq = sx = ex = y = null;
      flushRun = function() {
        var octets;
        if (run == null) {
          return;
        }
        flushSequence();
        octets = encodeNibbles(run);
        data.push(octets.length + 4, y, sx, ex);
        data = data.concat(octets);
        return run = null;
      };
      ensureRunSpace = function(numNibbles) {
        if ((255 - 4) * 2 - run.length >= numNibbles) {
          return;
        }
        flushRun();
        run = [];
        return sx = ex;
      };
      flushSequence = function() {
        var localSeq;
        if (seq == null) {
          return;
        }
        localSeq = seq;
        seq = null;
        ensureRunSpace(localSeq.length + 1);
        run.push(localSeq.length - 1);
        run = run.concat(localSeq);
        return ex += localSeq.length;
      };
      _ref2 = this.cells;
      _fn = function(row) {
        y = row[0].y;
        run = sx = ex = seq = null;
        return consecutiveCells(row, function(type, count, x) {
          var seqLen, _results;
          if (type === -1) {
            flushRun();
            return;
          }
          if (run == null) {
            run = [];
            sx = ex = x;
          }
          if (count > 2) {
            flushSequence();
            while (count > 2) {
              ensureRunSpace(2);
              seqLen = min(count, 9);
              run.push(seqLen + 6, type);
              ex += seqLen;
              count -= seqLen;
            }
          }
          _results = [];
          while (count > 0) {
            if (seq == null) {
              seq = [];
            }
            seq.push(type);
            if (seq.length === 8) {
              flushSequence();
            }
            _results.push(count--);
          }
          return _results;
        });
      };
      for (_m = 0, _len5 = _ref2.length; _m < _len5; _m++) {
        row = _ref2[_m];
        _fn(row);
      }
      flushRun();
      data.push(4, 0xFF, 0xFF, 0xFF);
      return data;
    };
    Map.load = function(buffer) {
      var args, basesData, c, dataLen, ex, filePos, i, magic, map, numBases, numPills, numStarts, pillsData, readBytes, run, runPos, seqLen, startsData, sx, takeNibble, type, version, x, y, _i, _j, _k, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4, _ref5, _results, _results2, _results3, _results4, _results5, _results6;
      filePos = 0;
      readBytes = function(num, msg) {
        var sub, x, _i, _len, _ref, _results;
        sub = function() {
          try {
            _ref = buffer.slice(filePos, filePos + num);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              x = _ref[_i];
              _results.push(x);
            }
            return _results;
          } catch (e) {
            throw msg;
          }
        }();
        filePos += num;
        return sub;
      };
      magic = readBytes(8, "Not a Bolo map.");
      _ref = 'BMAPBOLO';
      for (i = 0, _len = _ref.length; i < _len; i++) {
        c = _ref[i];
        if (c.charCodeAt(0) !== magic[i]) {
          throw "Not a Bolo map.";
        }
      }
      _ref2 = readBytes(4, "Incomplete header"), version = _ref2[0], numPills = _ref2[1], numBases = _ref2[2], numStarts = _ref2[3];
      if (version !== 1) {
        throw "Unsupported map version: " + version;
      }
      map = new this();
      pillsData = function() {
        _results = [];
        for (i = 0; (0 <= numPills ? i < numPills : i > numPills); (0 <= numPills ? i += 1 : i -= 1)) {
          _results.push(readBytes(5, "Incomplete pillbox data"));
        }
        return _results;
      }();
      basesData = function() {
        _results2 = [];
        for (i = 0; (0 <= numBases ? i < numBases : i > numBases); (0 <= numBases ? i += 1 : i -= 1)) {
          _results2.push(readBytes(6, "Incomplete base data"));
        }
        return _results2;
      }();
      startsData = function() {
        _results3 = [];
        for (i = 0; (0 <= numStarts ? i < numStarts : i > numStarts); (0 <= numStarts ? i += 1 : i -= 1)) {
          _results3.push(readBytes(3, "Incomplete player start data"));
        }
        return _results3;
      }();
      while (true) {
        _ref3 = readBytes(4, "Incomplete map data"), dataLen = _ref3[0], y = _ref3[1], sx = _ref3[2], ex = _ref3[3];
        dataLen -= 4;
        if (dataLen === 0 && y === 0xFF && sx === 0xFF && ex === 0xFF) {
          break;
        }
        run = readBytes(dataLen, "Incomplete map data");
        runPos = 0;
        takeNibble = function() {
          var index, nibble;
          index = floor(runPos);
          nibble = index === runPos ? (run[index] & 0xF0) >> 4 : run[index] & 0x0F;
          runPos += 0.5;
          return nibble;
        };
        x = sx;
        while (x < ex) {
          seqLen = takeNibble();
          if (seqLen < 8) {
            for (i = 1, _ref4 = seqLen + 1; (1 <= _ref4 ? i <= _ref4 : i >= _ref4); (1 <= _ref4 ? i += 1 : i -= 1)) {
              map.cellAtTile(x++, y).setType(takeNibble(), void 0, -1);
            }
          } else {
            type = takeNibble();
            for (i = 1, _ref5 = seqLen - 6; (1 <= _ref5 ? i <= _ref5 : i >= _ref5); (1 <= _ref5 ? i += 1 : i -= 1)) {
              map.cellAtTile(x++, y).setType(type, void 0, -1);
            }
          }
        }
      }
      map.pills = function() {
        _results4 = [];
        for (_i = 0, _len2 = pillsData.length; _i < _len2; _i++) {
          args = pillsData[_i];
          _results4.push((function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(map.PillboxClass, [map].concat(__slice.call(args)), function() {}));
        }
        return _results4;
      }();
      map.bases = function() {
        _results5 = [];
        for (_j = 0, _len3 = basesData.length; _j < _len3; _j++) {
          args = basesData[_j];
          _results5.push((function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(map.BaseClass, [map].concat(__slice.call(args)), function() {}));
        }
        return _results5;
      }();
      map.starts = function() {
        _results6 = [];
        for (_k = 0, _len4 = startsData.length; _k < _len4; _k++) {
          args = startsData[_k];
          _results6.push((function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return typeof result === "object" ? result : child;
          })(map.StartClass, [map].concat(__slice.call(args)), function() {}));
        }
        return _results6;
      }();
      return map;
    };
    Map.extended = function(child) {
      if (!child.load) {
        return child.load = this.load;
      }
    };
    return Map;
  }();
  exports.TERRAIN_TYPES = TERRAIN_TYPES;
  exports.MapView = MapView;
  exports.Map = Map;
}).call(this);
