(function() {
  var BoloObject, PI, Shell, TILE_SIZE_WORLD, WorldPillbox, ceil, cos, distance, heading, max, min, round, sin, sounds, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  min = Math.min, max = Math.max, round = Math.round, ceil = Math.ceil, PI = Math.PI, cos = Math.cos, sin = Math.sin;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  _ref = require('../helpers'), distance = _ref.distance, heading = _ref.heading;
  BoloObject = require('../object');
  sounds = require('../sounds');
  Shell = require('./shell');
  WorldPillbox = function() {
    function WorldPillbox(world_or_map, x, y, owner_idx, armour, speed) {
      this.owner_idx = owner_idx;
      this.armour = armour;
      this.speed = speed;
      if (arguments.length === 1) {
        this.world = world_or_map;
      } else {
        this.x = (x + 0.5) * TILE_SIZE_WORLD;
        this.y = (y + 0.5) * TILE_SIZE_WORLD;
      }
      this.on('netUpdate', __bind(function(changes) {
        var _ref;
        if (changes.hasOwnProperty('x') || changes.hasOwnProperty('y')) {
          this.updateCell();
        }
        if (changes.hasOwnProperty('inTank') || changes.hasOwnProperty('carried')) {
          this.updateCell();
        }
        if (changes.hasOwnProperty('owner')) {
          this.updateOwner();
        }
        if (changes.hasOwnProperty('armour')) {
          return (_ref = this.cell) != null ? _ref.retile() : void 0;
        }
      }, this));
    }
    __extends(WorldPillbox, BoloObject);
    WorldPillbox.prototype.updateCell = function() {
      if (this.cell != null) {
        delete this.cell.pill;
        this.cell.retile();
      }
      if (this.inTank || this.carried) {
        return this.cell = null;
      } else {
        this.cell = this.world.map.cellAtWorld(this.x, this.y);
        this.cell.pill = this;
        return this.cell.retile();
      }
    };
    WorldPillbox.prototype.updateOwner = function() {
      var _ref;
      if (this.owner) {
        this.owner_idx = this.owner.$.tank_idx;
        this.team = this.owner.$.team;
      } else {
        this.owner_idx = this.team = 255;
      }
      return (_ref = this.cell) != null ? _ref.retile() : void 0;
    };
    WorldPillbox.prototype.serialization = function(isCreate, p) {
      p('O', 'owner');
      p('f', 'inTank');
      p('f', 'carried');
      p('f', 'haveTarget');
      if (!(this.inTank || this.carried)) {
        p('H', 'x');
        p('H', 'y');
      } else {
        this.x = this.y = null;
      }
      p('B', 'armour');
      p('B', 'speed');
      p('B', 'coolDown');
      return p('B', 'reload');
    };
    WorldPillbox.prototype.placeAt = function(cell) {
      var _ref;
      this.inTank = this.carried = false;
      _ref = cell.getWorldCoordinates(), this.x = _ref[0], this.y = _ref[1];
      this.updateCell();
      return this.reset();
    };
    WorldPillbox.prototype.spawn = function() {
      return this.reset();
    };
    WorldPillbox.prototype.reset = function() {
      this.coolDown = 32;
      return this.reload = 0;
    };
    WorldPillbox.prototype.anySpawn = function() {
      return this.updateCell();
    };
    WorldPillbox.prototype.update = function() {
      var d, direction, rad, tank, target, targetDistance, x, y, _i, _j, _len, _len2, _ref, _ref2, _ref3;
      if (this.inTank || this.carried) {
        return;
      }
      if (this.armour === 0) {
        this.haveTarget = false;
        _ref = this.world.tanks;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tank = _ref[_i];
          if (tank.armour !== 255) {
            if (tank.cell === this.cell) {
              this.inTank = true;
              this.x = this.y = null;
              this.updateCell();
              this.ref('owner', tank);
              this.updateOwner();
              break;
            }
          }
        }
        return;
      }
      this.reload = min(this.speed, this.reload + 1);
      if (--this.coolDown === 0) {
        this.coolDown = 32;
        this.speed = min(100, this.speed + 1);
      }
      if (this.reload < this.speed) {
        return;
      }
      target = null;
      targetDistance = Infinity;
      _ref2 = this.world.tanks;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        tank = _ref2[_j];
        if (tank.armour !== 255 && !((_ref3 = this.owner) != null ? _ref3.$.isAlly(tank) : void 0)) {
          d = distance(this, tank);
          if (d <= 2048 && d < targetDistance) {
            target = tank;
            targetDistance = d;
          }
        }
      }
      if (!target) {
        return this.haveTarget = false;
      }
      if (this.haveTarget) {
        rad = (256 - target.getDirection16th() * 16) * 2 * PI / 256;
        x = target.x + targetDistance / 32 * round(cos(rad) * ceil(target.speed));
        y = target.y + targetDistance / 32 * round(sin(rad) * ceil(target.speed));
        direction = 256 - heading(this, {
          x: x,
          y: y
        }) * 256 / (2 * PI);
        this.world.spawn(Shell, this, {
          direction: direction
        });
        this.soundEffect(sounds.SHOOTING);
      }
      this.haveTarget = true;
      return this.reload = 0;
    };
    WorldPillbox.prototype.aggravate = function() {
      this.coolDown = 32;
      return this.speed = max(6, round(this.speed / 2));
    };
    WorldPillbox.prototype.takeShellHit = function(shell) {
      this.aggravate();
      this.armour = max(0, this.armour - 1);
      this.cell.retile();
      return sounds.SHOT_BUILDING;
    };
    WorldPillbox.prototype.takeExplosionHit = function() {
      this.armour = max(0, this.armour - 5);
      return this.cell.retile();
    };
    WorldPillbox.prototype.repair = function(trees) {
      var used;
      used = min(trees, ceil((15 - this.armour) / 4));
      this.armour = min(15, this.armour + used * 4);
      this.cell.retile();
      return used;
    };
    return WorldPillbox;
  }();
  module.exports = WorldPillbox;
}).call(this);
