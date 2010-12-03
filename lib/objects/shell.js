(function() {
  var BoloObject, Destructable, Explosion, MineExplosion, PI, Shell, TILE_SIZE_WORLD, cos, distance, floor, round, sin;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, floor = Math.floor, cos = Math.cos, sin = Math.sin, PI = Math.PI;
  distance = require('../helpers').distance;
  BoloObject = require('../object');
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  Explosion = require('./explosion');
  MineExplosion = require('./mine_explosion');
  Destructable = function() {
    function Destructable() {}
    Destructable.prototype.takeShellHit = function(shell) {};
    return Destructable;
  }();
  Shell = function() {
    function Shell(world) {
      this.world = world;
      this.spawn = __bind(this.spawn, this);;
      this.on('netSync', __bind(function() {
        return this.updateCell();
      }, this));
    }
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
      return this.cell = this.world.map.cellAtWorld(this.x, this.y);
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
      var _ref;
      options || (options = {});
      this.ref('owner', owner);
      if (this.owner.$.hasOwnProperty('owner_idx')) {
        this.ref('attribution', (_ref = this.owner.$.owner) != null ? _ref.$ : void 0);
      } else {
        this.ref('attribution', this.owner.$);
      }
      this.direction = options.direction || this.owner.$.direction;
      this.lifespan = (options.range || 7) * TILE_SIZE_WORLD / 32 - 2;
      this.onWater = options.onWater || false;
      this.x = this.owner.$.x;
      this.y = this.owner.$.y;
      return this.move();
    };
    Shell.prototype.update = function() {
      var collision, mode, sfx, victim, x, y, _ref;
      this.move();
      collision = this.collide();
      if (collision) {
        mode = collision[0], victim = collision[1];
        sfx = victim.takeShellHit(this);
        if (mode === 'cell') {
          _ref = this.cell.getWorldCoordinates(), x = _ref[0], y = _ref[1];
          this.world.soundEffect(sfx, x, y);
        } else {
          x = this.x, y = this.y;
          victim.soundEffect(sfx);
        }
        return this.asplode(x, y, mode);
      } else if (this.lifespan-- === 0) {
        return this.asplode(this.x, this.y, 'eol');
      }
    };
    Shell.prototype.move = function() {
      this.radians || (this.radians = (256 - this.direction) * 2 * PI / 256);
      this.x += round(cos(this.radians) * 32);
      this.y += round(sin(this.radians) * 32);
      return this.updateCell();
    };
    Shell.prototype.collide = function() {
      var base, pill, tank, terrainCollision, x, y, _i, _len, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if ((pill = this.cell.pill) && pill.armour > 0 && pill !== ((_ref = this.owner) != null ? _ref.$ : void 0)) {
        _ref2 = this.cell.getWorldCoordinates(), x = _ref2[0], y = _ref2[1];
        if (distance(this, {
          x: x,
          y: y
        }) <= 127) {
          return ['cell', pill];
        }
      }
      _ref3 = this.world.tanks;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        tank = _ref3[_i];
        if (tank !== ((_ref4 = this.owner) != null ? _ref4.$ : void 0) && tank.armour !== 255) {
          if (distance(this, tank) <= 127) {
            return ['tank', tank];
          }
        }
      }
      if (((_ref5 = this.attribution) != null ? _ref5.$ : void 0) === ((_ref6 = this.owner) != null ? _ref6.$ : void 0) && (base = this.cell.base) && base.armour > 4) {
        if (this.onWater || (((base != null ? base.owner : void 0) != null) && !base.owner.$.isAlly((_ref7 = this.attribution) != null ? _ref7.$ : void 0))) {
          return ['cell', base];
        }
      }
      terrainCollision = this.onWater ? !this.cell.isType('^', ' ', '%') : this.cell.isType('|', '}', '#', 'b');
      if (terrainCollision) {
        return ['cell', this.cell];
      }
    };
    Shell.prototype.asplode = function(x, y, mode) {
      var builder, tank, _i, _len, _ref, _ref2;
      _ref = this.world.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (builder = tank.builder.$) {
          if ((_ref2 = builder.order) !== builder.states.inTank && _ref2 !== builder.states.parachuting) {
            if (mode === 'cell') {
              if (builder.cell === this.cell) {
                builder.kill();
              }
            } else {
              if (distance(this, builder) < (TILE_SIZE_WORLD / 2)) {
                builder.kill();
              }
            }
          }
        }
      }
      this.world.spawn(Explosion, x, y);
      this.world.spawn(MineExplosion, this.cell);
      return this.world.destroy(this);
    };
    return Shell;
  }();
  module.exports = Shell;
}).call(this);
