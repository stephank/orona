(function() {
  var require;
  require = function(path) {
    var m, originalPath;
    originalPath = path;
    if (!(m = require.modules[path])) {
      path += '/index';
      if (!(m = require.modules[path])) {
        throw ("Couldn't find module for: " + originalPath);
      }
    }
    if (!(m.exports)) {
      m.exports = {};
      m.call(m.exports, m, m.exports, require.bind(path));
    }
    return m.exports;
  };
  require.modules = {};
  require.bind = function(path) {
    return function(p) {
      var _i, _len, _ref, cwd, part;
      if (p.charAt(0) !== '.') {
        return require(p);
      }
      cwd = path.split('/');
      cwd.pop();
      _ref = p.split('/');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        part = _ref[_i];
        if (part === '..') {
          cwd.pop();
        } else {
          if (part !== '.') {
            cwd.push(part);
          }
        }
      }
      return require(cwd.join('/'));
    };
  };
  require.module = function(path, fn) {
    return (require.modules[path] = fn);
  };
  window.require = require;
}).call(this);
require.module('bolo/client/index', function(module, exports, require) {
(function() {
  var BoloLocalWorld, BoloNetworkWorld;
  BoloLocalWorld = require('./world/local');
  BoloNetworkWorld = require('./world/client');
  if (location.hostname.split('.')[1] === 'github') {
    module.exports = BoloLocalWorld;
  } else {
    module.exports = BoloNetworkWorld;
  }
}).call(this);

});
require.module('bolo/client/world/local', function(module, exports, require) {
(function() {
  var BoloLocalWorld, EverardIsland, NetLocalWorld, Tank, WorldMap, allObjects, decodeBase64, helpers;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  NetLocalWorld = require('villain/world/net/local');
  WorldMap = require('../../world_map');
  EverardIsland = require('../everard');
  allObjects = require('../../objects/all');
  Tank = require('../../objects/tank');
  decodeBase64 = require('../base64').decodeBase64;
  helpers = require('../../helpers');
  BoloLocalWorld = (function() {
    return function BoloLocalWorld() {
      return NetLocalWorld.apply(this, arguments);
    };
  })();
  __extends(BoloLocalWorld, NetLocalWorld);
  BoloLocalWorld.prototype.authority = true;
  BoloLocalWorld.prototype.loaded = function() {
    this.map = WorldMap.load(decodeBase64(EverardIsland));
    this.commonInitialization();
    this.spawnMapObjects();
    this.player = this.spawn(Tank);
    this.renderer.initHud();
    return this.loop.start();
  };
  BoloLocalWorld.prototype.soundEffect = function(sfx, x, y, owner) {
    return this.renderer.playSound(sfx, x, y, owner);
  };
  BoloLocalWorld.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {};
  BoloLocalWorld.prototype.handleKeydown = function(e) {
    switch (e.which) {
      case 32:
        this.player.shooting = true;
        break;
      case 37:
        this.player.turningCounterClockwise = true;
        break;
      case 38:
        this.player.accelerating = true;
        break;
      case 39:
        this.player.turningClockwise = true;
        break;
      case 40:
        this.player.braking = true;
        break;
    }
    return e.preventDefault();
  };
  BoloLocalWorld.prototype.handleKeyup = function(e) {
    switch (e.which) {
      case 32:
        this.player.shooting = false;
        break;
      case 37:
        this.player.turningCounterClockwise = false;
        break;
      case 38:
        this.player.accelerating = false;
        break;
      case 39:
        this.player.turningClockwise = false;
        break;
      case 40:
        this.player.braking = false;
        break;
      default:
        return null;
    }
    return e.preventDefault();
  };
  helpers.extend(BoloLocalWorld.prototype, require('./mixin'));
  allObjects.registerWithWorld(BoloLocalWorld.prototype);
  module.exports = BoloLocalWorld;
}).call(this);

});
require.module('villain/world/net/local', function(module, exports, require) {
(function() {
  var BaseWorld, NetLocalWorld;
  var __slice = Array.prototype.slice, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  BaseWorld = require('../base');
  NetLocalWorld = (function() {
    return function NetLocalWorld() {
      return BaseWorld.apply(this, arguments);
    };
  })();
  __extends(NetLocalWorld, BaseWorld);
  NetLocalWorld.prototype.spawn = function(type) {
    var args, obj;
    args = __slice.call(arguments, 1);
    obj = this.insert(new type(this));
    obj.spawn.apply(obj, args);
    obj.anySpawn();
    return obj;
  };
  NetLocalWorld.prototype.update = function(obj) {
    obj.update();
    obj.emit('update');
    obj.emit('anyUpdate');
    return obj;
  };
  NetLocalWorld.prototype.destroy = function(obj) {
    obj.destroy();
    obj.emit('destroy');
    obj.emit('finalize');
    this.remove(obj);
    return obj;
  };
  module.exports = NetLocalWorld;
}).call(this);

});
require.module('villain/world/base', function(module, exports, require) {
(function() {
  var BaseWorld;
  var __slice = Array.prototype.slice;
  BaseWorld = (function() {
    return function BaseWorld() {
      this.objects = [];
      return this;
    };
  })();
  BaseWorld.prototype.tick = function() {
    var _i, _len, _ref, obj;
    _ref = this.objects.slice(0);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      this.update(obj);
    }
    return null;
  };
  BaseWorld.prototype.insert = function(obj) {
    var _len, _ref, i, other;
    _ref = this.objects;
    for (i = 0, _len = _ref.length; i < _len; i++) {
      other = _ref[i];
      if (obj.updatePriority > other.updatePriority) {
        break;
      }
    }
    this.objects.splice(i, 0, obj);
    _ref = this.objects.length;
    for (i = i; (i <= _ref ? i < _ref : i > _ref); (i <= _ref ? i += 1 : i -= 1)) {
      this.objects[i].idx = i;
    }
    return obj;
  };
  BaseWorld.prototype.remove = function(obj) {
    var _ref, _ref2, i;
    this.objects.splice(obj.idx, 1);
    _ref = obj.idx; _ref2 = this.objects.length;
    for (i = _ref; (_ref <= _ref2 ? i < _ref2 : i > _ref2); (_ref <= _ref2 ? i += 1 : i -= 1)) {
      this.objects[i].idx = i;
    }
    obj.idx = null;
    return obj;
  };
  BaseWorld.prototype.registerType = function(type) {};
  BaseWorld.prototype.spawn = function(type) {
    var args;
    args = __slice.call(arguments, 1);
  };
  BaseWorld.prototype.update = function(obj) {};
  BaseWorld.prototype.destroy = function(obj) {};
  module.exports = BaseWorld;
}).call(this);

});
require.module('bolo/world_map', function(module, exports, require) {
(function() {
  var Map, TERRAIN_TYPES, TERRAIN_TYPE_ATTRIBUTES, TILE_SIZE_PIXELS, TILE_SIZE_WORLD, WorldBase, WorldMap, WorldMapCell, WorldPillbox, _ref, extendTerrainMap, floor, net, random, round, sounds;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  _ref = Math, round = _ref.round, random = _ref.random, floor = _ref.floor;
  _ref = require('./constants'), TILE_SIZE_WORLD = _ref.TILE_SIZE_WORLD, TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS;
  _ref = require('./map'), Map = _ref.Map, TERRAIN_TYPES = _ref.TERRAIN_TYPES;
  net = require('./net');
  sounds = require('./sounds');
  WorldPillbox = require('./objects/world_pillbox');
  WorldBase = require('./objects/world_base');
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
    var _ref2, _result, _result2, ascii, attributes, key, type, value;
    _result = []; _ref2 = TERRAIN_TYPE_ATTRIBUTES;
    for (ascii in _ref2) {
      if (!__hasProp.call(_ref2, ascii)) continue;
      attributes = _ref2[ascii];
      _result.push((function() {
        type = TERRAIN_TYPES[ascii];
        _result2 = [];
        for (key in attributes) {
          if (!__hasProp.call(attributes, key)) continue;
          value = attributes[key];
          _result2.push(type[key] = value);
        }
        return _result2;
      })());
    }
    return _result;
  };
  extendTerrainMap();
  WorldMapCell = (function() {
    return function WorldMapCell(map, x, y) {
      WorldMapCell.__super__.constructor.apply(this, arguments);
      this.life = 0;
      return this;
    };
  })();
  __extends(WorldMapCell, Map.prototype.CellClass);
  WorldMapCell.prototype.isObstacle = function() {
    var _ref2;
    return (((_ref2 = this.pill) != null) ? _ref2.armour > 0 : undefined) || this.type.tankSpeed === 0;
  };
  WorldMapCell.prototype.getTankSpeed = function(tank) {
    var _ref2;
    if ((((_ref2 = this.pill) != null) ? _ref2.armour > 0 : undefined)) {
      return 0;
    }
    if ((((_ref2 = this.base) != null) ? _ref2.owner : undefined)) {
      if (!(this.base.owner.$.isAlly(tank) || (this.base.armour <= 9))) {
        return 0;
      }
    }
    if (tank.onBoat && this.isType('^', ' ')) {
      return 16;
    }
    return this.type.tankSpeed;
  };
  WorldMapCell.prototype.getTankTurn = function(tank) {
    var _ref2;
    if ((((_ref2 = this.pill) != null) ? _ref2.armour > 0 : undefined)) {
      return 0.00;
    }
    if ((((_ref2 = this.base) != null) ? _ref2.owner : undefined)) {
      if (!(this.base.owner.$.isAlly(tank) || (this.base.armour <= 9))) {
        return 0.00;
      }
    }
    if (tank.onBoat && this.isType('^', ' ')) {
      return 1.00;
    }
    return this.type.tankTurn;
  };
  WorldMapCell.prototype.getManSpeed = function(man) {
    var _ref2, tank;
    tank = man.tank;
    if ((((_ref2 = this.pill) != null) ? _ref2.armour > 0 : undefined)) {
      return 0;
    }
    if ((((_ref2 = this.base) != null) ? _ref2.owner : undefined) != null) {
      if (!(this.base.owner === tank || tank.isAlly(this.base.owner) || (this.base.armour <= 9))) {
        return 0;
      }
    }
    if (man.onBoat && this.isType('^', ' ')) {
      return 16;
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
    var _ref2, hadMine, oldLife, oldType;
    _ref2 = [this.type, this.mine, this.life], oldType = _ref2[0], hadMine = _ref2[1], oldLife = _ref2[2];
    WorldMapCell.__super__.setType.apply(this, arguments);
    this.life = (function() {
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
    }).call(this);
    return (((_ref2 = this.map.world) != null) ? _ref2.mapChanged(this, oldType, hadMine, oldLife) : undefined);
  };
  WorldMapCell.prototype.takeShellHit = function(shell) {
    var _ref2, neigh, nextType, sfx;
    sfx = sounds.SHOT_BUILDING;
    if (this.isType('.', '}', ':', '~')) {
      if (--this.life === 0) {
        nextType = (function() {
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
        }).call(this);
        this.setType(nextType);
      } else {
        (((_ref2 = this.map.world) != null) ? _ref2.mapChanged(this, this.type, this.mine) : undefined);
      }
    } else if (this.isType('#')) {
      this.setType('.');
      sfx = sounds.SHOT_TREE;
    } else if (this.isType('=')) {
      neigh = (shell.direction >= 224) || shell.direction < 32 ? this.neigh(1, 0) : ((shell.direction >= 32) && shell.direction < 96 ? this.neigh(0, -1) : ((shell.direction >= 96) && shell.direction < 160 ? this.neigh(-1, 0) : this.neigh(0, 1)));
      if (neigh.isType(' ', '^')) {
        this.setType(' ');
      }
    } else {
      nextType = (function() {
        switch (this.type.ascii) {
          case '|':
            return '}';
          case 'b':
            return ' ';
        }
      }).call(this);
      this.setType(nextType);
    }
    return sfx;
  };
  WorldMapCell.prototype.takeExplosionHit = function() {
    return (this.pill != null) ? this.pill.takeExplosionHit() : (this.isType('b') ? this.setType(' ') : (!(this.isType(' ', '^', 'b')) ? this.setType('%') : undefined));
  };
  WorldMap = (function() {
    return function WorldMap() {
      return Map.apply(this, arguments);
    };
  })();
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
  module.exports = WorldMap;
}).call(this);

});
require.module('bolo/constants', function(module, exports, require) {
(function() {
  exports.TILE_SIZE_WORLD = 256;
  exports.TILE_SIZE_PIXELS = 32;
  exports.PIXEL_SIZE_WORLD = 8;
  exports.MAP_SIZE_TILES = 256;
  exports.TICK_LENGTH_MS = 20;
}).call(this);

});
require.module('bolo/map', function(module, exports, require) {
(function() {
  var Base, MAP_SIZE_TILES, Map, MapCell, MapView, Pillbox, Start, TERRAIN_TYPES, _ref, createTerrainMap, floor, min;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  _ref = Math, floor = _ref.floor, min = _ref.min;
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
    var _i, _len, _ref2, _result, type;
    _result = []; _ref2 = TERRAIN_TYPES;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      type = _ref2[_i];
      _result.push(TERRAIN_TYPES[type.ascii] = type);
    }
    return _result;
  };
  createTerrainMap();
  MapCell = (function() {
    return function MapCell(_arg, _arg2, _arg3) {
      this.y = _arg3;
      this.x = _arg2;
      this.map = _arg;
      this.type = TERRAIN_TYPES['^'];
      this.mine = false;
      this.idx = this.y * MAP_SIZE_TILES + this.x;
      return this;
    };
  })();
  MapCell.prototype.neigh = function(dx, dy) {
    return this.map.cellAtTile(this.x + dx, this.y + dy);
  };
  MapCell.prototype.isType = function() {
    var _ref2, i, type;
    _ref2 = arguments.length;
    for (i = 0; (0 <= _ref2 ? i <= _ref2 : i >= _ref2); (0 <= _ref2 ? i += 1 : i -= 1)) {
      type = arguments[i];
      if (this.type === type || this.type.ascii === type) {
        return true;
      }
    }
    return false;
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
    mine || (mine = false);
    retileRadius || (retileRadius = 1);
    oldType = this.type;
    hadMine = this.mine;
    this.mine = mine;
    if (typeof (newType) === 'string') {
      this.type = TERRAIN_TYPES[newType];
      if (newType.length !== 1 || !(this.type != null)) {
        throw ("Invalid terrain type: " + newType);
      }
    } else if (typeof (newType) === 'number') {
      if (newType >= 10) {
        newType -= 8;
        this.mine = true;
      } else {
        this.mine = false;
      }
      this.type = TERRAIN_TYPES[newType];
      if (!(this.type != null)) {
        throw ("Invalid terrain type: " + newType);
      }
    } else {
      this.type = newType;
    }
    return !(retileRadius < 0) ? this.map.retile(this.x - retileRadius, this.y - retileRadius, this.x + retileRadius, this.y + retileRadius) : undefined;
  };
  MapCell.prototype.setTile = function(tx, ty) {
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
    return aboveLeft !== 'd' && above !== 'd' && left !== 'd' && right === 'd' && below === 'd' ? this.setTile(10, 3) : (aboveRight !== 'd' && above !== 'd' && right !== 'd' && left === 'd' && below === 'd' ? this.setTile(11, 3) : (belowRight !== 'd' && below !== 'd' && right !== 'd' && left === 'd' && above === 'd' ? this.setTile(13, 3) : (belowLeft !== 'd' && below !== 'd' && left !== 'd' && right === 'd' && above === 'd' ? this.setTile(12, 3) : (left === 'w' && right === 'd' ? this.setTile(14, 3) : (below === 'w' && above === 'd' ? this.setTile(15, 3) : (above === 'w' && below === 'd' ? this.setTile(16, 3) : (right === 'w' && left === 'd' ? this.setTile(17, 3) : this.setTile(0, 0))))))));
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
    return aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(17, 1) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b' ? this.setTile(30, 1) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft === 'b' ? this.setTile(22, 2) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft === 'b' && belowRight !== 'b' && belowLeft !== 'b' ? this.setTile(23, 2) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight === 'b' && belowLeft !== 'b' ? this.setTile(24, 2) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight === 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b' ? this.setTile(25, 2) : (aboveLeft === 'b' && above === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(16, 2) : (above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(17, 2) : (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' ? this.setTile(18, 2) : (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(19, 2) : (left === 'b' && right === 'b' && above === 'b' && below === 'b' && aboveRight === 'b' && belowLeft === 'b' && aboveLeft !== 'b' && belowRight !== 'b' ? this.setTile(20, 2) : (left === 'b' && right === 'b' && above === 'b' && below === 'b' && belowRight === 'b' && aboveLeft === 'b' && aboveRight !== 'b' && belowLeft !== 'b' ? this.setTile(21, 2) : (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b' && aboveRight === 'b' ? this.setTile(8, 2) : (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && aboveLeft === 'b' ? this.setTile(9, 2) : (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight === 'b' ? this.setTile(10, 2) : (above === 'b' && left === 'b' && right === 'b' && below === 'b' && aboveLeft === 'b' && aboveRight === 'b' ? this.setTile(11, 2) : (above === 'b' && below === 'b' && left === 'b' && right !== 'b' && belowLeft === 'b' && aboveLeft !== 'b' ? this.setTile(12, 2) : (above === 'b' && below === 'b' && right === 'b' && belowRight === 'b' && left !== 'b' && aboveRight !== 'b' ? this.setTile(13, 2) : (above === 'b' && below === 'b' && right === 'b' && aboveRight === 'b' && belowRight !== 'b' ? this.setTile(14, 2) : (above === 'b' && below === 'b' && left === 'b' && aboveLeft === 'b' && belowLeft !== 'b' ? this.setTile(15, 2) : (right === 'b' && above === 'b' && left === 'b' && below !== 'b' && aboveLeft !== 'b' && aboveRight !== 'b' ? this.setTile(26, 1) : (right === 'b' && below === 'b' && left === 'b' && belowLeft !== 'b' && belowRight !== 'b' ? this.setTile(27, 1) : (right === 'b' && above === 'b' && below === 'b' && aboveRight !== 'b' && belowRight !== 'b' ? this.setTile(28, 1) : (below === 'b' && above === 'b' && left === 'b' && aboveLeft !== 'b' && belowLeft !== 'b' ? this.setTile(29, 1) : (left === 'b' && right === 'b' && above === 'b' && aboveRight === 'b' && aboveLeft !== 'b' ? this.setTile(4, 2) : (left === 'b' && right === 'b' && above === 'b' && aboveLeft === 'b' && aboveRight !== 'b' ? this.setTile(5, 2) : (left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight !== 'b' ? this.setTile(6, 2) : (left === 'b' && right === 'b' && below === 'b' && above !== 'b' && belowRight === 'b' && belowLeft !== 'b' ? this.setTile(7, 2) : (right === 'b' && above === 'b' && below === 'b' ? this.setTile(0, 2) : (left === 'b' && above === 'b' && below === 'b' ? this.setTile(1, 2) : (right === 'b' && left === 'b' && below === 'b' ? this.setTile(2, 2) : (right === 'b' && above === 'b' && left === 'b' ? this.setTile(3, 2) : (right === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(18, 1) : (left === 'b' && below === 'b' && belowLeft === 'b' ? this.setTile(19, 1) : (right === 'b' && above === 'b' && aboveRight === 'b' ? this.setTile(20, 1) : (left === 'b' && above === 'b' && aboveLeft === 'b' ? this.setTile(21, 1) : (right === 'b' && below === 'b' ? this.setTile(22, 1) : (left === 'b' && below === 'b' ? this.setTile(23, 1) : (right === 'b' && above === 'b' ? this.setTile(24, 1) : (left === 'b' && above === 'b' ? this.setTile(25, 1) : (left === 'b' && right === 'b' ? this.setTile(11, 1) : (above === 'b' && below === 'b' ? this.setTile(12, 1) : (right === 'b' ? this.setTile(13, 1) : (left === 'b' ? this.setTile(14, 1) : (below === 'b' ? this.setTile(15, 1) : (above === 'b' ? this.setTile(16, 1) : this.setTile(6, 1))))))))))))))))))))))))))))))))))))))))))))));
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
    return above === 'l' && below === 'l' && right === 'l' && left === 'l' ? this.setTile(30, 2) : (above === 'l' && below === 'l' && right === 'w' && left === 'l' ? this.setTile(26, 2) : (above === 'l' && below === 'l' && right === 'l' && left === 'w' ? this.setTile(27, 2) : (above === 'l' && below === 'w' && right === 'l' && left === 'l' ? this.setTile(28, 2) : (above === 'w' && below === 'l' && right === 'l' && left === 'l' ? this.setTile(29, 2) : (above === 'l' && left === 'l' ? this.setTile(6, 3) : (above === 'l' && right === 'l' ? this.setTile(7, 3) : (below === 'l' && left === 'l' ? this.setTile(8, 3) : (below === 'l' && right === 'l' ? this.setTile(9, 3) : (below === 'l' && above === 'l' && below === 'l' ? this.setTile(0, 3) : (left === 'l' && right === 'l' ? this.setTile(1, 3) : (left === 'l' ? this.setTile(2, 3) : (below === 'l' ? this.setTile(3, 3) : (right === 'l' ? this.setTile(4, 3) : (above === 'l' ? this.setTile(5, 3) : this.setTile(1, 0)))))))))))))));
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
    return aboveLeft !== 'r' && above === 'r' && aboveRight !== 'r' && left === 'r' && right === 'r' && belowLeft !== 'r' && below === 'r' && belowRight !== 'r' ? this.setTile(11, 0) : (above === 'r' && left === 'r' && right === 'r' && below === 'r' ? this.setTile(10, 0) : (left === 'w' && right === 'w' && above === 'w' && below === 'w' ? this.setTile(26, 0) : (right === 'r' && below === 'r' && left === 'w' && above === 'w' ? this.setTile(20, 0) : (left === 'r' && below === 'r' && right === 'w' && above === 'w' ? this.setTile(21, 0) : (above === 'r' && left === 'r' && below === 'w' && right === 'w' ? this.setTile(22, 0) : (right === 'r' && above === 'r' && left === 'w' && below === 'w' ? this.setTile(23, 0) : (above === 'w' && below === 'w' ? this.setTile(24, 0) : (left === 'w' && right === 'w' ? this.setTile(25, 0) : (above === 'w' && below === 'r' ? this.setTile(16, 0) : (right === 'w' && left === 'r' ? this.setTile(17, 0) : (below === 'w' && above === 'r' ? this.setTile(18, 0) : (left === 'w' && right === 'r' ? this.setTile(19, 0) : (right === 'r' && below === 'r' && above === 'r' && (aboveRight === 'r' || belowRight === 'r') ? this.setTile(27, 0) : (left === 'r' && right === 'r' && below === 'r' && (belowLeft === 'r' || belowRight === 'r') ? this.setTile(28, 0) : (left === 'r' && above === 'r' && below === 'r' && (belowLeft === 'r' || aboveLeft === 'r') ? this.setTile(29, 0) : (left === 'r' && right === 'r' && above === 'r' && (aboveRight === 'r' || aboveLeft === 'r') ? this.setTile(30, 0) : (left === 'r' && right === 'r' && below === 'r' ? this.setTile(12, 0) : (left === 'r' && above === 'r' && below === 'r' ? this.setTile(13, 0) : (left === 'r' && right === 'r' && above === 'r' ? this.setTile(14, 0) : (right === 'r' && above === 'r' && below === 'r' ? this.setTile(15, 0) : (below === 'r' && right === 'r' && belowRight === 'r' ? this.setTile(6, 0) : (below === 'r' && left === 'r' && belowLeft === 'r' ? this.setTile(7, 0) : (above === 'r' && left === 'r' && aboveLeft === 'r' ? this.setTile(8, 0) : (above === 'r' && right === 'r' && aboveRight === 'r' ? this.setTile(9, 0) : (below === 'r' && right === 'r' ? this.setTile(2, 0) : (below === 'r' && left === 'r' ? this.setTile(3, 0) : (above === 'r' && left === 'r' ? this.setTile(4, 0) : (above === 'r' && right === 'r' ? this.setTile(5, 0) : (right === 'r' || left === 'r' ? this.setTile(0, 1) : (above === 'r' || below === 'r' ? this.setTile(1, 1) : this.setTile(10, 0)))))))))))))))))))))))))))))));
  };
  MapCell.prototype.retileForest = function() {
    var above, below, left, right;
    above = this.neigh(0, -1).isType('#');
    right = this.neigh(1, 0).isType('#');
    below = this.neigh(0, 1).isType('#');
    left = this.neigh(-1, 0).isType('#');
    return !above && !left && right && below ? this.setTile(9, 9) : (!above && left && !right && below ? this.setTile(10, 9) : (above && left && !right && !below ? this.setTile(11, 9) : (above && !left && right && !below ? this.setTile(12, 9) : (above && !left && !right && !below ? this.setTile(16, 9) : (!above && !left && !right && below ? this.setTile(15, 9) : (!above && left && !right && !below ? this.setTile(14, 9) : (!above && !left && right && !below ? this.setTile(13, 9) : (!above && !left && !right && !below ? this.setTile(8, 9) : this.setTile(3, 1)))))))));
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
    return above !== 'w' && left !== 'w' ? this.setTile(15, 6) : (above !== 'w' && right !== 'w' ? this.setTile(16, 6) : (below !== 'w' && right !== 'w' ? this.setTile(17, 6) : (below !== 'w' && left !== 'w' ? this.setTile(14, 6) : (left !== 'w' ? this.setTile(12, 6) : (right !== 'w' ? this.setTile(13, 6) : (below !== 'w' ? this.setTile(10, 6) : this.setTile(11, 6)))))));
  };
  MapView = (function() {
    return function MapView() {};
  })();
  MapView.prototype.onRetile = function(cell, tx, ty) {};
  Pillbox = (function() {
    return function Pillbox(map, _arg, _arg2, _arg3, _arg4, _arg5) {
      this.speed = _arg5;
      this.armour = _arg4;
      this.owner_idx = _arg3;
      this.y = _arg2;
      this.x = _arg;
      return this;
    };
  })();
  Base = (function() {
    return function Base(map, _arg, _arg2, _arg3, _arg4, _arg5, _arg6) {
      this.mines = _arg6;
      this.shells = _arg5;
      this.armour = _arg4;
      this.owner_idx = _arg3;
      this.y = _arg2;
      this.x = _arg;
      return this;
    };
  })();
  Start = (function() {
    return function Start(map, _arg, _arg2, _arg3) {
      this.direction = _arg3;
      this.y = _arg2;
      this.x = _arg;
      return this;
    };
  })();
  Map = (function() {
    return function Map() {
      var row, x, y;
      this.view = new MapView();
      this.pills = [];
      this.bases = [];
      this.starts = [];
      this.cells = new Array(MAP_SIZE_TILES);
      for (y = 0; (0 <= MAP_SIZE_TILES ? y < MAP_SIZE_TILES : y > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? y += 1 : y -= 1)) {
        row = (this.cells[y] = new Array(MAP_SIZE_TILES));
        for (x = 0; (0 <= MAP_SIZE_TILES ? x < MAP_SIZE_TILES : x > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? x += 1 : x -= 1)) {
          row[x] = new this.CellClass(this, x, y);
        }
      }
      return this;
    };
  })();
  Map.prototype.CellClass = MapCell;
  Map.prototype.PillboxClass = Pillbox;
  Map.prototype.BaseClass = Base;
  Map.prototype.StartClass = Start;
  Map.prototype.setView = function(_arg) {
    this.view = _arg;
    return this.retile();
  };
  Map.prototype.cellAtTile = function(x, y) {
    var _ref2, cell;
    return (cell = (((_ref2 = this.cells[y]) != null) ? _ref2[x] : undefined)) ? cell : new this.CellClass(this, x, y, {
      isDummy: true
    });
  };
  Map.prototype.each = function(cb, sx, sy, ex, ey) {
    var row, x, y;
    if (!((sx != null) && (sx >= 0))) {
      sx = 0;
    }
    if (!((sy != null) && (sy >= 0))) {
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
      return (cell.mine = false);
    }, sx, sy, ex, ey);
  };
  Map.prototype.retile = function(sx, sy, ex, ey) {
    return this.each(function(cell) {
      return cell.retile();
    }, sx, sy, ex, ey);
  };
  Map.prototype.dump = function(options) {
    var _i, _len, _ref2, _result, b, bases, c, consecutiveCells, data, encodeNibbles, ensureRunSpace, ex, flushRun, flushSequence, p, pills, run, s, seq, starts, sx, y;
    options || (options = {});
    consecutiveCells = function(row, cb) {
      var _len, cell, count, currentType, num, startx, x;
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
      return null;
    };
    encodeNibbles = function(nibbles) {
      var _len, i, nibble, octets, val;
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
    data = (function() {
      _result = []; _ref2 = 'BMAPBOLO';
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        c = _ref2[_i];
        _result.push(c.charCodeAt(0));
      }
      return _result;
    })();
    data.push(1, pills.length, bases.length, starts.length);
    for (_i = 0, _len = pills.length; _i < _len; _i++) {
      p = pills[_i];
      data.push(p.x, p.y, p.owner_idx, p.armour, p.speed);
    }
    for (_i = 0, _len = bases.length; _i < _len; _i++) {
      b = bases[_i];
      data.push(b.x, b.y, b.owner_idx, b.armour, b.shells, b.mines);
    }
    for (_i = 0, _len = starts.length; _i < _len; _i++) {
      s = starts[_i];
      data.push(s.x, s.y, s.direction);
    }
    run = (seq = (sx = (ex = (y = null))));
    flushRun = function() {
      var octets;
      if (!(run != null)) {
        return null;
      }
      flushSequence();
      octets = encodeNibbles(run);
      data.push(octets.length + 4, y, sx, ex);
      data = data.concat(octets);
      return (run = null);
    };
    ensureRunSpace = function(numNibbles) {
      if (!((255 - 4) * 2 - run.length < numNibbles)) {
        return null;
      }
      flushRun();
      run = [];
      return (sx = ex);
    };
    flushSequence = function() {
      var localSeq;
      if (!(seq != null)) {
        return null;
      }
      localSeq = seq;
      seq = null;
      ensureRunSpace(localSeq.length + 1);
      run.push(localSeq.length - 1);
      run = run.concat(localSeq);
      return ex += localSeq.length;
    };
    _ref2 = this.cells;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      (function() {
        var row = _ref2[_i];
        y = row[0].y;
        run = (sx = (ex = (seq = null)));
        return consecutiveCells(row, function(type, count, x) {
          var _result2, seqLen;
          if (type === -1) {
            flushRun();
            return null;
          }
          if (!(run != null)) {
            run = [];
            sx = (ex = x);
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
          _result2 = [];
          while (count > 0) {
            _result2.push((function() {
              if (!(seq != null)) {
                seq = [];
              }
              seq.push(type);
              if (seq.length === 8) {
                flushSequence();
              }
              return count--;
            })());
          }
          return _result2;
        });
      })();
    }
    flushRun();
    data.push(4, 0xFF, 0xFF, 0xFF);
    return data;
  };
  Map.load = function(buffer) {
    var _ctor, _i, _len, _ref2, _result, _result2, args, basesData, c, dataLen, ex, filePos, i, magic, map, numBases, numPills, numStarts, pillsData, readBytes, run, runPos, seqLen, startsData, sx, takeNibble, type, version, x, y;
    filePos = 0;
    readBytes = function(num, msg) {
      var _i, _len, _ref2, _result, sub, x;
      sub = (function() {
        try {
          _result = []; _ref2 = buffer.slice(filePos, filePos + num);
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            x = _ref2[_i];
            _result.push(x);
          }
          return _result;
        } catch (e) {
          throw msg;
        }
      })();
      filePos += num;
      return sub;
    };
    magic = readBytes(8, "Not a Bolo map.");
    _ref2 = 'BMAPBOLO';
    for (i = 0, _len = _ref2.length; i < _len; i++) {
      c = _ref2[i];
      if (c.charCodeAt(0) !== magic[i]) {
        throw "Not a Bolo map.";
      }
    }
    _ref2 = readBytes(4, "Incomplete header"), version = _ref2[0], numPills = _ref2[1], numBases = _ref2[2], numStarts = _ref2[3];
    if (version !== 1) {
      throw ("Unsupported map version: " + version);
    }
    map = new this();
    pillsData = (function() {
      _result = [];
      for (i = 0; (0 <= numPills ? i < numPills : i > numPills); (0 <= numPills ? i += 1 : i -= 1)) {
        _result.push(readBytes(5, "Incomplete pillbox data"));
      }
      return _result;
    })();
    basesData = (function() {
      _result = [];
      for (i = 0; (0 <= numBases ? i < numBases : i > numBases); (0 <= numBases ? i += 1 : i -= 1)) {
        _result.push(readBytes(6, "Incomplete base data"));
      }
      return _result;
    })();
    startsData = (function() {
      _result = [];
      for (i = 0; (0 <= numStarts ? i < numStarts : i > numStarts); (0 <= numStarts ? i += 1 : i -= 1)) {
        _result.push(readBytes(3, "Incomplete player start data"));
      }
      return _result;
    })();
    while (true) {
      _ref2 = readBytes(4, "Incomplete map data"), dataLen = _ref2[0], y = _ref2[1], sx = _ref2[2], ex = _ref2[3];
      dataLen -= 4;
      if (dataLen === 0 && y === 0xFF && sx === 0xFF && ex === 0xFF) {
        break;
      }
      run = readBytes(dataLen, "Incomplete map data");
      runPos = 0;
      takeNibble = function() {
        var index, nibble;
        index = floor(runPos);
        nibble = index === runPos ? (run[index] & 0xF0) >> 4 : (run[index] & 0x0F);
        runPos += 0.5;
        return nibble;
      };
      x = sx;
      while (x < ex) {
        seqLen = takeNibble();
        if (seqLen < 8) {
          _ref2 = seqLen + 1;
          for (i = 1; (1 <= _ref2 ? i <= _ref2 : i >= _ref2); (1 <= _ref2 ? i += 1 : i -= 1)) {
            map.cellAtTile(x++, y).setType(takeNibble(), undefined, -1);
          }
        } else {
          type = takeNibble();
          _ref2 = seqLen - 6;
          for (i = 1; (1 <= _ref2 ? i <= _ref2 : i >= _ref2); (1 <= _ref2 ? i += 1 : i -= 1)) {
            map.cellAtTile(x++, y).setType(type, undefined, -1);
          }
        }
      }
    }
    map.pills = (function() {
      _result = [];
      for (_i = 0, _len = pillsData.length; _i < _len; _i++) {
        args = pillsData[_i];
        _result.push((function() {
          var ctor = function() {};
          __extends(ctor, _ctor = map.PillboxClass);
          return typeof (_result2 = _ctor.apply(_ref2 = new ctor, [map].concat(args))) === "object" ? _result2 : _ref2;
        }).call(this));
      }
      return _result;
    })();
    map.bases = (function() {
      _result = [];
      for (_i = 0, _len = basesData.length; _i < _len; _i++) {
        args = basesData[_i];
        _result.push((function() {
          var ctor = function() {};
          __extends(ctor, _ctor = map.BaseClass);
          return typeof (_result2 = _ctor.apply(_ref2 = new ctor, [map].concat(args))) === "object" ? _result2 : _ref2;
        }).call(this));
      }
      return _result;
    })();
    map.starts = (function() {
      _result = [];
      for (_i = 0, _len = startsData.length; _i < _len; _i++) {
        args = startsData[_i];
        _result.push((function() {
          var ctor = function() {};
          __extends(ctor, _ctor = map.StartClass);
          return typeof (_result2 = _ctor.apply(_ref2 = new ctor, [map].concat(args))) === "object" ? _result2 : _ref2;
        }).call(this));
      }
      return _result;
    })();
    return map;
  };
  Map.extended = function(child) {
    return !(child.load) ? (child.load = this.load) : undefined;
  };
  exports.TERRAIN_TYPES = TERRAIN_TYPES;
  exports.MapView = MapView;
  exports.Map = Map;
}).call(this);

});
require.module('bolo/net', function(module, exports, require) {
(function() {
  exports.WELCOME_MESSAGE = 'W'.charCodeAt(0);
  exports.CREATE_MESSAGE = 'C'.charCodeAt(0);
  exports.DESTROY_MESSAGE = 'D'.charCodeAt(0);
  exports.MAPCHANGE_MESSAGE = 'M'.charCodeAt(0);
  exports.UPDATE_MESSAGE = 'U'.charCodeAt(0);
  exports.TINY_UPDATE_MESSAGE = 'u'.charCodeAt(0);
  exports.SOUNDEFFECT_MESSAGE = 'S'.charCodeAt(0);
  exports.START_TURNING_CCW = 'L';
  exports.STOP_TURNING_CCW = 'l';
  exports.START_TURNING_CW = 'R';
  exports.STOP_TURNING_CW = 'r';
  exports.START_ACCELERATING = 'A';
  exports.STOP_ACCELERATING = 'a';
  exports.START_BRAKING = 'B';
  exports.STOP_BRAKING = 'b';
  exports.START_SHOOTING = 'S';
  exports.STOP_SHOOTING = 's';
}).call(this);

});
require.module('bolo/sounds', function(module, exports, require) {
(function() {
  exports.BIG_EXPLOSION = 0;
  exports.BUBBLES = 1;
  exports.FARMING_TREE = 2;
  exports.HIT_TANK = 3;
  exports.MAN_BUILDING = 4;
  exports.MAN_DYING = 5;
  exports.MAN_LAY_MINE = 6;
  exports.MINE_EXPLOSION = 7;
  exports.SHOOTING = 8;
  exports.SHOT_BUILDING = 9;
  exports.SHOT_TREE = 10;
  exports.TANK_SINKING = 11;
}).call(this);

});
require.module('bolo/objects/world_pillbox', function(module, exports, require) {
(function() {
  var BoloObject, PI, Shell, TILE_SIZE_WORLD, WorldPillbox, _ref, atan2, ceil, cos, max, min, round, sin, sounds, sqrt;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  _ref = Math, min = _ref.min, max = _ref.max, sqrt = _ref.sqrt, round = _ref.round, ceil = _ref.ceil, PI = _ref.PI, cos = _ref.cos, sin = _ref.sin, atan2 = _ref.atan2;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  BoloObject = require('../object');
  sounds = require('../sounds');
  Shell = require('./shell');
  WorldPillbox = (function() {
    return function WorldPillbox(world_or_map, x, y, _arg, _arg2, _arg3) {
      this.speed = _arg3;
      this.armour = _arg2;
      this.owner_idx = _arg;
      if (arguments.length === 1) {
        this.world = world_or_map;
      } else {
        this.x = (x + 0.5) * TILE_SIZE_WORLD;
        this.y = (y + 0.5) * TILE_SIZE_WORLD;
      }
      this.on('netUpdate', __bind(function(changes) {
        var _ref2;
        if (changes.hasOwnProperty('inTank') || changes.hasOwnProperty('x') || changes.hasOwnProperty('y')) {
          this.updateCell();
        }
        if (changes.hasOwnProperty('owner')) {
          this.owner_idx = this.owner ? this.owner.$.tank_idx : 255;
          return (((_ref2 = this.cell) != null) ? _ref2.retile() : undefined);
        }
      }, this));
      return this;
    };
  })();
  __extends(WorldPillbox, BoloObject);
  WorldPillbox.prototype.updateCell = function() {
    if (this.cell != null) {
      delete this.cell.pill;
      this.cell.retile();
    }
    if (this.inTank) {
      return (this.cell = null);
    } else {
      this.cell = this.world.map.cellAtWorld(this.x, this.y);
      this.cell.pill = this;
      return this.cell.retile();
    }
  };
  WorldPillbox.prototype.serialization = function(isCreate, p) {
    p('O', 'owner');
    p('f', 'inTank');
    p('f', 'haveTarget');
    if (!(this.inTank)) {
      p('H', 'x');
      p('H', 'y');
    } else {
      this.x = (this.y = null);
    }
    p('B', 'armour');
    p('B', 'speed');
    p('B', 'coolDown');
    return p('B', 'reload');
  };
  WorldPillbox.prototype.placeAt = function(cell) {
    var _ref2;
    this.inTank = false;
    _ref2 = cell.getWorldCoordinates(), this.x = _ref2[0], this.y = _ref2[1];
    this.updateCell();
    return this.reset();
  };
  WorldPillbox.prototype.spawn = function() {
    return this.reset();
  };
  WorldPillbox.prototype.reset = function() {
    this.coolDown = 32;
    return (this.reload = 0);
  };
  WorldPillbox.prototype.anySpawn = function() {
    return this.updateCell();
  };
  WorldPillbox.prototype.update = function() {
    var _i, _len, _ref2, _ref3, d, direction, distance, dx, dy, rad, tank, target;
    if (this.inTank) {
      return null;
    }
    if (this.armour === 0) {
      this.haveTarget = false;
      _ref2 = this.world.tanks;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        tank = _ref2[_i];
        if (tank.armour !== 255) {
          if (tank.cell === this.cell) {
            this.ref('owner', tank);
            this.inTank = true;
            this.x = (this.y = null);
            this.updateCell();
            break;
          }
        }
      }
      return null;
    }
    this.reload = min(this.speed, this.reload + 1);
    if (--this.coolDown === 0) {
      this.coolDown = 32;
      this.speed = min(100, this.speed + 1);
    }
    if (!(this.reload >= this.speed)) {
      return null;
    }
    target = null;
    distance = Infinity;
    _ref2 = this.world.tanks;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      tank = _ref2[_i];
      if (tank.armour !== 255 && !(((_ref3 = this.owner) != null) ? _ref3.$.isAlly(tank) : undefined)) {
        dx = tank.x - this.x;
        dy = tank.y - this.y;
        d = sqrt(dx * dx + dy * dy);
        if ((d <= 2048) && d < distance) {
          target = tank;
          distance = d;
        }
      }
    }
    if (!(target)) {
      return (this.haveTarget = false);
    }
    if (this.haveTarget) {
      rad = (256 - target.getDirection16th() * 16) * 2 * PI / 256;
      dx = target.x + distance / 32 * round(cos(rad) * ceil(target.speed)) - this.x;
      dy = target.y + distance / 32 * round(sin(rad) * ceil(target.speed)) - this.y;
      direction = 256 - atan2(dy, dx) * 256 / (2 * PI);
      this.world.spawn(Shell, this, {
        direction: direction
      });
      this.soundEffect(sounds.SHOOTING);
    }
    this.haveTarget = true;
    return (this.reload = 0);
  };
  WorldPillbox.prototype.takeShellHit = function(shell) {
    this.armour = max(0, this.armour - 1);
    this.coolDown = 32;
    this.speed = max(6, round(this.speed / 2));
    this.cell.retile();
    return sounds.SHOT_BUILDING;
  };
  WorldPillbox.prototype.takeExplosionHit = function() {
    this.armour = max(0, this.armour - 5);
    return this.cell.retile();
  };
  module.exports = WorldPillbox;
}).call(this);

});
require.module('bolo/object', function(module, exports, require) {
(function() {
  var BoloObject, NetWorldObject;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  NetWorldObject = require('villain/world/net/object');
  BoloObject = (function() {
    return function BoloObject() {
      return NetWorldObject.apply(this, arguments);
    };
  })();
  __extends(BoloObject, NetWorldObject);
  BoloObject.prototype.styled = null;
  BoloObject.prototype.x = null;
  BoloObject.prototype.y = null;
  BoloObject.prototype.soundEffect = function(sfx) {
    return this.world.soundEffect(sfx, this.x, this.y, this);
  };
  BoloObject.prototype.getTile = function() {};
  module.exports = BoloObject;
}).call(this);

});
require.module('villain/world/net/object', function(module, exports, require) {
(function() {
  var NetWorldObject, WorldObject;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  WorldObject = require('../object');
  NetWorldObject = (function() {
    return function NetWorldObject() {
      return WorldObject.apply(this, arguments);
    };
  })();
  __extends(NetWorldObject, WorldObject);
  NetWorldObject.prototype.charId = null;
  NetWorldObject.prototype.serialization = function(isCreate, p) {};
  NetWorldObject.prototype.netSpawn = function() {};
  NetWorldObject.prototype.anySpawn = function() {};
  module.exports = NetWorldObject;
}).call(this);

});
require.module('villain/world/object', function(module, exports, require) {
(function() {
  var EventEmitter, WorldObject;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  EventEmitter = require('events').EventEmitter;
  WorldObject = (function() {
    return function WorldObject(_arg) {
      this.world = _arg;
      return this;
    };
  })();
  __extends(WorldObject, EventEmitter);
  WorldObject.prototype.world = null;
  WorldObject.prototype.idx = null;
  WorldObject.prototype.updatePriority = 0;
  WorldObject.prototype.spawn = function() {};
  WorldObject.prototype.update = function() {};
  WorldObject.prototype.destroy = function() {};
  WorldObject.prototype.ref = function(attribute, other) {
    var _ref, r;
    if ((((_ref = this[attribute]) != null) ? _ref.$ === other : undefined)) {
      return this[attribute];
    }
    (((_ref = this[attribute]) != null) ? _ref.clear() : undefined);
    if (!(other)) {
      return null;
    }
    this[attribute] = (r = {
      $: other,
      owner: this,
      attribute: attribute
    });
    r.events = {};
    r.on = function(event, listener) {
      var _base;
      other.on(event, listener);
      ((_base = r.events)[event] || (_base[event] = [])).push(listener);
      return r;
    };
    r.clear = function() {
      var _i, _len, _ref2, event, listener, listeners;
      _ref2 = r.events;
      for (event in _ref2) {
        if (!__hasProp.call(_ref2, event)) continue;
        listeners = _ref2[event];
        for (_i = 0, _len = listeners.length; _i < _len; _i++) {
          listener = listeners[_i];
          other.removeListener(event, listener);
        }
      }
      r.owner.removeListener('finalize', r.clear);
      return (r.owner[r.attribute] = null);
    };
    r.on('finalize', r.clear);
    r.owner.on('finalize', r.clear);
    return r;
  };
  module.exports = WorldObject;
}).call(this);

});
require.module('events', function(module, exports, require) {
// This is an extract from node.js, which is MIT-licensed.
// © 2009, 2010 Ryan Lienhart Dahl.
// Slightly adapted for a browser environment by Stéphan Kochen.

var EventEmitter = exports.EventEmitter = function() {};

var isArray = Array.isArray;

EventEmitter.prototype.emit = function (type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1];
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    if (arguments.length <= 3) {
      // fast case
      handler.call(this, arguments[1], arguments[2]);
    } else {
      // slower
      var args = Array.prototype.slice.call(arguments, 1);
      handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);


    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit("newListener", type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {
    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.removeListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function (type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function (type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});
require.module('bolo/objects/shell', function(module, exports, require) {
(function() {
  var BoloObject, Destructable, Explosion, PI, Shell, TILE_SIZE_WORLD, _ref, cos, floor, round, sin, sqrt;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  _ref = Math, round = _ref.round, floor = _ref.floor, sqrt = _ref.sqrt, cos = _ref.cos, sin = _ref.sin, PI = _ref.PI;
  BoloObject = require('../object');
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  Explosion = require('./explosion');
  Destructable = (function() {
    return function Destructable() {};
  })();
  Destructable.prototype.takeShellHit = function(shell) {};
  Shell = (function() {
    return function Shell(_arg) {
      var _this;
      this.world = _arg;
      _this = this;
      this.spawn = function(){ return Shell.prototype.spawn.apply(_this, arguments); };
      this.on('netSync', __bind(function() {
        return this.updateCell();
      }, this));
      return this;
    };
  })();
  __extends(Shell, BoloObject);
  Shell.prototype.updatePriority = 20;
  Shell.prototype.styled = false;
  Shell.prototype.serialization = function(isCreate, p) {
    if (isCreate) {
      p('B', 'direction');
      p('O', 'owner');
      p('O', 'attribution');
      p('f', 'onWater');
    }
    p('H', 'x');
    p('H', 'y');
    return p('B', 'lifespan');
  };
  Shell.prototype.updateCell = function() {
    return (this.cell = this.world.map.cellAtWorld(this.x, this.y));
  };
  Shell.prototype.getDirection16th = function() {
    return round((this.direction - 1) / 16) % 16;
  };
  Shell.prototype.getTile = function() {
    var tx;
    tx = this.getDirection16th();
    return [tx, 4];
  };
  Shell.prototype.spawn = function(owner, options) {
    options || (options = {});
    this.ref('owner', owner);
    if (this.owner.$.owner != null) {
      this.ref('attribution', this.owner.$.owner);
    } else {
      this.ref('attribution', this.owner.$);
    }
    this.direction = options.direction || this.owner.$.direction;
    this.lifespan = options.lifespan || (7 * TILE_SIZE_WORLD / 32 - 2);
    this.onWater = options.onWater || false;
    this.x = this.owner.$.x;
    this.y = this.owner.$.y;
    return this.move();
  };
  Shell.prototype.update = function() {
    var _ref2, collision, mode, sfx, victim, x, y;
    this.move();
    collision = this.collide();
    if (collision) {
      _ref2 = collision, mode = _ref2[0], victim = _ref2[1];
      sfx = victim.takeShellHit(this);
      if (mode === 'cell') {
        x = (this.cell.x + 0.5) * TILE_SIZE_WORLD;
        y = (this.cell.y + 0.5) * TILE_SIZE_WORLD;
        this.world.soundEffect(sfx, x, y);
      } else {
        _ref2 = this, x = _ref2.x, y = _ref2.y;
        victim.soundEffect(sfx);
      }
      this.world.spawn(Explosion, x, y);
      return this.world.destroy(this);
    }
    if (this.lifespan-- === 0) {
      this.world.destroy(this);
      return this.world.spawn(Explosion, this.x, this.y);
    }
  };
  Shell.prototype.move = function() {
    this.radians || (this.radians = (256 - this.direction) * 2 * PI / 256);
    this.x += round(cos(this.radians) * 32);
    this.y += round(sin(this.radians) * 32);
    return this.updateCell();
  };
  Shell.prototype.collide = function() {
    var _i, _len, _ref2, _ref3, base, distance, dx, dy, pill, tank, terrainCollision;
    if (pill = this.cell.pill) {
      if (pill.armour > 0 && pill !== (((_ref2 = this.owner) != null) ? _ref2.$ : undefined)) {
        return ['cell', pill];
      }
    }
    _ref2 = this.world.tanks;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      tank = _ref2[_i];
      if (tank !== (((_ref3 = this.owner) != null) ? _ref3.$ : undefined) && tank.armour !== 255) {
        dx = tank.x - this.x;
        dy = tank.y - this.y;
        distance = sqrt(dx * dx + dy * dy);
        if (distance <= 127) {
          return ['tank', tank];
        }
      }
    }
    if (base = this.cell.base) {
      if (this.onWater || (base.armour > 4 && (((typeof base !== "undefined" && base !== null) ? base.owner : undefined) != null) && !base.owner.$.isAlly(this.attribution.$))) {
        return ['cell', base];
      }
    }
    terrainCollision = this.onWater ? !this.cell.isType('^', ' ', '%') : this.cell.isType('|', '}', '#', 'b');
    if (terrainCollision) {
      return ['cell', this.cell];
    }
  };
  module.exports = Shell;
}).call(this);

});
require.module('bolo/objects/explosion', function(module, exports, require) {
(function() {
  var BoloObject, Explosion, floor;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  floor = Math.floor;
  BoloObject = require('../object');
  Explosion = (function() {
    return function Explosion() {
      return BoloObject.apply(this, arguments);
    };
  })();
  __extends(Explosion, BoloObject);
  Explosion.prototype.styled = false;
  Explosion.prototype.serialization = function(isCreate, p) {
    if (isCreate) {
      p('H', 'x');
      p('H', 'y');
    }
    return p('B', 'lifespan');
  };
  Explosion.prototype.getTile = function() {
    switch (floor(this.lifespan / 3)) {
      case 7:
        return [20, 3];
      case 6:
        return [21, 3];
      case 5:
        return [20, 4];
      case 4:
        return [21, 4];
      case 3:
        return [20, 5];
      case 2:
        return [21, 5];
      case 1:
        return [18, 4];
      default:
        return [19, 4];
    }
  };
  Explosion.prototype.spawn = function(_arg, _arg2) {
    this.y = _arg2;
    this.x = _arg;
    return (this.lifespan = 23);
  };
  Explosion.prototype.update = function() {
    return this.lifespan-- === 0 ? this.world.destroy(this) : undefined;
  };
  module.exports = Explosion;
}).call(this);

});
require.module('bolo/objects/world_base', function(module, exports, require) {
(function() {
  var BoloObject, TILE_SIZE_WORLD, WorldBase, _ref, max, min;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  _ref = Math, min = _ref.min, max = _ref.max;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  BoloObject = require('../object');
  WorldBase = (function() {
    return function WorldBase(world_or_map, x, y, _arg, _arg2, _arg3, _arg4) {
      this.mines = _arg4;
      this.shells = _arg3;
      this.armour = _arg2;
      this.owner_idx = _arg;
      if (arguments.length === 1) {
        this.world = world_or_map;
      } else {
        this.x = (x + 0.5) * TILE_SIZE_WORLD;
        this.y = (y + 0.5) * TILE_SIZE_WORLD;
        world_or_map.cellAtTile(x, y).setType('=', false, -1);
      }
      this.on('netUpdate', __bind(function(changes) {
        return changes.hasOwnProperty('owner') ? this.updateOwner() : undefined;
      }, this));
      return this;
    };
  })();
  __extends(WorldBase, BoloObject);
  WorldBase.prototype.serialization = function(isCreate, p) {
    if (isCreate) {
      p('H', 'x');
      p('H', 'y');
    }
    p('O', 'owner');
    p('O', 'refueling');
    if (this.refueling) {
      p('B', 'refuelCounter');
    }
    p('B', 'armour');
    p('B', 'shells');
    return p('B', 'mines');
  };
  WorldBase.prototype.updateOwner = function() {
    this.owner_idx = this.owner ? this.owner.$.tank_idx : 255;
    return this.cell.retile();
  };
  WorldBase.prototype.anySpawn = function() {
    this.cell = this.world.map.cellAtWorld(this.x, this.y);
    return (this.cell.base = this);
  };
  WorldBase.prototype.update = function() {
    var amount;
    if (this.refueling && (this.refueling.$.cell !== this.cell || this.refueling.$.armour === 255)) {
      this.ref('refueling', null);
    }
    if (!(this.refueling)) {
      return this.findSubject();
    }
    if (!(--this.refuelCounter === 0)) {
      return null;
    }
    if (this.armour > 0 && this.refueling.$.armour < 40) {
      amount = min(5, this.armour, 40 - this.refueling.$.armour);
      this.refueling.$.armour += amount;
      this.armour -= amount;
      return (this.refuelCounter = 46);
    } else if (this.shells > 0 && this.refueling.$.shells < 40) {
      this.refueling.$.shells += 1;
      this.shells -= 1;
      return (this.refuelCounter = 7);
    } else if (this.mines > 0 && this.refueling.$.mines < 40) {
      this.refueling.$.mines += 1;
      this.mines -= 1;
      return (this.refuelCounter = 7);
    } else {
      return (this.refuelCounter = 1);
    }
  };
  WorldBase.prototype.findSubject = function() {
    var _i, _j, _len, _len2, _ref2, _result, canClaim, other, tank, tanks;
    tanks = (function() {
      _result = []; _ref2 = this.world.tanks;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        tank = _ref2[_i];
        if (tank.armour !== 255 && tank.cell === this.cell) {
          _result.push(tank);
        }
      }
      return _result;
    }).call(this);
    for (_i = 0, _len = tanks.length; _i < _len; _i++) {
      var tank = tanks[_i];
      if ((((_ref2 = this.owner) != null) ? _ref2.$.isAlly(tank) : undefined)) {
        this.ref('refueling', tank);
        this.refuelCounter = 46;
        break;
      } else {
        canClaim = true;
        for (_j = 0, _len2 = tanks.length; _j < _len2; _j++) {
          other = tanks[_j];
          if (other !== tank) {
            if (!(tank.isAlly(other))) {
              canClaim = false;
            }
          }
        }
        if (canClaim) {
          this.ref('owner', tank);
          this.updateOwner();
          this.owner.on('destroy', __bind(function() {
            this.ref('owner', null);
            return this.updateOwner();
          }, this));
          this.ref('refueling', tank);
          this.refuelCounter = 46;
          break;
        }
      }
    }
    return null;
  };
  WorldBase.prototype.takeShellHit = function(shell) {
    this.armour = max(0, this.armour - 5);
    return sounds.SHOT_BUILDING;
  };
  module.exports = WorldBase;
}).call(this);

});
require.module('bolo/client/everard', function(module, exports, require) {
(function() {
  module.exports = 'Qk1BUEJPTE8BEAsQW5H/D2Vjbv8PZV90/w9lVHX/D2VwbP8PZYFr/w9lq27/D2WueP8PZa58/w9l\nmpL/D2Veh/8PZWmJ/w9lcYn/D2Vsf/8PZWx4/w9lrYn/D2WBaP9aWlqvaf9aWlpWbv9aWlquev9a\nWlp5e/9aWlpsfP9aWlqLff9aWlpti/9aWlpVjf9aWlqlkv9aWlp+mP9aWlpMjABMfABcZA1sZAx8\nZAyMZAycZAysZAu4fAi4jAisnAWcnASMnAR8nARsnARcnAMQZk608fHx8fHx8fHx8fGRGGdNtaH0\ntNUB8PCQkgGSAeIB4vHh8pKRHWhNtZGU9YUE1QHnlOcAxIIB4gHiAfKygdKQkoEfaU21gZT1lQTV\nAde05wSSgYIB4pHCAfKC8ZEAhJKBIGpNtYGEhfSFBNUBx9TXBIeC8bKBooHiofICgQSBgoEja021\ngQSFhNUEhQTVAbf0xwSXEhwrGSAaIBwqGCAfKSFCsSBsTbWBBIUE5QSFBNWRl/TUl/KSsaIBkqGy\ngfKCBKKBIG1NtYEEhQSFpIUEhQT1AZf0xwT3t7LxAfIB8oIEooEjbk21gQSFBIWEFUhQSFBKUHpQ\nGn1NcE9/fCAfKioeIEooECBvTbWBBIUEtQSFBIUE9QG3tOcE9/eygZL3p5HCBKKBIXBNtYEEhQS1\nBIUEhQT1gbeU9wT394eSAaL3x5GiBKKBIHFNtYEEhdSFBIUE9RUffXIED355CHAff3lwGiBKKBAe\nck21gQT1hQSFBPUVH31wD09JQQeB9/eXsQSBgoEdc021gQT1hQSFBPUVH31yBA9+dAQHH399eAFA\nsRl0TbWB9KSFFH9QH35wT39wD09PS0AJKBAddU21gbUH9QTl8QGH4QTx8RFJH394eFlxBICSgSJ2\nTbWB9cUE1fGx0ATw8EBAEIcFlwCHhYcQeFl4WnFHooEgd021gfWFtLXx0QD0pAD0pDAQeVx4WXhR\ncKcAhwS3gSJ4TbXhtQTl8QLREE8IAkBNAEkDQBCHBYcldZeF96cEt4EleU21gbcBtQTl8eEgQPRA\nQEC0AJRAQBCHBYclBaeFl5XHBLWBJnpNtYG3AaUQSQtfHhkATwJASQBLBUBAELeVhwCHhceVhwSH\nlYEje021gbcBpQD09PSUAJQgQJQgQNRwQEAQX3p4W3JXWXtYECd8TbWBtwGlkBQLXxAtEQSwRAQE\nkASwdAQEBAEQhYeF9wW3JXXngSd9TbWBtwHVBMXx4SBAtCBAtAC0cEBAQBAJUHhZeVt5VHV1e1h4\nECp+TbWBtwHVBIXx8ZEwQEsATQBNB0BAEFcVeFlwWnBYcFl3V1dXVwWHgSd/TbWBtwGFsQSRp+EC\n0UBAQPSEAPRAQBCHpZeVB5UXWXNXV7WHgSeATbWBt6GgBKeV8dFwQEBATQBPBUBAEPcFpwWHBZd1\ndXV1cFh4ECSBTbWB96AEp5UH8aFAEECUANQgQNRAQECh15W3lUdXV7WHgSOCTbWB94CHBNUH8ZFC\nAQTwBJAkBLB0BAQBAHsffHJXXngQI4NNtYHwgIcElcfxAYIgEPSEAJQAtACUQEAQt+HnFXxZeBAf\nhE21gfCAhwTVhwGSsZIQHQBLAE0ATQEQ95fB97eBHIVNtYEAxwC3BKeVhwHyggCRAPQA9PSE98fx\n4R6GTbWBEHoAewF01YcB8oKQAfDw8AGHBPe3gPe3gR6HTbWBIHCnALc0V1t4HyogDx8fGBhwT3x4\nD3p4EByITbWBMHB6C3BNUHgfKyAfeg9+cE98eA95eRAeiU21gZD3IECXlRcfLCAYcAt8D3xxBPCA\nl7D3B5Efik21gQeAB4DHAPT09LSHAKcAhwD09MQwcHsPcHkQK4tNtYEHgAeAxyBAh4CXAaKQFAwk\nFwcKcApwCHAPeHBKCRBIEwQH0PcHkSaMTbWBB4AHgOQAh4CXAaKwwgGXEHwAew94eUEQkQSBAPQA\n94eBKo1NtYEHgAeAFH0IeAh4GSkPJhcHBw9/engCQQkQSBgBQMcQegh4WHgQK45NtYEHgAeAh/CA\nB4GSoPKBpwCHhccA15AHgCQQkQShFAxwCnAIeFh4ECmPTbWBhyBwh4CngIcAhwGioPISGnANegh6\nUXCXgCQQ4QSwB9CHhYeBKZBNtYGHMHB5AHgAeAhwCHAZKw8hIafwtwWHhZCHEE0aSAhwDHANeBAo\nkU21gYeQRwcHgASAhxB4GSsPISGnsPeFhwWAlwCk0QSAB/AXC3gQKpJNtYGnUHBweAB4CHIHGnsP\ncH8YH3hYcVCXAIShAqEUCXEEhwCnALeBKJNNtYEHoEcHB4AHgAeAFxp7D3hwHnwbeFhwCXgJShxJ\nCXkAeAt4ECaUTbWBB6BHBweAB4AnB4GnsJehpwH3p7G3gAeQBPGAFAp8C3kQIpVNtYGXAIcwcHgK\ncgcbewh8GXAffnoceAlNEgdKD3l5ECCWTbWRhwCnEHgAegFxt7CHwZcB9/cH8fGBEH9ATHoQHZdN\ntZGH8Aeggbewl6GnAfeHkfengPERDygrexAbmE21sfCXgAHHsKeBtwH34feHAPERDygpfRAQmU60\n8fHx8fHx8fHx8fGRBP///w=='.split('\n').join('');
}).call(this);

});
require.module('bolo/objects/all', function(module, exports, require) {
(function() {
  exports.registerWithWorld = function(w) {
    w.registerType(require('./world_pillbox'));
    w.registerType(require('./world_base'));
    w.registerType(require('./tank'));
    w.registerType(require('./explosion'));
    w.registerType(require('./shell'));
    return w.registerType(require('./fireball'));
  };
}).call(this);

});
require.module('bolo/objects/tank', function(module, exports, require) {
(function() {
  var BoloObject, Explosion, Fireball, PI, Shell, TILE_SIZE_WORLD, Tank, _ref, ceil, cos, floor, max, min, round, sin, sounds, sqrt;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  _ref = Math, round = _ref.round, floor = _ref.floor, ceil = _ref.ceil, min = _ref.min, sqrt = _ref.sqrt, max = _ref.max, sin = _ref.sin, cos = _ref.cos, PI = _ref.PI;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  BoloObject = require('../object');
  sounds = require('../sounds');
  Explosion = require('./explosion');
  Shell = require('./shell');
  Fireball = require('./fireball');
  Tank = (function() {
    return function Tank(_arg) {
      this.world = _arg;
      this.on('netUpdate', __bind(function(changes) {
        return changes.hasOwnProperty('x') || changes.hasOwnProperty('y') || changes.armour === 255 ? this.updateCell() : undefined;
      }, this));
      return this;
    };
  })();
  __extends(Tank, BoloObject);
  Tank.prototype.styled = true;
  Tank.prototype.anySpawn = function() {
    this.updateCell();
    this.world.addTank(this);
    return this.on('finalize', __bind(function() {
      return this.world.removeTank(this);
    }, this));
  };
  Tank.prototype.updateCell = function() {
    return (this.cell = (this.x != null) && (this.y != null) ? this.world.map.cellAtWorld(this.x, this.y) : null);
  };
  Tank.prototype.reset = function() {
    var startingPos;
    startingPos = this.world.map.getRandomStart();
    this.x = (startingPos.x + 0.5) * TILE_SIZE_WORLD;
    this.y = (startingPos.y + 0.5) * TILE_SIZE_WORLD;
    this.direction = startingPos.direction * 16;
    this.updateCell();
    this.speed = 0.00;
    this.slideTicks = 0;
    this.slideDirection = 0;
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
    return (this.onBoat = true);
  };
  Tank.prototype.serialization = function(isCreate, p) {
    var _ref2;
    if (isCreate) {
      p('B', 'team');
    }
    p('B', 'armour');
    if (this.armour === 255) {
      p('O', 'fireball');
      this.x = (this.y = null);
      return null;
    } else {
      (((_ref2 = this.fireball) != null) ? _ref2.clear() : undefined);
    }
    p('H', 'x');
    p('H', 'y');
    p('B', 'direction');
    p('B', 'speed', {
      tx: function(v) {
        return v * 4;
      },
      rx: function(v) {
        return v / 4;
      }
    });
    p('B', 'slideTicks');
    p('B', 'slideDirection');
    p('B', 'turnSpeedup', {
      tx: function(v) {
        return v + 50;
      },
      rx: function(v) {
        return v - 50;
      }
    });
    p('B', 'shells');
    p('B', 'mines');
    p('B', 'trees');
    p('B', 'reload');
    p('f', 'accelerating');
    p('f', 'braking');
    p('f', 'turningClockwise');
    p('f', 'turningCounterClockwise');
    p('f', 'shooting');
    return p('f', 'onBoat');
  };
  Tank.prototype.getDirection16th = function() {
    return round((this.direction - 1) / 16) % 16;
  };
  Tank.prototype.getSlideDirection16th = function() {
    return round((this.slideDirection - 1) / 16) % 16;
  };
  Tank.prototype.getTile = function() {
    var tx, ty;
    tx = this.getDirection16th();
    ty = this.onBoat ? 1 : 0;
    return [tx, ty];
  };
  Tank.prototype.isAlly = function(other) {
    return other === this || (this.team !== 255 && other.team === this.team);
  };
  Tank.prototype.takeShellHit = function(shell) {
    var largeExplosion;
    this.armour -= 5;
    if (this.armour < 0) {
      largeExplosion = this.shells + this.mines > 20;
      this.ref('fireball', this.world.spawn(Fireball, this.x, this.y, shell.direction, largeExplosion));
      this.kill();
    } else {
      this.slideTicks = 8;
      this.slideDirection = shell.direction;
      if (this.onBoat) {
        this.onBoat = false;
        this.speed = 0;
        if (this.cell.isType('^')) {
          this.sink();
        }
      }
    }
    return sounds.HIT_TANK;
  };
  Tank.prototype.spawn = function() {
    this.team = this.world.tanks.length % 2;
    return this.reset();
  };
  Tank.prototype.update = function() {
    if (this.death()) {
      return null;
    }
    this.shootOrReload();
    this.turn();
    this.accelerate();
    this.fixPosition();
    return this.move();
  };
  Tank.prototype.destroy = function() {
    return this.dropPillboxes();
  };
  Tank.prototype.death = function() {
    if (this.armour !== 255) {
      return false;
    }
    if (this.world.authority && --this.respawnTimer === 0) {
      delete this.respawnTimer;
      this.reset();
      return false;
    }
    return true;
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
    this.world.spawn(Shell, this, {
      onWater: this.onBoat
    });
    return this.soundEffect(sounds.SHOOTING);
  };
  Tank.prototype.turn = function() {
    var acceleration, maxTurn;
    maxTurn = this.cell.getTankTurn(this);
    if (this.turningClockwise === this.turningCounterClockwise) {
      this.turnSpeedup = 0;
      return null;
    }
    if (this.turningCounterClockwise) {
      acceleration = maxTurn;
      if (this.turnSpeedup < 10) {
        acceleration /= 2;
      }
      if (this.turnSpeedup < 0) {
        this.turnSpeedup = 0;
      }
      this.turnSpeedup++;
    } else {
      acceleration = -maxTurn;
      if (this.turnSpeedup > -10) {
        acceleration /= 2;
      }
      if (this.turnSpeedup > 0) {
        this.turnSpeedup = 0;
      }
      this.turnSpeedup--;
    }
    this.direction += acceleration;
    while (this.direction < 0) {
      this.direction += 256;
    }
    return this.direction >= 256 ? this.direction %= 256 : undefined;
  };
  Tank.prototype.accelerate = function() {
    var acceleration, maxSpeed;
    maxSpeed = this.cell.getTankSpeed(this);
    if (this.speed > maxSpeed) {
      acceleration = -0.25;
    } else if (this.accelerating === this.braking) {
      acceleration = 0.00;
    } else if (this.accelerating) {
      acceleration = 0.25;
    } else {
      acceleration = -0.25;
    }
    return acceleration > 0.00 && this.speed < maxSpeed ? (this.speed = min(maxSpeed, this.speed + acceleration)) : (acceleration < 0.00 && this.speed > 0.00 ? (this.speed = max(0.00, this.speed + acceleration)) : undefined);
  };
  Tank.prototype.fixPosition = function() {
    var _i, _len, _ref2, _result, distance, dx, dy, halftile, other;
    if (this.cell.getTankSpeed(this) === 0) {
      halftile = TILE_SIZE_WORLD / 2;
      if (this.x % TILE_SIZE_WORLD >= halftile) {
        this.x++;
      } else {
        this.x--;
      }
      if (this.y % TILE_SIZE_WORLD >= halftile) {
        this.y++;
      } else {
        this.y--;
      }
      this.speed = max(0.00, this.speed - 1);
    }
    _result = []; _ref2 = this.world.tanks;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      other = _ref2[_i];
      if (other !== this && other.armour !== 255) {
        dx = other.x - this.x;
        dy = other.y - this.y;
        distance = sqrt(dx * dx + dy * dy);
        if (distance > 255) {
          continue;
        }
        if (dx < 0) {
          this.x++;
        } else {
          this.x--;
        }
        if (dy < 0) {
          this.y++;
        } else {
          this.y--;
        }
      }
    }
    return _result;
  };
  Tank.prototype.move = function() {
    var ahead, dx, dy, newx, newy, oldcell, rad, slowDown;
    dx = (dy = 0);
    if (this.speed > 0) {
      rad = (256 - this.getDirection16th() * 16) * 2 * PI / 256;
      dx += round(cos(rad) * ceil(this.speed));
      dy += round(sin(rad) * ceil(this.speed));
    }
    if (this.slideTicks > 0) {
      rad = (256 - this.getSlideDirection16th() * 16) * 2 * PI / 256;
      dx += round(cos(rad) * 16);
      dy += round(sin(rad) * 16);
      this.slideTicks--;
    }
    newx = this.x + dx;
    newy = this.y + dy;
    slowDown = true;
    if (dx !== 0) {
      ahead = dx > 0 ? newx + 64 : newx - 64;
      ahead = this.world.map.cellAtWorld(ahead, newy);
      if (ahead.getTankSpeed(this) !== 0) {
        slowDown = false;
        if (!(this.onBoat && !ahead.isType(' ', '^') && this.speed < 16)) {
          this.x = newx;
        }
      }
    }
    if (dy !== 0) {
      ahead = dy > 0 ? newy + 64 : newy - 64;
      ahead = this.world.map.cellAtWorld(newx, ahead);
      if (ahead.getTankSpeed(this) !== 0) {
        slowDown = false;
        if (!(this.onBoat && !ahead.isType(' ', '^') && this.speed < 16)) {
          this.y = newy;
        }
      }
    }
    if (!(dx === 0 && dy === 0)) {
      if (slowDown) {
        this.speed = max(0.00, this.speed - 1);
      }
      oldcell = this.cell;
      this.updateCell();
      return oldcell !== this.cell ? this.checkNewCell(oldcell) : undefined;
    }
  };
  Tank.prototype.checkNewCell = function(oldcell) {
    if (this.onBoat) {
      return !(this.cell.isType(' ', '^')) ? this.leaveBoat(oldcell) : undefined;
    } else {
      if (this.cell.isType('^')) {
        return this.sink();
      }
      if (this.cell.isType('b')) {
        return this.enterBoat();
      }
    }
  };
  Tank.prototype.leaveBoat = function(oldcell) {
    var x, y;
    if (this.cell.isType('b')) {
      this.cell.setType(' ', false, 0);
      x = (this.cell.x + 0.5) * TILE_SIZE_WORLD;
      y = (this.cell.y + 0.5) * TILE_SIZE_WORLD;
      this.world.spawn(Explosion, x, y);
      return this.world.soundEffect(sounds.SHOT_BUILDING, x, y);
    } else {
      if (oldcell.isType(' ')) {
        oldcell.setType('b', false, 0);
      }
      return (this.onBoat = false);
    }
  };
  Tank.prototype.enterBoat = function() {
    this.cell.setType(' ', false, 0);
    return (this.onBoat = true);
  };
  Tank.prototype.sink = function() {
    this.world.soundEffect(sounds.TANK_SINKING, this.x, this.y);
    return this.kill();
  };
  Tank.prototype.kill = function() {
    this.dropPillboxes();
    this.x = (this.y = null);
    this.armour = 255;
    return (this.respawnTimer = 255);
  };
  Tank.prototype.dropPillboxes = function() {
    var _i, _len, _ref2, _ref3, _result, cell, delta, ey, pill, pills, sy, width, x, y;
    pills = (function() {
      _result = []; _ref2 = this.world.map.pills;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        pill = _ref2[_i];
        if (pill.inTank && (((_ref3 = pill.owner) != null) ? _ref3.$ === this : undefined)) {
          _result.push(pill);
        }
      }
      return _result;
    }).call(this);
    if (pills.length === 0) {
      return null;
    }
    x = this.cell.x;
    sy = this.cell.y;
    width = sqrt(pills.length);
    delta = floor(width / 2);
    width = round(width);
    x -= delta;
    sy -= delta;
    ey = sy + width;
    while (pills.length !== 0) {
      for (y = sy; (sy <= ey ? y < ey : y > ey); (sy <= ey ? y += 1 : y -= 1)) {
        cell = this.world.map.cellAtTile(x, y);
        if ((cell.base != null) || (cell.pill != null) || cell.isType('|', '}', 'b')) {
          continue;
        }
        if (!(pill = pills.pop())) {
          return null;
        }
        pill.placeAt(cell);
      }
      x += 1;
    }
    return null;
  };
  module.exports = Tank;
}).call(this);

});
require.module('bolo/objects/fireball', function(module, exports, require) {
(function() {
  var BoloObject, Explosion, Fireball, PI, TILE_SIZE_WORLD, _ref, cos, round, sin, sounds;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  _ref = Math, round = _ref.round, cos = _ref.cos, sin = _ref.sin, PI = _ref.PI;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  sounds = require('../sounds');
  BoloObject = require('../object');
  Explosion = require('./explosion');
  Fireball = (function() {
    return function Fireball() {
      return BoloObject.apply(this, arguments);
    };
  })();
  __extends(Fireball, BoloObject);
  Fireball.prototype.styled = null;
  Fireball.prototype.serialization = function(isCreate, p) {
    if (isCreate) {
      p('B', 'direction');
      p('f', 'largeExplosion');
    }
    p('H', 'x');
    p('H', 'y');
    return p('B', 'lifespan');
  };
  Fireball.prototype.getDirection16th = function() {
    return round((this.direction - 1) / 16) % 16;
  };
  Fireball.prototype.spawn = function(_arg, _arg2, _arg3, _arg4) {
    this.largeExplosion = _arg4;
    this.direction = _arg3;
    this.y = _arg2;
    this.x = _arg;
    return (this.lifespan = 80);
  };
  Fireball.prototype.update = function() {
    if (this.lifespan-- % 2 === 0) {
      if (this.wreck()) {
        return null;
      }
      this.move();
    }
    if (this.lifespan === 0) {
      this.explode();
      return this.world.destroy(this);
    }
  };
  Fireball.prototype.wreck = function() {
    var cell;
    this.world.spawn(Explosion, this.x, this.y);
    cell = this.world.map.cellAtWorld(this.x, this.y);
    if (cell.isType('^')) {
      this.world.destroy(this);
      this.soundEffect(sounds.TANK_SINKING);
      return true;
    } else if (cell.isType('b')) {
      cell.setType(' ');
      this.soundEffect(sounds.SHOT_BUILDING);
    } else if (cell.isType('#')) {
      cell.setType('.');
      this.soundEffect(sounds.SHOT_TREE);
    }
    return false;
  };
  Fireball.prototype.move = function() {
    var _ref2, ahead, dx, dy, newx, newy, radians;
    if (!(this.dx != null)) {
      radians = (256 - this.direction) * 2 * PI / 256;
      this.dx = round(cos(radians) * 48);
      this.dy = round(sin(radians) * 48);
    }
    _ref2 = this, dx = _ref2.dx, dy = _ref2.dy;
    newx = this.x + dx;
    newy = this.y + dy;
    if (dx !== 0) {
      ahead = dx > 0 ? newx + 24 : newx - 24;
      ahead = this.world.map.cellAtWorld(ahead, newy);
      if (!(ahead.isObstacle())) {
        this.x = newx;
      }
    }
    if (dy !== 0) {
      ahead = dy > 0 ? newy + 24 : newy - 24;
      ahead = this.world.map.cellAtWorld(newx, ahead);
      return !(ahead.isObstacle()) ? (this.y = newy) : undefined;
    }
  };
  Fireball.prototype.explode = function() {
    var _i, _len, _ref2, _ref3, c, cell, dx, dy, x, y;
    cell = this.world.map.cellAtWorld(this.x, this.y);
    if (this.largeExplosion) {
      dx = this.dx > 0 ? 1 : -1;
      dy = this.dy > 0 ? 1 : -1;
      _ref2 = [cell.neigh(dx, 0), cell.neigh(0, dy), cell.neigh(dx, dy)];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        c = _ref2[_i];
        _ref3 = c.getWorldCoordinates(), x = _ref3[0], y = _ref3[1];
        this.world.spawn(Explosion, x, y);
        c.takeExplosionHit();
      }
      this.soundEffect(sounds.BIG_EXPLOSION);
    } else {
      this.soundEffect(sounds.MINE_EXPLOSION);
    }
    _ref2 = cell.getWorldCoordinates(), x = _ref2[0], y = _ref2[1];
    this.world.spawn(Explosion, x, y);
    return cell.takeExplosionHit();
  };
  module.exports = Fireball;
}).call(this);

});
require.module('bolo/client/base64', function(module, exports, require) {
(function() {
  var decodeBase64;
  decodeBase64 = function(input) {
    var _len, c, cc, i, output, outputIndex, outputLength, quad, quadIndex, tail;
    if (!(input.length % 4 === 0)) {
      throw new Error("Invalid base64 input length, not properly padded?");
    }
    outputLength = input.length / 4 * 3;
    tail = input.substr(-2);
    if (tail[0] === '=') {
      outputLength--;
    }
    if (tail[1] === '=') {
      outputLength--;
    }
    output = new Array(outputLength);
    quad = new Array(4);
    outputIndex = 0;
    for (i = 0, _len = input.length; i < _len; i++) {
      c = input[i];
      cc = c.charCodeAt(0);
      quadIndex = i % 4;
      quad[quadIndex] = (function() {
        if ((65 <= cc) && (cc <= 90)) {
          return cc - 65;
        } else if ((97 <= cc) && (cc <= 122)) {
          return cc - 71;
        } else if ((48 <= cc) && (cc <= 57)) {
          return cc + 4;
        } else if (cc === 43) {
          return 62;
        } else if (cc === 47) {
          return 63;
        } else if (cc === 61) {
          return -1;
        } else {
          throw new Error("Invalid base64 input character: " + c);
        }
      })();
      if (quadIndex !== 3) {
        continue;
      }
      output[outputIndex++] = ((quad[0] & 0x3F) << 2) + ((quad[1] & 0x30) >> 4);
      if (!(quad[2] === -1)) {
        output[outputIndex++] = ((quad[1] & 0x0F) << 4) + ((quad[2] & 0x3C) >> 2);
      }
      if (!(quad[3] === -1)) {
        output[outputIndex++] = ((quad[2] & 0x03) << 6) + (quad[3] & 0x3F);
      }
    }
    return output;
  };
  exports.decodeBase64 = decodeBase64;
}).call(this);

});
require.module('bolo/helpers', function(module, exports, require) {
(function() {
  var extend;
  extend = (exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  });
}).call(this);

});
require.module('bolo/client/world/mixin', function(module, exports, require) {
(function() {
  var BoloClientWorldMixin, BoloWorldMixin, DefaultRenderer, Loop, SoundKit, TICK_LENGTH_MS, helpers;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  Loop = require('villain/loop');
  SoundKit = require('../soundkit');
  DefaultRenderer = require('../renderer/offscreen_2d');
  TICK_LENGTH_MS = require('../../constants').TICK_LENGTH_MS;
  helpers = require('../../helpers');
  BoloWorldMixin = require('../../world_mixin');
  BoloClientWorldMixin = {
    start: function() {
      return this.loadResources(__bind(function() {
        return this.loaded();
      }, this));
    },
    loadResources: function(callback) {
      var checkComplete, finish, finished, images, loadImage, loadSound, numCompleted, numResources, soundkit;
      numResources = 0;
      numCompleted = 0;
      finished = false;
      checkComplete = function() {
        return finished && numCompleted === numResources ? callback() : undefined;
      };
      finish = function() {
        finished = true;
        return checkComplete();
      };
      this.images = (images = {});
      loadImage = function(name) {
        var img;
        numResources++;
        images[name] = (img = new Image());
        $(img).load(function() {
          numCompleted++;
          return checkComplete();
        });
        return (img.src = ("img/" + name + ".png"));
      };
      this.soundkit = (soundkit = new SoundKit());
      loadSound = function(name) {
        var _ref, i, parts, snd;
        parts = name.split('_');
        _ref = parts.length;
        for (i = 1; (1 <= _ref ? i < _ref : i > _ref); (1 <= _ref ? i += 1 : i -= 1)) {
          parts[i] = parts[i].substr(0, 1).toUpperCase() + parts[i].substr(1);
        }
        numResources++;
        snd = new Audio();
        $(snd).bind('canplaythrough', function() {
          soundkit.register(parts.join(''), snd.currentSrc);
          numCompleted++;
          return checkComplete();
        });
        snd.src = ("snd/" + name + ".ogg");
        return snd.load();
      };
      loadImage('base');
      loadImage('styled');
      loadImage('overlay');
      loadSound('big_explosion_far');
      loadSound('big_explosion_near');
      loadSound('bubbles');
      loadSound('farming_tree_far');
      loadSound('farming_tree_near');
      loadSound('hit_tank_far');
      loadSound('hit_tank_near');
      loadSound('hit_tank_self');
      loadSound('man_building_far');
      loadSound('man_building_near');
      loadSound('man_dying_far');
      loadSound('man_dying_near');
      loadSound('man_lay_mine_near');
      loadSound('mine_explosion_far');
      loadSound('mine_explosion_near');
      loadSound('shooting_far');
      loadSound('shooting_near');
      loadSound('shooting_self');
      loadSound('shot_building_far');
      loadSound('shot_building_near');
      loadSound('shot_tree_far');
      loadSound('shot_tree_near');
      loadSound('tank_sinking_far');
      loadSound('tank_sinking_near');
      return finish();
    },
    commonInitialization: function() {
      this.renderer = new DefaultRenderer(this);
      this.map.world = this;
      this.map.setView(this.renderer);
      this.boloInit();
      this.loop = new Loop(this);
      this.loop.tickRate = TICK_LENGTH_MS;
      $(document).keydown(__bind(function(e) {
        return this.handleKeydown(e);
      }, this));
      return $(document).keyup(__bind(function(e) {
        return this.handleKeyup(e);
      }, this));
    },
    idle: function() {
      return this.renderer.draw();
    }
  };
  helpers.extend(BoloClientWorldMixin, BoloWorldMixin);
  module.exports = BoloClientWorldMixin;
}).call(this);

});
require.module('villain/loop', function(module, exports, require) {
(function() {
  var Loop;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  Loop = (function() {
    return function Loop(_arg) {
      this.handler = _arg;
      this.timer = null;
      return this;
    };
  })();
  Loop.prototype.tickRate = 50;
  Loop.prototype.start = function() {
    var last;
    if (this.timer) {
      return null;
    }
    last = Date.now();
    this.timer = setInterval(__bind(function() {
      var now;
      now = Date.now();
      while (now - last >= this.tickRate) {
        this.handler.tick();
        last += this.tickRate;
      }
      return this.handler.idle();
    }, this), this.tickRate);
    return null;
  };
  Loop.prototype.stop = function() {
    if (!(this.timer)) {
      return null;
    }
    clearInterval(this.timer);
    return (this.timer = null);
  };
  module.exports = Loop;
}).call(this);

});
require.module('bolo/client/soundkit', function(module, exports, require) {
(function() {
  var SoundKit;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  SoundKit = (function() {
    return function SoundKit() {
      this.sounds = {};
      return this;
    };
  })();
  SoundKit.prototype.register = function(name, url) {
    this.sounds[name] = url;
    return (this[name] = __bind(function() {
      return this.play(name);
    }, this));
  };
  SoundKit.prototype.play = function(name) {
    var effect;
    effect = new Audio();
    effect.src = this.sounds[name];
    effect.play();
    return effect;
  };
  module.exports = SoundKit;
}).call(this);

});
require.module('bolo/client/renderer/offscreen_2d', function(module, exports, require) {
(function() {
  var CachedSegment, Common2dRenderer, MAP_SIZE_SEGMENTS, MAP_SIZE_TILES, Offscreen2dRenderer, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_TILES, TILE_SIZE_PIXELS, _ref, floor;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  floor = Math.floor;
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, MAP_SIZE_TILES = _ref.MAP_SIZE_TILES;
  Common2dRenderer = require('./common_2d');
  SEGMENT_SIZE_TILES = 16;
  MAP_SIZE_SEGMENTS = MAP_SIZE_TILES / SEGMENT_SIZE_TILES;
  SEGMENT_SIZE_PIXEL = SEGMENT_SIZE_TILES * TILE_SIZE_PIXELS;
  CachedSegment = (function() {
    return function CachedSegment(_arg, x, y) {
      this.renderer = _arg;
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
  })();
  CachedSegment.prototype.isInView = function(sx, sy, ex, ey) {
    return ex < this.psx || ey < this.psy ? false : (sx > this.pex || sy > this.pey ? false : true);
  };
  CachedSegment.prototype.build = function() {
    this.canvas = $('<canvas/>')[0];
    this.canvas.width = (this.canvas.height = SEGMENT_SIZE_PIXEL);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.translate(-this.psx, -this.psy);
    return this.renderer.world.map.each(__bind(function(cell) {
      return this.onRetile(cell, cell.tile[0], cell.tile[1]);
    }, this), this.sx, this.sy, this.ex, this.ey);
  };
  CachedSegment.prototype.clear = function() {
    return (this.canvas = (this.ctx = null));
  };
  CachedSegment.prototype.onRetile = function(cell, tx, ty) {
    var _ref2, obj;
    if (!(this.canvas)) {
      return null;
    }
    return (obj = cell.pill || cell.base) ? this.renderer.drawStyledTile(cell.tile[0], cell.tile[1], (((_ref2 = obj.owner) != null) ? _ref2.$.team : undefined), cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, this.ctx) : this.renderer.drawTile(cell.tile[0], cell.tile[1], cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, this.ctx);
  };
  Offscreen2dRenderer = (function() {
    return function Offscreen2dRenderer(world) {
      var row, x, y;
      Offscreen2dRenderer.__super__.constructor.apply(this, arguments);
      this.cache = new Array(MAP_SIZE_SEGMENTS);
      for (y = 0; (0 <= MAP_SIZE_SEGMENTS ? y < MAP_SIZE_SEGMENTS : y > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? y += 1 : y -= 1)) {
        row = (this.cache[y] = new Array(MAP_SIZE_SEGMENTS));
        for (x = 0; (0 <= MAP_SIZE_SEGMENTS ? x < MAP_SIZE_SEGMENTS : x > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? x += 1 : x -= 1)) {
          row[x] = new CachedSegment(this, x, y);
        }
      }
      return this;
    };
  })();
  __extends(Offscreen2dRenderer, Common2dRenderer);
  Offscreen2dRenderer.prototype.onRetile = function(cell, tx, ty) {
    var segx, segy;
    cell.tile = [tx, ty];
    segx = floor(cell.x / SEGMENT_SIZE_TILES);
    segy = floor(cell.y / SEGMENT_SIZE_TILES);
    return this.cache[segy][segx].onRetile(cell, tx, ty);
  };
  Offscreen2dRenderer.prototype.drawMap = function(sx, sy, w, h) {
    var _i, _j, _len, _len2, _ref2, alreadyBuiltOne, ex, ey, row, segment;
    ex = sx + w - 1;
    ey = sy + h - 1;
    alreadyBuiltOne = false;
    _ref2 = this.cache;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      row = _ref2[_i];
      for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
        segment = row[_j];
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
        this.ctx.drawImage(segment.canvas, 0, 0, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL, segment.psx, segment.psy, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL);
      }
    }
    return null;
  };
  module.exports = Offscreen2dRenderer;
}).call(this);

});
require.module('bolo/client/renderer/common_2d', function(module, exports, require) {
(function() {
  var BaseRenderer, Common2dRenderer, PIXEL_SIZE_WORLD, TEAM_COLORS, TILE_SIZE_PIXELS, _ref, min, round;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  _ref = Math, min = _ref.min, round = _ref.round;
  BaseRenderer = require('./base');
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD;
  TEAM_COLORS = require('../../team_colors');
  Common2dRenderer = (function() {
    return function Common2dRenderer(world) {
      var ctx, imageData, img, temp;
      Common2dRenderer.__super__.constructor.apply(this, arguments);
      this.canvas = $('<canvas/>');
      try {
        this.ctx = this.canvas[0].getContext('2d');
        this.ctx.drawImage;
      } catch (e) {
        throw ("Could not initialize 2D canvas: " + (e.message));
      }
      this.canvas.appendTo('body');
      img = this.images.overlay;
      temp = $('<canvas/>')[0];
      temp.width = img.width;
      temp.height = img.height;
      ctx = temp.getContext('2d');
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(img, 0, 0);
      imageData = ctx.getImageData(0, 0, img.width, img.height);
      this.overlay = imageData.data;
      this.prestyled = {};
      this.handleResize();
      $(window).resize(__bind(function() {
        return this.handleResize();
      }, this));
      return this;
    };
  })();
  __extends(Common2dRenderer, BaseRenderer);
  Common2dRenderer.prototype.handleResize = function() {
    this.canvas[0].width = window.innerWidth;
    this.canvas[0].height = window.innerHeight;
    this.canvas.css({
      width: window.innerWidth + 'px',
      height: window.innerHeight + 'px'
    });
    return $('body').css({
      width: window.innerWidth + 'px',
      height: window.innerHeight + 'px'
    });
  };
  Common2dRenderer.prototype.drawTile = function(tx, ty, dx, dy, ctx) {
    return (ctx || this.ctx).drawImage(this.images.base, tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, dx, dy, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS);
  };
  Common2dRenderer.prototype.createPrestyled = function(color) {
    var _ref2, base, ctx, data, factor, height, i, imageData, source, width, x, y;
    base = this.images.styled;
    _ref2 = base, width = _ref2.width, height = _ref2.height;
    source = $('<canvas/>')[0];
    source.width = width;
    source.height = height;
    ctx = source.getContext('2d');
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(base, 0, 0);
    imageData = ctx.getImageData(0, 0, width, height);
    data = imageData.data;
    for (x = 0; (0 <= width ? x < width : x > width); (0 <= width ? x += 1 : x -= 1)) {
      for (y = 0; (0 <= height ? y < height : y > height); (0 <= height ? y += 1 : y -= 1)) {
        i = 4 * (y * width + x);
        factor = this.overlay[i] / 255;
        data[i + 0] = round(factor * color.r + (1 - factor) * data[i + 0]);
        data[i + 1] = round(factor * color.g + (1 - factor) * data[i + 1]);
        data[i + 2] = round(factor * color.b + (1 - factor) * data[i + 2]);
        data[i + 3] = min(255, data[i + 3] + this.overlay[i]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return source;
  };
  Common2dRenderer.prototype.drawStyledTile = function(tx, ty, style, dx, dy, ctx) {
    var color, source;
    if (!(source = this.prestyled[style])) {
      source = (color = TEAM_COLORS[style]) ? (this.prestyled[style] = this.createPrestyled(color)) : this.images.styled;
    }
    return (ctx || this.ctx).drawImage(source, tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, dx, dy, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS);
  };
  Common2dRenderer.prototype.centerOn = function(x, y, cb) {
    var _ref2, height, left, top, width;
    this.ctx.save();
    _ref2 = this.canvas[0], width = _ref2.width, height = _ref2.height;
    left = round(x / PIXEL_SIZE_WORLD - width / 2);
    top = round(y / PIXEL_SIZE_WORLD - height / 2);
    this.ctx.translate(-left, -top);
    cb(left, top, width, height);
    return this.ctx.restore();
  };
  module.exports = Common2dRenderer;
}).call(this);

});
require.module('bolo/client/renderer/base', function(module, exports, require) {
(function() {
  var BaseRenderer, PI, PIXEL_SIZE_WORLD, TILE_SIZE_PIXELS, TILE_SIZE_WORLD, _ref, cos, round, sin, sounds, sqrt;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  _ref = Math, round = _ref.round, cos = _ref.cos, sin = _ref.sin, PI = _ref.PI, sqrt = _ref.sqrt;
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, TILE_SIZE_WORLD = _ref.TILE_SIZE_WORLD, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD;
  sounds = require('../../sounds');
  BaseRenderer = (function() {
    return function BaseRenderer(_arg) {
      this.world = _arg;
      this.images = this.world.images;
      this.soundkit = this.world.soundkit;
      this.lastCenter = [0, 0];
      return this;
    };
  })();
  BaseRenderer.prototype.centerOn = function(x, y, cb) {};
  BaseRenderer.prototype.drawTile = function(tx, ty, sdx, sdy) {};
  BaseRenderer.prototype.drawStyledTile = function(tx, ty, style, sdx, sdy) {};
  BaseRenderer.prototype.drawMap = function(sx, sy, w, h) {};
  BaseRenderer.prototype.onRetile = function(cell, tx, ty) {};
  BaseRenderer.prototype.draw = function() {
    var _ref2, x, y;
    _ref2 = this.world.player, x = _ref2.x, y = _ref2.y;
    if (this.world.player.fireball != null) {
      _ref2 = this.world.player.fireball.$, x = _ref2.x, y = _ref2.y;
    }
    if (!((x != null) && (y != null))) {
      _ref2 = this.lastCenter, x = _ref2[0], y = _ref2[1];
    } else {
      this.lastCenter = [x, y];
    }
    this.centerOn(x, y, __bind(function(left, top, width, height) {
      var _i, _len, _ref3, _ref4, obj, ox, oy, tx, ty;
      this.drawMap(left, top, width, height);
      _ref3 = this.world.objects;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        obj = _ref3[_i];
        if ((obj.styled != null) && (obj.x != null) && (obj.y != null)) {
          _ref4 = obj.getTile(), tx = _ref4[0], ty = _ref4[1];
          ox = round(obj.x / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2;
          oy = round(obj.y / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2;
          switch (obj.styled) {
            case true:
              this.drawStyledTile(tx, ty, obj.team, ox, oy);
              break;
            case false:
              this.drawTile(tx, ty, ox, oy);
              break;
          }
        }
      }
      return this.drawOverlay();
    }, this));
    return this.updateHud();
  };
  BaseRenderer.prototype.playSound = function(sfx, x, y, owner) {
    var dist, dx, dy, mode, name;
    mode = (function() {
      if (owner === this.world.player) {
        return 'Self';
      } else {
        dx = x - this.lastCenter[0];
        dy = y - this.lastCenter[1];
        dist = sqrt(dx * dx + dy * dy);
        return dist > 40 * TILE_SIZE_WORLD ? 'None' : (dist > 15 * TILE_SIZE_WORLD ? 'Far' : 'Near');
      }
    }).call(this);
    if (mode === 'None') {
      return null;
    }
    name = (function() {
      switch (sfx) {
        case sounds.BIG_EXPLOSION:
          return "bigExplosion" + mode;
        case sounds.BUBBLES:
          return mode === 'Self' ? "bubbles" : undefined;
        case sounds.FARMING_TREE:
          return "farmingTree" + mode;
        case sounds.HIT_TANK:
          return "hitTank" + mode;
        case sounds.MAN_BUILDING:
          return "manBuilding" + mode;
        case sounds.MAN_DYING:
          return "manDying" + mode;
        case sounds.MAN_LAY_MINE:
          return mode === 'Near' ? "manLayMineNear" : undefined;
        case sounds.MINE_EXPLOSION:
          return "mineExplosion" + mode;
        case sounds.SHOOTING:
          return "shooting" + mode;
        case sounds.SHOT_BUILDING:
          return "shotBuilding" + mode;
        case sounds.SHOT_TREE:
          return "shotTree" + mode;
        case sounds.TANK_SINKING:
          return "tankSinking" + mode;
      }
    })();
    return name ? this.soundkit[name]() : undefined;
  };
  BaseRenderer.prototype.drawOverlay = function() {
    var distance, rad, x, y;
    distance = 7 * TILE_SIZE_PIXELS;
    rad = (256 - this.world.player.direction) * 2 * PI / 256;
    x = round(this.world.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance) - TILE_SIZE_PIXELS / 2;
    y = round(this.world.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance) - TILE_SIZE_PIXELS / 2;
    return this.drawTile(17, 4, x, y);
  };
  BaseRenderer.prototype.initHud = function() {
    var _i, _len, _ref2, base, container, pill;
    this.hud = $('<div/>').appendTo('body');
    container = $('<div/>', {
      id: 'pillStatus'
    }).appendTo(this.hud);
    $('<div/>', {
      "class": 'deco'
    }).appendTo(container);
    _ref2 = this.world.map.pills;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      pill = _ref2[_i];
      $('<div/>', {
        "class": 'pill'
      }).appendTo(container).data('pill', pill);
    }
    container = $('<div/>', {
      id: 'baseStatus'
    }).appendTo(this.hud);
    $('<div/>', {
      "class": 'deco'
    }).appendTo(container);
    _ref2 = this.world.map.bases;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      base = _ref2[_i];
      $('<div/>', {
        "class": 'base'
      }).appendTo(container).data('base', base);
    }
    if (location.hostname.split('.')[1] === 'github') {
      $('<div/>').html('This is a work-in-progress; less than alpha quality!<br>\nTo see multiplayer in action, follow instructions on Github.').css({
        'position': 'absolute',
        'top': '8px',
        'left': '0px',
        'width': '100%',
        'text-align': 'center',
        'font-family': 'monospace',
        'font-size': '16px',
        'font-weight': 'bold',
        'color': 'white'
      }).appendTo(this.hud);
    }
    if (location.hostname.split('.')[1] === 'github' || location.hostname.substr(-6) === '.no.de') {
      $('<a href="http://github.com/stephank/orona"></a>').css({
        'position': 'absolute',
        'top': '0px',
        'right': '0px'
      }).html('<img src="http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub">').appendTo(this.hud);
    }
    return this.updateHud();
  };
  BaseRenderer.prototype.updateHud = function() {
    this.hud.find('#pillStatus .pill').each(__bind(function(i, node) {
      return $(node).attr('status', 'neutral');
    }, this));
    return this.hud.find('#baseStatus .base').each(__bind(function(i, node) {
      return $(node).attr('status', 'neutral');
    }, this));
  };
  module.exports = BaseRenderer;
}).call(this);

});
require.module('bolo/team_colors', function(module, exports, require) {
(function() {
  var TEAM_COLORS;
  TEAM_COLORS = [
    {
      r: 255,
      g: 0,
      b: 0,
      name: 'red'
    }, {
      r: 0,
      g: 0,
      b: 255,
      name: 'blue'
    }, {
      r: 0,
      g: 255,
      b: 0,
      name: 'green'
    }, {
      r: 0,
      g: 255,
      b: 255,
      name: 'cyan'
    }, {
      r: 255,
      g: 255,
      b: 0,
      name: 'yellow'
    }, {
      r: 255,
      g: 0,
      b: 255,
      name: 'magenta'
    }
  ];
  module.exports = TEAM_COLORS;
}).call(this);

});
require.module('bolo/world_mixin', function(module, exports, require) {
(function() {
  var BoloWorldMixin;
  BoloWorldMixin = {
    boloInit: function() {
      return (this.tanks = []);
    },
    addTank: function(tank) {
      tank.tank_idx = this.tanks.length;
      this.tanks.push(tank);
      return this.authority ? this.resolveMapObjectOwners() : undefined;
    },
    removeTank: function(tank) {
      var _ref, _ref2, i;
      this.tanks.splice(tank.tank_idx, 1);
      _ref = tank.tank_idx; _ref2 = this.tanks.length;
      for (i = _ref; (_ref <= _ref2 ? i < _ref2 : i > _ref2); (_ref <= _ref2 ? i += 1 : i -= 1)) {
        this.tanks[i].tank_idx = i;
      }
      return this.authority ? this.resolveMapObjectOwners() : undefined;
    },
    getAllMapObjects: function() {
      return this.map.pills.concat(this.map.bases);
    },
    spawnMapObjects: function() {
      var _i, _len, _ref, obj;
      _ref = this.getAllMapObjects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        obj.world = this;
        this.insert(obj);
        obj.spawn();
        obj.anySpawn();
      }
      return null;
    },
    resolveMapObjectOwners: function() {
      var _i, _len, _ref, _ref2, obj;
      _ref = this.getAllMapObjects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        obj.ref('owner', this.tanks[obj.owner_idx]);
        (((_ref2 = obj.cell) != null) ? _ref2.retile() : undefined);
      }
      return null;
    }
  };
  module.exports = BoloWorldMixin;
}).call(this);

});
require.module('bolo/client/world/client', function(module, exports, require) {
(function() {
  var BoloClientWorld, ClientWorld, WorldBase, WorldMap, WorldPillbox, allObjects, decodeBase64, helpers, net, unpack;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  ClientWorld = require('villain/world/net/client');
  WorldMap = require('../../world_map');
  allObjects = require('../../objects/all');
  WorldPillbox = require('../../objects/world_pillbox');
  WorldBase = require('../../objects/world_base');
  unpack = require('../../struct').unpack;
  decodeBase64 = require('../base64').decodeBase64;
  net = require('../../net');
  helpers = require('../../helpers');
  BoloClientWorld = (function() {
    return function BoloClientWorld() {
      BoloClientWorld.__super__.constructor.apply(this, arguments);
      this.mapChanges = {};
      this.processingServerMessages = false;
      return this;
    };
  })();
  __extends(BoloClientWorld, ClientWorld);
  BoloClientWorld.prototype.authority = false;
  BoloClientWorld.prototype.loaded = function() {
    this.heartbeatTimer = 0;
    this.ws = new WebSocket("ws://" + (location.host) + "/demo");
    return $(this.ws).one('message', __bind(function(e) {
      return this.receiveMap(e.originalEvent);
    }, this));
  };
  BoloClientWorld.prototype.receiveMap = function(e) {
    this.map = WorldMap.load(decodeBase64(e.data));
    this.commonInitialization();
    return $(this.ws).bind('message', __bind(function(e) {
      return (this.ws != null) ? this.handleMessage(e.originalEvent) : undefined;
    }, this));
  };
  BoloClientWorld.prototype.receiveWelcome = function(tank) {
    this.player = tank;
    this.rebuildMapObjects();
    this.renderer.initHud();
    return this.loop.start();
  };
  BoloClientWorld.prototype.tick = function() {
    BoloClientWorld.__super__.tick.apply(this, arguments);
    if (++this.heartbeatTimer === 10) {
      this.heartbeatTimer = 0;
      return this.ws.send('');
    }
  };
  BoloClientWorld.prototype.soundEffect = function(sfx, x, y, owner) {};
  BoloClientWorld.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {
    if (this.processingServerMessages) {
      return null;
    }
    if (!(this.mapChanges[cell.idx] != null)) {
      cell._net_oldType = oldType;
      cell._net_hadMine = hadMine;
      cell._net_oldLife = oldLife;
      this.mapChanges[cell.idx] = cell;
    }
    return null;
  };
  BoloClientWorld.prototype.handleKeydown = function(e) {
    if (!(this.ws != null)) {
      return null;
    }
    switch (e.which) {
      case 32:
        this.ws.send(net.START_SHOOTING);
        break;
      case 37:
        this.ws.send(net.START_TURNING_CCW);
        break;
      case 38:
        this.ws.send(net.START_ACCELERATING);
        break;
      case 39:
        this.ws.send(net.START_TURNING_CW);
        break;
      case 40:
        this.ws.send(net.START_BRAKING);
        break;
      default:
        return null;
    }
    return e.preventDefault();
  };
  BoloClientWorld.prototype.handleKeyup = function(e) {
    if (!(this.ws != null)) {
      return null;
    }
    switch (e.which) {
      case 32:
        this.ws.send(net.STOP_SHOOTING);
        break;
      case 37:
        this.ws.send(net.STOP_TURNING_CCW);
        break;
      case 38:
        this.ws.send(net.STOP_ACCELERATING);
        break;
      case 39:
        this.ws.send(net.STOP_TURNING_CW);
        break;
      case 40:
        this.ws.send(net.STOP_BRAKING);
        break;
      default:
        return null;
    }
    return e.preventDefault();
  };
  BoloClientWorld.prototype.handleMessage = function(e) {
    var ate, command, data, error, length, pos;
    this.netRestore();
    this.processingServerMessages = true;
    data = decodeBase64(e.data);
    pos = 0;
    length = data.length;
    while (pos < length) {
      command = data[pos++];
      ate = this.handleServerCommand(command, data, pos);
      if (ate === -1) {
        error = true;
        break;
      }
      pos += ate;
    }
    if (pos !== length) {
      console.log("Message length mismatch, processed " + pos + " / " + length + " bytes");
      error = true;
    }
    if (error) {
      console.log("Message was:", data);
      this.loop.stop();
      this.ws.close();
      this.ws = null;
    }
    return (this.processingServerMessages = false);
  };
  BoloClientWorld.prototype.handleServerCommand = function(command, data, offset) {
    var _ref, _ref2, ascii, bytes, cell, code, idx, life, mine, owner, sfx, tank_idx, x, y;
    switch (command) {
      case net.WELCOME_MESSAGE:
        _ref = unpack('H', data, offset), tank_idx = _ref[0][0], bytes = _ref[1];
        this.receiveWelcome(this.objects[tank_idx]);
        return bytes;
      case net.CREATE_MESSAGE:
        return this.netSpawn(data, offset);
      case net.DESTROY_MESSAGE:
        return this.netDestroy(data, offset);
      case net.MAPCHANGE_MESSAGE:
        _ref = unpack('BBBBf', data, offset), _ref2 = _ref[0], x = _ref2[0], y = _ref2[1], code = _ref2[2], life = _ref2[3], mine = _ref2[4], bytes = _ref[1];
        ascii = String.fromCharCode(code);
        cell = this.map.cells[y][x];
        cell.setType(ascii, mine);
        cell.life = life;
        return bytes;
      case net.SOUNDEFFECT_MESSAGE:
        _ref = unpack('BHHH', data, offset), _ref2 = _ref[0], sfx = _ref2[0], x = _ref2[1], y = _ref2[2], owner = _ref2[3], bytes = _ref[1];
        this.renderer.playSound(sfx, x, y, this.objects[owner]);
        return bytes;
      case net.TINY_UPDATE_MESSAGE:
        _ref = unpack('H', data, offset), idx = _ref[0][0], bytes = _ref[1];
        bytes += this.netUpdate(this.objects[idx], data, offset + bytes);
        return bytes;
      case net.UPDATE_MESSAGE:
        return this.netTick(data, offset);
      default:
        console.log("Bad command '" + command + "' from server, and offset " + (offset - 1));
        return -1;
    }
  };
  BoloClientWorld.prototype.rebuildMapObjects = function() {
    var _i, _len, _ref, _ref2, obj;
    this.map.pills = [];
    this.map.bases = [];
    _ref = this.objects;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      obj = _ref[_i];
      if (obj instanceof WorldPillbox) {
        this.map.pills.push(obj);
      } else if (obj instanceof WorldBase) {
        this.map.bases.push(obj);
      } else {
        continue;
      }
      (((_ref2 = obj.cell) != null) ? _ref2.retile() : undefined);
    }
    return null;
  };
  BoloClientWorld.prototype.netRestore = function() {
    var _ref, cell, idx;
    BoloClientWorld.__super__.netRestore.apply(this, arguments);
    _ref = this.mapChanges;
    for (idx in _ref) {
      if (!__hasProp.call(_ref, idx)) continue;
      cell = _ref[idx];
      cell.setType(cell._net_oldType, cell._net_hadMine);
      cell.life = cell._net_oldLife;
    }
    return (this.mapChanges = {});
  };
  helpers.extend(BoloClientWorld.prototype, require('./mixin'));
  allObjects.registerWithWorld(BoloClientWorld.prototype);
  module.exports = BoloClientWorld;
}).call(this);

});
require.module('villain/world/net/client', function(module, exports, require) {
(function() {
  var BaseWorld, ClientWorld, _ref, buildUnpacker, unpack;
  var __slice = Array.prototype.slice, __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  BaseWorld = require('../base');
  _ref = require('../../struct'), unpack = _ref.unpack, buildUnpacker = _ref.buildUnpacker;
  ClientWorld = (function() {
    return function ClientWorld() {
      ClientWorld.__super__.constructor.apply(this, arguments);
      this.changes = [];
      return this;
    };
  })();
  __extends(ClientWorld, BaseWorld);
  ClientWorld.prototype.registerType = function(type) {
    if (!(this.hasOwnProperty('types'))) {
      this.types = [];
    }
    return this.types.push(type);
  };
  ClientWorld.prototype.spawn = function(type) {
    var args, obj;
    args = __slice.call(arguments, 1);
    obj = this.insert(new type(this));
    this.changes.unshift(['create', obj.idx, obj]);
    obj._net_transient = true;
    obj.spawn.apply(obj, args);
    obj.anySpawn();
    return obj;
  };
  ClientWorld.prototype.update = function(obj) {
    obj.update();
    obj.emit('update');
    obj.emit('anyUpdate');
    return obj;
  };
  ClientWorld.prototype.destroy = function(obj) {
    this.changes.unshift(['destroy', obj.idx, obj]);
    this.remove(obj);
    obj.emit('destroy');
    if (obj._net_transient) {
      obj.emit('finalize');
    }
    return obj;
  };
  ClientWorld.prototype.netRestore = function() {
    var _i, _len, _ref2, _ref3, i, idx, obj, type;
    if (!(this.changes.length > 0)) {
      return null;
    }
    _ref2 = this.changes;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      _ref3 = _ref2[_i], type = _ref3[0], idx = _ref3[1], obj = _ref3[2];
      switch (type) {
        case 'create':
          if (obj.transient && !obj._net_revived) {
            obj.emit('finalize');
          }
          this.objects.splice(idx, 1);
          break;
        case 'destroy':
          obj._net_revived = true;
          this.objects.splice(idx, 0, obj);
          break;
      }
    }
    this.changes = [];
    _ref2 = this.objects;
    for (i = 0, _len = _ref2.length; i < _len; i++) {
      obj = _ref2[i];
      obj.idx = i;
    }
    return null;
  };
  ClientWorld.prototype.netSpawn = function(data, offset) {
    var obj, type;
    type = this.types[data[offset]];
    obj = this.insert(new type(this));
    obj._net_transient = false;
    obj._net_new = true;
    return 1;
  };
  ClientWorld.prototype.netUpdate = function(obj, data, offset) {
    var _ref2, bytes, changes;
    _ref2 = this.deserialize(obj, data, offset, obj._net_new), bytes = _ref2[0], changes = _ref2[1];
    if (obj._net_new) {
      obj.netSpawn();
      obj.anySpawn();
      obj._net_new = false;
    } else {
      obj.emit('netUpdate', changes);
      obj.emit('anyUpdate');
    }
    obj.emit('netSync');
    return bytes;
  };
  ClientWorld.prototype.netDestroy = function(data, offset) {
    var _ref2, bytes, obj, obj_idx;
    _ref2 = unpack('H', data, offset), obj_idx = _ref2[0][0], bytes = _ref2[1];
    obj = this.objects[obj_idx];
    if (!(obj._net_new)) {
      obj.emit('netDestroy');
      obj.emit('anyDestroy');
      obj.emit('finalize');
    }
    this.remove(obj);
    return bytes;
  };
  ClientWorld.prototype.netTick = function(data, offset) {
    var _i, _len, _ref2, bytes, obj;
    bytes = 0;
    _ref2 = this.objects;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      obj = _ref2[_i];
      bytes += this.netUpdate(obj, data, offset + bytes);
    }
    return bytes;
  };
  ClientWorld.prototype.deserialize = function(obj, data, offset, isCreate) {
    var changes, unpacker;
    unpacker = buildUnpacker(data, offset);
    changes = {};
    obj.serialization(isCreate, __bind(function(specifier, attribute, options) {
      var _ref2, oldValue, other, value;
      options || (options = {});
      if (specifier === 'O') {
        other = this.objects[unpacker('H')];
        if ((oldValue = (((_ref2 = obj[attribute]) != null) ? _ref2.$ : undefined)) !== other) {
          changes[attribute] = oldValue;
          obj.ref(attribute, other);
        }
      } else {
        value = unpacker(specifier);
        if (options.rx != null) {
          value = options.rx(value);
        }
        if ((oldValue = obj[attribute]) !== value) {
          changes[attribute] = oldValue;
          obj[attribute] = value;
        }
      }
      return null;
    }, this));
    return [unpacker.finish(), changes];
  };
  module.exports = ClientWorld;
}).call(this);

});
require.module('villain/struct', function(module, exports, require) {
(function() {
  var buildPacker, buildUnpacker, fromUint16, fromUint32, fromUint8, pack, toUint16, toUint32, toUint8, unpack;
  toUint8 = function(n) {
    return [n & 0xFF];
  };
  toUint16 = function(n) {
    return [(n & 0xFF00) >> 8, n & 0x00FF];
  };
  toUint32 = function(n) {
    return [(n & 0xFF000000) >> 24, (n & 0x00FF0000) >> 16, (n & 0x0000FF00) >> 8, n & 0x000000FF];
  };
  fromUint8 = function(d, o) {
    return d[o];
  };
  fromUint16 = function(d, o) {
    return (d[o] << 8) + d[o + 1];
  };
  fromUint32 = function(d, o) {
    return (d[o] << 24) + (d[o + 1] << 16) + (d[o + 2] << 8) + d[o + 3];
  };
  buildPacker = function() {
    var bitIndex, bits, data, flushBitFields, retval;
    data = [];
    bits = null;
    bitIndex = 0;
    flushBitFields = function() {
      if (bits === null) {
        return null;
      }
      data.push(bits);
      return (bits = null);
    };
    retval = function(type, value) {
      if (type === 'f') {
        if (bits === null) {
          bits = !!value ? 1 : 0;
          return (bitIndex = 1);
        } else {
          if (!!value) {
            bits |= 1 << bitIndex;
          }
          bitIndex++;
          return bitIndex === 8 ? flushBitFields() : undefined;
        }
      } else {
        flushBitFields();
        return (data = data.concat((function() {
          switch (type) {
            case 'B':
              return toUint8(value);
            case 'H':
              return toUint16(value);
            case 'I':
              return toUint32(value);
            default:
              throw new Error("Unknown format character " + type);
          }
        })()));
      }
    };
    retval.finish = function() {
      flushBitFields();
      return data;
    };
    return retval;
  };
  buildUnpacker = function(data, offset) {
    var bitIndex, idx, retval;
    offset || (offset = 0);
    idx = offset;
    bitIndex = 0;
    retval = function(type) {
      var _ref, bit, bytes, value;
      if (type === 'f') {
        bit = (1 << bitIndex) & data[idx];
        value = bit > 0;
        bitIndex++;
        if (bitIndex === 8) {
          idx++;
          bitIndex = 0;
        }
      } else {
        if (bitIndex !== 0) {
          idx++;
          bitIndex = 0;
        }
        _ref = (function() {
          switch (type) {
            case 'B':
              return [fromUint8(data, idx), 1];
            case 'H':
              return [fromUint16(data, idx), 2];
            case 'I':
              return [fromUint32(data, idx), 4];
            default:
              throw new Error("Unknown format character " + type);
          }
        })(), value = _ref[0], bytes = _ref[1];
        idx += bytes;
      }
      return value;
    };
    retval.finish = function() {
      if (bitIndex !== 0) {
        idx++;
      }
      return idx - offset;
    };
    return retval;
  };
  pack = function(fmt) {
    var _len, i, packer, type, value;
    packer = buildPacker();
    for (i = 0, _len = fmt.length; i < _len; i++) {
      type = fmt[i];
      value = arguments[i + 1];
      packer(type, value);
    }
    return packer.finish();
  };
  unpack = function(fmt, data, offset) {
    var _i, _len, _result, type, unpacker, values;
    unpacker = buildUnpacker(data, offset);
    values = (function() {
      _result = [];
      for (_i = 0, _len = fmt.length; _i < _len; _i++) {
        type = fmt[_i];
        _result.push(unpacker(type));
      }
      return _result;
    })();
    return [values, unpacker.finish()];
  };
  exports.buildPacker = buildPacker;
  exports.buildUnpacker = buildUnpacker;
  exports.pack = pack;
  exports.unpack = unpack;
}).call(this);

});
require.module('bolo/struct', function(module, exports, require) {
(function() {
  var buildPacker, buildUnpacker, fromUint16, fromUint32, fromUint8, pack, toUint16, toUint32, toUint8, unpack;
  toUint8 = function(n) {
    return [n & 0xFF];
  };
  toUint16 = function(n) {
    return [(n & 0xFF00) >> 8, n & 0x00FF];
  };
  toUint32 = function(n) {
    return [(n & 0xFF000000) >> 24, (n & 0x00FF0000) >> 16, (n & 0x0000FF00) >> 8, n & 0x000000FF];
  };
  fromUint8 = function(d, o) {
    return d[o];
  };
  fromUint16 = function(d, o) {
    return (d[o] << 8) + d[o + 1];
  };
  fromUint32 = function(d, o) {
    return (d[o] << 24) + (d[o + 1] << 16) + (d[o + 2] << 8) + d[o + 3];
  };
  buildPacker = function() {
    var bitIndex, bits, data, flushBitFields, retval;
    data = [];
    bits = null;
    bitIndex = 0;
    flushBitFields = function() {
      if (bits === null) {
        return null;
      }
      data.push(bits);
      return (bits = null);
    };
    retval = function(type, value) {
      if (type === 'f') {
        if (bits === null) {
          bits = !!value ? 1 : 0;
          return (bitIndex = 1);
        } else {
          if (!!value) {
            bits |= 1 << bitIndex;
          }
          bitIndex++;
          return bitIndex === 8 ? flushBitFields() : undefined;
        }
      } else {
        flushBitFields();
        return (data = data.concat((function() {
          switch (type) {
            case 'B':
              return toUint8(value);
            case 'H':
              return toUint16(value);
            case 'I':
              return toUint32(value);
            default:
              throw new Error("Unknown format character " + type);
          }
        })()));
      }
    };
    retval.finish = function() {
      flushBitFields();
      return data;
    };
    return retval;
  };
  buildUnpacker = function(data, offset) {
    var bitIndex, idx, retval;
    offset || (offset = 0);
    idx = offset;
    bitIndex = 0;
    retval = function(type) {
      var _ref, bit, bytes, value;
      if (type === 'f') {
        bit = (1 << bitIndex) & data[idx];
        value = bit > 0;
        bitIndex++;
        if (bitIndex === 8) {
          idx++;
          bitIndex = 0;
        }
      } else {
        if (bitIndex !== 0) {
          idx++;
          bitIndex = 0;
        }
        _ref = (function() {
          switch (type) {
            case 'B':
              return [fromUint8(data, idx), 1];
            case 'H':
              return [fromUint16(data, idx), 2];
            case 'I':
              return [fromUint32(data, idx), 4];
            default:
              throw new Error("Unknown format character " + type);
          }
        })(), value = _ref[0], bytes = _ref[1];
        idx += bytes;
      }
      return value;
    };
    retval.finish = function() {
      if (bitIndex !== 0) {
        idx++;
      }
      return idx - offset;
    };
    return retval;
  };
  pack = function(fmt) {
    var _len, i, packer, type, value;
    packer = buildPacker();
    for (i = 0, _len = fmt.length; i < _len; i++) {
      type = fmt[i];
      value = arguments[i + 1];
      packer(type, value);
    }
    return packer.finish();
  };
  unpack = function(fmt, data, offset) {
    var _i, _len, _result, type, unpacker, values;
    unpacker = buildUnpacker(data, offset);
    values = (function() {
      _result = [];
      for (_i = 0, _len = fmt.length; _i < _len; _i++) {
        type = fmt[_i];
        _result.push(unpacker(type));
      }
      return _result;
    })();
    return [values, unpacker.finish()];
  };
  exports.buildPacker = buildPacker;
  exports.buildUnpacker = buildUnpacker;
  exports.pack = pack;
  exports.unpack = unpack;
}).call(this);

});
