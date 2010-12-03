(function() {
  var FloodFill, Map, TERRAIN_TYPES, TERRAIN_TYPE_ATTRIBUTES, TILE_SIZE_PIXELS, TILE_SIZE_WORLD, WorldBase, WorldMap, WorldMapCell, WorldPillbox, extendTerrainMap, floor, net, random, round, sounds, _ref, _ref2;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, random = Math.random, floor = Math.floor;
  _ref = require('./constants'), TILE_SIZE_WORLD = _ref.TILE_SIZE_WORLD, TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS;
  _ref2 = require('./map'), Map = _ref2.Map, TERRAIN_TYPES = _ref2.TERRAIN_TYPES;
  net = require('./net');
  sounds = require('./sounds');
  WorldPillbox = require('./objects/world_pillbox');
  WorldBase = require('./objects/world_base');
  FloodFill = require('./objects/flood_fill');
  TERRAIN_TYPE_ATTRIBUTES = {
    '|': {
      tankSpeed: 0,
      tankTurn: 0.00,
      manSpeed: 0
    },
    ' ': {
      tankSpeed: 3,
      tankTurn: 0.25,
      manSpeed: 0
    },
    '~': {
      tankSpeed: 3,
      tankTurn: 0.25,
      manSpeed: 4
    },
    '%': {
      tankSpeed: 3,
      tankTurn: 0.25,
      manSpeed: 4
    },
    '=': {
      tankSpeed: 16,
      tankTurn: 1.00,
      manSpeed: 16
    },
    '#': {
      tankSpeed: 6,
      tankTurn: 0.50,
      manSpeed: 8
    },
    ':': {
      tankSpeed: 3,
      tankTurn: 0.25,
      manSpeed: 4
    },
    '.': {
      tankSpeed: 12,
      tankTurn: 1.00,
      manSpeed: 16
    },
    '}': {
      tankSpeed: 0,
      tankTurn: 0.00,
      manSpeed: 0
    },
    'b': {
      tankSpeed: 16,
      tankTurn: 1.00,
      manSpeed: 16
    },
    '^': {
      tankSpeed: 3,
      tankTurn: 0.50,
      manSpeed: 0
    }
  };
  extendTerrainMap = function() {
    var ascii, attributes, key, type, value, _results, _results2;
    _results = [];
    for (ascii in TERRAIN_TYPE_ATTRIBUTES) {
      if (!__hasProp.call(TERRAIN_TYPE_ATTRIBUTES, ascii)) continue;
      attributes = TERRAIN_TYPE_ATTRIBUTES[ascii];
      type = TERRAIN_TYPES[ascii];
      _results.push(function() {
        _results2 = [];
        for (key in attributes) {
          if (!__hasProp.call(attributes, key)) continue;
          value = attributes[key];
          _results2.push(type[key] = value);
        }
        return _results2;
      }());
    }
    return _results;
  };
  extendTerrainMap();
  WorldMapCell = function() {
    function WorldMapCell(map, x, y) {
      WorldMapCell.__super__.constructor.apply(this, arguments);
      this.life = 0;
    }
    __extends(WorldMapCell, Map.prototype.CellClass);
    WorldMapCell.prototype.isObstacle = function() {
      var _ref;
      return ((_ref = this.pill) != null ? _ref.armour : void 0) > 0 || this.type.tankSpeed === 0;
    };
    WorldMapCell.prototype.hasTankOnBoat = function() {
      var tank, _i, _len, _ref;
      _ref = this.map.world.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (tank.armour !== 255 && tank.cell === this) {
          if (tank.onBoat) {
            return true;
          }
        }
      }
      return false;
    };
    WorldMapCell.prototype.getTankSpeed = function(tank) {
      var _ref, _ref2;
      if (((_ref = this.pill) != null ? _ref.armour : void 0) > 0) {
        return 0;
      }
      if ((_ref2 = this.base) != null ? _ref2.owner : void 0) {
        if (!(this.base.owner.$.isAlly(tank) || this.base.armour <= 9)) {
          return 0;
        }
      }
      if (tank.onBoat && this.isType('^', ' ')) {
        return 16;
      }
      return this.type.tankSpeed;
    };
    WorldMapCell.prototype.getTankTurn = function(tank) {
      var _ref, _ref2;
      if (((_ref = this.pill) != null ? _ref.armour : void 0) > 0) {
        return 0.00;
      }
      if ((_ref2 = this.base) != null ? _ref2.owner : void 0) {
        if (!(this.base.owner.$.isAlly(tank) || this.base.armour <= 9)) {
          return 0.00;
        }
      }
      if (tank.onBoat && this.isType('^', ' ')) {
        return 1.00;
      }
      return this.type.tankTurn;
    };
    WorldMapCell.prototype.getManSpeed = function(man) {
      var tank, _ref, _ref2;
      tank = man.owner.$;
      if (((_ref = this.pill) != null ? _ref.armour : void 0) > 0) {
        return 0;
      }
      if (((_ref2 = this.base) != null ? _ref2.owner : void 0) != null) {
        if (!(this.base.owner.$.isAlly(tank) || this.base.armour <= 9)) {
          return 0;
        }
      }
      return this.type.manSpeed;
    };
    WorldMapCell.prototype.getPixelCoordinates = function() {
      return [(this.x + 0.5) * TILE_SIZE_PIXELS, (this.y + 0.5) * TILE_SIZE_PIXELS];
    };
    WorldMapCell.prototype.getWorldCoordinates = function() {
      return [(this.x + 0.5) * TILE_SIZE_WORLD, (this.y + 0.5) * TILE_SIZE_WORLD];
    };
    WorldMapCell.prototype.setType = function(newType, mine, retileRadius) {
      var hadMine, oldLife, oldType, _ref, _ref2;
      _ref = [this.type, this.mine, this.life], oldType = _ref[0], hadMine = _ref[1], oldLife = _ref[2];
      WorldMapCell.__super__.setType.apply(this, arguments);
      this.life = function() {
        switch (this.type.ascii) {
          case '.':
            return 5;
          case '}':
            return 5;
          case ':':
            return 5;
          case '~':
            return 4;
          default:
            return 0;
        }
      }.call(this);
      return (_ref2 = this.map.world) != null ? _ref2.mapChanged(this, oldType, hadMine, oldLife) : void 0;
    };
    WorldMapCell.prototype.takeShellHit = function(shell) {
      var neigh, nextType, sfx, _ref, _ref2;
      sfx = sounds.SHOT_BUILDING;
      if (this.isType('.', '}', ':', '~')) {
        if (--this.life === 0) {
          nextType = function() {
            switch (this.type.ascii) {
              case '.':
                return '~';
              case '}':
                return ':';
              case ':':
                return ' ';
              case '~':
                return ' ';
            }
          }.call(this);
          this.setType(nextType);
        } else {
          if ((_ref = this.map.world) != null) {
            _ref.mapChanged(this, this.type, this.mine);
          }
        }
      } else if (this.isType('#')) {
        this.setType('.');
        sfx = sounds.SHOT_TREE;
      } else if (this.isType('=')) {
        neigh = shell.direction >= 224 || shell.direction < 32 ? this.neigh(1, 0) : shell.direction >= 32 && shell.direction < 96 ? this.neigh(0, -1) : shell.direction >= 96 && shell.direction < 160 ? this.neigh(-1, 0) : this.neigh(0, 1);
        if (neigh.isType(' ', '^')) {
          this.setType(' ');
        }
      } else {
        nextType = function() {
          switch (this.type.ascii) {
            case '|':
              return '}';
            case 'b':
              return ' ';
          }
        }.call(this);
        this.setType(nextType);
      }
      if (this.isType(' ')) {
        if ((_ref2 = this.map.world) != null) {
          _ref2.spawn(FloodFill, this);
        }
      }
      return sfx;
    };
    WorldMapCell.prototype.takeExplosionHit = function() {
      var _ref;
      if (this.pill != null) {
        return this.pill.takeExplosionHit();
      }
      if (this.isType('b')) {
        this.setType(' ');
      } else if (!this.isType(' ', '^', 'b')) {
        this.setType('%');
      } else {
        return;
      }
      return (_ref = this.map.world) != null ? _ref.spawn(FloodFill, this) : void 0;
    };
    return WorldMapCell;
  }();
  WorldMap = function() {
    function WorldMap() {
      WorldMap.__super__.constructor.apply(this, arguments);
    }
    __extends(WorldMap, Map);
    WorldMap.prototype.CellClass = WorldMapCell;
    WorldMap.prototype.PillboxClass = WorldPillbox;
    WorldMap.prototype.BaseClass = WorldBase;
    WorldMap.prototype.cellAtPixel = function(x, y) {
      return this.cellAtTile(floor(x / TILE_SIZE_PIXELS), floor(y / TILE_SIZE_PIXELS));
    };
    WorldMap.prototype.cellAtWorld = function(x, y) {
      return this.cellAtTile(floor(x / TILE_SIZE_WORLD), floor(y / TILE_SIZE_WORLD));
    };
    WorldMap.prototype.getRandomStart = function() {
      return this.starts[round(random() * (this.starts.length - 1))];
    };
    return WorldMap;
  }();
  module.exports = WorldMap;
}).call(this);
