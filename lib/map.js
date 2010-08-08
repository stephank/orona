(function() {
  var MapCell, _a, _b, _c, _d, ceil, floor, map, row, terrainTypes, type, x, y;
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
  floor = _a.floor;
  ceil = _a.ceil;
  terrainTypes = {};
  _c = [
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
  for (_b = 0, _d = _c.length; _b < _d; _b++) {
    type = _c[_b];
    terrainTypes[type.ascii] = type;
  }
  MapCell = function(_e, _f) {
    this.y = _f;
    this.x = _e;
    this.type = terrainTypes['^'];
    this.tile = [0, 0];
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
    return map.cellAtTile(this.x + dx, this.y + dy);
  };
  MapCell.prototype.isType = function() {
    var _e, i;
    _e = arguments.length;
    for (i = 0; (0 <= _e ? i <= _e : i >= _e); (0 <= _e ? i += 1 : i -= 1)) {
      type = arguments[i];
      if (this.type === type || this.type.ascii === type) {
        return true;
      }
    }
    return false;
  };
  MapCell.prototype.setType = function(newType, retileRadius) {
    var _e;
    retileRadius = retileRadius || 1;
    if (typeof (newType) === 'string') {
      this.type = terrainTypes[newType];
      if (newType.length !== 1 || !(typeof (_e = this.type) !== "undefined" && _e !== null)) {
        throw ("Invalid terrain type: " + (newType));
      }
    } else {
      this.type = newType;
    }
    return map.retile(this.x - retileRadius, this.y - retileRadius, this.x + retileRadius, this.y + retileRadius);
  };
  MapCell.prototype.setTile = function(tx, ty) {
    return (this.tile = [tx, ty]);
  };
  MapCell.prototype.retile = function() {
    var _e, _f, _g;
    if ((typeof (_e = this.pill) !== "undefined" && _e !== null)) {
      return this.setTile(this.pill.armour, 4);
    } else if ((typeof (_f = this.base) !== "undefined" && _f !== null)) {
      return this.setTile(16, 4);
    } else {
      if ((_g = this.type.ascii) === '^') {
        return this.retileDeepSea();
      } else if (_g === '|') {
        return this.retileBuilding();
      } else if (_g === ' ') {
        return this.retileRiver();
      } else if (_g === '~') {
        return this.setTile(7, 1);
      } else if (_g === '%') {
        return this.setTile(5, 1);
      } else if (_g === '=') {
        return this.retileRoad();
      } else if (_g === '#') {
        return this.retileForest();
      } else if (_g === ':') {
        return this.setTile(4, 1);
      } else if (_g === '.') {
        return this.setTile(2, 1);
      } else if (_g === '}') {
        return this.setTile(8, 1);
      } else if (_g === 'b') {
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
  map = new Array(MAP_SIZE_TILES);
  for (y = 0; (0 <= MAP_SIZE_TILES ? y < MAP_SIZE_TILES : y > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? y += 1 : y -= 1)) {
    row = (map[y] = new Array(MAP_SIZE_TILES));
    for (x = 0; (0 <= MAP_SIZE_TILES ? x < MAP_SIZE_TILES : x > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? x += 1 : x -= 1)) {
      row[x] = new MapCell(x, y);
    }
  }
  map.cellAtTile = function(x, y) {
    var cell;
    return (cell = map[y] == undefined ? undefined : map[y][x]) ? cell : new MapCell(x, y);
  };
  map.cellAtPixel = function(x, y) {
    return map.cellAtTile(floor(x / TILE_SIZE_PIXEL), floor(y / TILE_SIZE_PIXEL));
  };
  map.cellAtWorld = function(x, y) {
    return map.cellAtTile(floor(x / TILE_SIZE_WORLD), floor(y / TILE_SIZE_WORLD));
  };
  map.each = function(cb, sx, sy, ex, ey) {
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
      row = map[y];
      for (x = sx; (sx <= ex ? x <= ex : x >= ex); (sx <= ex ? x += 1 : x -= 1)) {
        cb(row[x]);
      }
    }
    return map;
  };
  map.clear = function(sx, sy, ex, ey) {
    return map.each(function(cell) {
      cell.type = terrainTypes['^'];
      return (cell.mine = false);
    }, sx, sy, ex, ey);
  };
  map.retile = function(sx, sy, ex, ey) {
    return map.each(function(cell) {
      return cell.retile();
    }, sx, sy, ex, ey);
  };
  map.draw = function(sx, sy, ex, ey) {
    var etx, ety, stx, sty;
    stx = floor(sx / TILE_SIZE_PIXEL);
    sty = floor(sy / TILE_SIZE_PIXEL);
    etx = ceil(ex / TILE_SIZE_PIXEL);
    ety = ceil(ey / TILE_SIZE_PIXEL);
    return map.each(function(cell) {
      var dx, dy;
      sx = cell.tile[0] * TILE_SIZE_PIXEL;
      sy = cell.tile[1] * TILE_SIZE_PIXEL;
      dx = cell.x * TILE_SIZE_PIXEL;
      dy = cell.y * TILE_SIZE_PIXEL;
      return c.drawImage(tilemap, sx, sy, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, dx, dy, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
    }, stx, sty, etx, ety);
  };
  map.load = function(data) {
    var _e, _f, _g, _h, _i, _j, base, cell, eachInSection, i, line, lines, newline, pill, re;
    map.clear();
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
    map.pills = [];
    re = /^@(\d+),(\d+)\s+owner:(\d+)\s+armour:(\d+)\s+speed:(\d+)$/;
    eachInSection('Pillboxes', function(pillDesc) {
      var matches;
      if (!(matches = re.exec(pillDesc))) {
        throw 'Corrupt map.';
      }
      return map.pills.push({
        x: parseInt(matches[1]),
        y: parseInt(matches[2]),
        owner: parseInt(matches[3]),
        armour: parseInt(matches[4]),
        speed: parseInt(matches[5])
      });
    });
    map.bases = [];
    re = /^@(\d+),(\d+)\s+owner:(\d+)\s+armour:(\d+)\s+shells:(\d+)\s+mines:(\d+)$/;
    eachInSection('Bases', function(baseDesc) {
      var matches;
      if (!(matches = re.exec(baseDesc))) {
        throw 'Corrupt map.';
      }
      return map.bases.push({
        x: parseInt(matches[1]),
        y: parseInt(matches[2]),
        owner: parseInt(matches[3]),
        armour: parseInt(matches[4]),
        shells: parseInt(matches[5]),
        mines: parseInt(matches[6])
      });
    });
    map.starts = [];
    re = /^@(\d+),(\d+)\s+direction:(\d+)$/;
    eachInSection('Starting positions', function(startDesc) {
      var matches;
      if (!(matches = re.exec(startDesc))) {
        throw 'Corrupt map.';
      }
      return map.starts.push({
        x: parseInt(matches[1]),
        y: parseInt(matches[2]),
        direction: parseInt(matches[3])
      });
    });
    for (y = 0; (0 <= MAP_SIZE_TILES ? y < MAP_SIZE_TILES : y > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? y += 1 : y -= 1)) {
      line = lines[i + y];
      row = map[y];
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
    _f = map.pills;
    for (_e = 0, _g = _f.length; _e < _g; _e++) {
      pill = _f[_e];
      pill.cell = map[pill.y][pill.x];
      pill.cell.pill = pill;
    }
    _i = map.bases;
    for (_h = 0, _j = _i.length; _h < _j; _h++) {
      base = _i[_h];
      base.cell = map[base.y][base.x];
      base.cell.base = base;
      base.cell.type = terrainTypes['='];
      base.cell.mine = false;
    }
    return map.retile();
  };
  window.terrainTypes = terrainTypes;
  window.MapCell = MapCell;
  window.map = map;
})();
