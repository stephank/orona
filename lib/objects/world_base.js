(function() {
  var BoloObject, TILE_SIZE_WORLD, WorldBase, distance, max, min, sounds;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  min = Math.min, max = Math.max;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  distance = require('../helpers').distance;
  BoloObject = require('../object');
  sounds = require('../sounds');
  WorldBase = function() {
    function WorldBase(world_or_map, x, y, owner_idx, armour, shells, mines) {
      this.owner_idx = owner_idx;
      this.armour = armour;
      this.shells = shells;
      this.mines = mines;
      if (arguments.length === 1) {
        this.world = world_or_map;
      } else {
        this.x = (x + 0.5) * TILE_SIZE_WORLD;
        this.y = (y + 0.5) * TILE_SIZE_WORLD;
        world_or_map.cellAtTile(x, y).setType('=', false, -1);
      }
      this.on('netUpdate', __bind(function(changes) {
        if (changes.hasOwnProperty('owner')) {
          return this.updateOwner();
        }
      }, this));
    }
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
      if (this.owner) {
        this.owner_idx = this.owner.$.tank_idx;
        this.team = this.owner.$.team;
      } else {
        this.owner_idx = this.team = 255;
      }
      return this.cell.retile();
    };
    WorldBase.prototype.anySpawn = function() {
      this.cell = this.world.map.cellAtWorld(this.x, this.y);
      return this.cell.base = this;
    };
    WorldBase.prototype.update = function() {
      var amount;
      if (this.refueling && (this.refueling.$.cell !== this.cell || this.refueling.$.armour === 255)) {
        this.ref('refueling', null);
      }
      if (!this.refueling) {
        return this.findSubject();
      }
      if (--this.refuelCounter !== 0) {
        return;
      }
      if (this.armour > 0 && this.refueling.$.armour < 40) {
        amount = min(5, this.armour, 40 - this.refueling.$.armour);
        this.refueling.$.armour += amount;
        this.armour -= amount;
        return this.refuelCounter = 46;
      } else if (this.shells > 0 && this.refueling.$.shells < 40) {
        this.refueling.$.shells += 1;
        this.shells -= 1;
        return this.refuelCounter = 7;
      } else if (this.mines > 0 && this.refueling.$.mines < 40) {
        this.refueling.$.mines += 1;
        this.mines -= 1;
        return this.refuelCounter = 7;
      } else {
        return this.refuelCounter = 1;
      }
    };
    WorldBase.prototype.findSubject = function() {
      var canClaim, other, tank, tanks, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _results;
      tanks = function() {
        _ref = this.world.tanks;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tank = _ref[_i];
          if (tank.armour !== 255 && tank.cell === this.cell) {
            _results.push(tank);
          }
        }
        return _results;
      }.call(this);
      for (_j = 0, _len2 = tanks.length; _j < _len2; _j++) {
        tank = tanks[_j];
        if ((_ref2 = this.owner) != null ? _ref2.$.isAlly(tank) : void 0) {
          this.ref('refueling', tank);
          this.refuelCounter = 46;
          break;
        } else {
          canClaim = true;
          for (_k = 0, _len3 = tanks.length; _k < _len3; _k++) {
            other = tanks[_k];
            if (other !== tank) {
              if (!tank.isAlly(other)) {
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
      return;
    };
    WorldBase.prototype.takeShellHit = function(shell) {
      var pill, _i, _len, _ref, _ref2;
      if (this.owner) {
        _ref = this.world.map.pills;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pill = _ref[_i];
          if (!(pill.inTank || pill.carried) && pill.armour > 0) {
            if (((_ref2 = pill.owner) != null ? _ref2.$.isAlly(this.owner.$) : void 0) && distance(this, pill) <= 2304) {
              pill.aggravate();
            }
          }
        }
      }
      this.armour = max(0, this.armour - 5);
      return sounds.SHOT_BUILDING;
    };
    return WorldBase;
  }();
  module.exports = WorldBase;
}).call(this);
