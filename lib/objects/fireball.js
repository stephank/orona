(function() {
  var BoloObject, Explosion, Fireball, PI, TILE_SIZE_WORLD, cos, round, sin, sounds;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, cos = Math.cos, sin = Math.sin, PI = Math.PI;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  sounds = require('../sounds');
  BoloObject = require('../object');
  Explosion = require('./explosion');
  Fireball = function() {
    function Fireball() {
      Fireball.__super__.constructor.apply(this, arguments);
    }
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
    Fireball.prototype.spawn = function(x, y, direction, largeExplosion) {
      this.x = x;
      this.y = y;
      this.direction = direction;
      this.largeExplosion = largeExplosion;
      return this.lifespan = 80;
    };
    Fireball.prototype.update = function() {
      if (this.lifespan-- % 2 === 0) {
        if (this.wreck()) {
          return;
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
      var ahead, dx, dy, newx, newy, radians;
      if (this.dx == null) {
        radians = (256 - this.direction) * 2 * PI / 256;
        this.dx = round(cos(radians) * 48);
        this.dy = round(sin(radians) * 48);
      }
      dx = this.dx, dy = this.dy;
      newx = this.x + dx;
      newy = this.y + dy;
      if (dx !== 0) {
        ahead = dx > 0 ? newx + 24 : newx - 24;
        ahead = this.world.map.cellAtWorld(ahead, newy);
        if (!ahead.isObstacle()) {
          this.x = newx;
        }
      }
      if (dy !== 0) {
        ahead = dy > 0 ? newy + 24 : newy - 24;
        ahead = this.world.map.cellAtWorld(newx, ahead);
        if (!ahead.isObstacle()) {
          return this.y = newy;
        }
      }
    };
    Fireball.prototype.explode = function() {
      var builder, cell, cells, dx, dy, tank, x, y, _i, _j, _len, _len2, _ref, _ref2, _ref3, _results;
      cells = [this.world.map.cellAtWorld(this.x, this.y)];
      if (this.largeExplosion) {
        dx = this.dx > 0 ? 1 : -1;
        dy = this.dy > 0 ? 1 : -1;
        cells.push(cells[0].neigh(dx, 0));
        cells.push(cells[0].neigh(0, dy));
        cells.push(cells[0].neigh(dx, dy));
        this.soundEffect(sounds.BIG_EXPLOSION);
      } else {
        this.soundEffect(sounds.MINE_EXPLOSION);
      }
      _results = [];
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        cell.takeExplosionHit();
        _ref = this.world.tanks;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          tank = _ref[_j];
          if (builder = tank.builder.$) {
            if ((_ref2 = builder.order) !== builder.states.inTank && _ref2 !== builder.states.parachuting) {
              if (builder.cell === cell) {
                builder.kill();
              }
            }
          }
        }
        _ref3 = cell.getWorldCoordinates(), x = _ref3[0], y = _ref3[1];
        _results.push(this.world.spawn(Explosion, x, y));
      }
      return _results;
    };
    return Fireball;
  }();
  module.exports = Fireball;
}).call(this);
