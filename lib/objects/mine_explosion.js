(function() {
  var BoloObject, Explosion, MineExplosion, TILE_SIZE_WORLD, distance, sounds;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  distance = require('../helpers').distance;
  BoloObject = require('../object');
  sounds = require('../sounds');
  Explosion = require('./explosion');
  MineExplosion = function() {
    function MineExplosion() {
      MineExplosion.__super__.constructor.apply(this, arguments);
    }
    __extends(MineExplosion, BoloObject);
    MineExplosion.prototype.styled = null;
    MineExplosion.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('H', 'x');
        p('H', 'y');
      }
      return p('B', 'lifespan');
    };
    MineExplosion.prototype.spawn = function(cell) {
      var _ref;
      _ref = cell.getWorldCoordinates(), this.x = _ref[0], this.y = _ref[1];
      return this.lifespan = 10;
    };
    MineExplosion.prototype.anySpawn = function() {
      return this.cell = this.world.map.cellAtWorld(this.x, this.y);
    };
    MineExplosion.prototype.update = function() {
      if (this.lifespan-- === 0) {
        if (this.cell.mine) {
          this.asplode();
        }
        return this.world.destroy(this);
      }
    };
    MineExplosion.prototype.asplode = function() {
      var builder, tank, _i, _len, _ref, _ref2;
      this.cell.setType(null, false, 0);
      this.cell.takeExplosionHit();
      _ref = this.world.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (tank.armour !== 255 && distance(this, tank) < 384) {
          tank.takeMineHit();
        }
        builder = tank.builder.$;
        if ((_ref2 = builder.order) !== builder.states.inTank && _ref2 !== builder.states.parachuting) {
          if (distance(this, builder) < (TILE_SIZE_WORLD / 2)) {
            builder.kill();
          }
        }
      }
      this.world.spawn(Explosion, this.x, this.y);
      this.soundEffect(sounds.MINE_EXPLOSION);
      return this.spread();
    };
    MineExplosion.prototype.spread = function() {
      var n;
      n = this.cell.neigh(1, 0);
      if (!n.isEdgeCell()) {
        this.world.spawn(MineExplosion, n);
      }
      n = this.cell.neigh(0, 1);
      if (!n.isEdgeCell()) {
        this.world.spawn(MineExplosion, n);
      }
      n = this.cell.neigh(-1, 0);
      if (!n.isEdgeCell()) {
        this.world.spawn(MineExplosion, n);
      }
      n = this.cell.neigh(0, -1);
      if (!n.isEdgeCell()) {
        return this.world.spawn(MineExplosion, n);
      }
    };
    return MineExplosion;
  }();
  module.exports = MineExplosion;
}).call(this);
