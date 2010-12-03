(function() {
  var BoloObject, Builder, MineExplosion, TILE_SIZE_WORLD, ceil, cos, distance, floor, heading, min, round, sin, sounds, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, floor = Math.floor, ceil = Math.ceil, min = Math.min, cos = Math.cos, sin = Math.sin;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  _ref = require('../helpers'), distance = _ref.distance, heading = _ref.heading;
  BoloObject = require('../object');
  sounds = require('../sounds');
  MineExplosion = require('./mine_explosion');
  Builder = function() {
    function Builder(world) {
      this.world = world;
      this.on('netUpdate', __bind(function(changes) {
        if (changes.hasOwnProperty('x') || changes.hasOwnProperty('y')) {
          return this.updateCell();
        }
      }, this));
    }
    __extends(Builder, BoloObject);
    Builder.prototype.states = {
      inTank: 0,
      waiting: 1,
      returning: 2,
      parachuting: 3,
      actions: {
        _min: 10,
        forest: 10,
        road: 11,
        repair: 12,
        boat: 13,
        building: 14,
        pillbox: 15,
        mine: 16
      }
    };
    Builder.prototype.styled = true;
    Builder.prototype.updateCell = function() {
      return this.cell = (this.x != null) && (this.y != null) ? this.world.map.cellAtWorld(this.x, this.y) : null;
    };
    Builder.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('O', 'owner');
      }
      p('B', 'order');
      if (this.order === this.states.inTank) {
        this.x = this.y = null;
      } else {
        p('H', 'x');
        p('H', 'y');
        p('H', 'targetX');
        p('H', 'targetY');
        p('B', 'trees');
        p('O', 'pillbox');
        p('f', 'hasMine');
      }
      if (this.order === this.states.waiting) {
        return p('B', 'waitTimer');
      }
    };
    Builder.prototype.getTile = function() {
      if (this.order === this.states.parachuting) {
        return [16, 1];
      } else {
        return [17, floor(this.animation / 3)];
      }
    };
    Builder.prototype.performOrder = function(action, trees, cell) {
      var pill, _ref;
      if (this.order !== this.states.inTank) {
        return;
      }
      if (!(this.owner.$.onBoat || this.owner.$.cell === cell || this.owner.$.cell.getManSpeed(this) > 0)) {
        return;
      }
      pill = null;
      if (action === 'mine') {
        if (this.owner.$.mines === 0) {
          return;
        }
        trees = 0;
      } else {
        if (this.owner.$.trees < trees) {
          return;
        }
        if (action === 'pillbox') {
          if (!(pill = this.owner.$.getCarryingPillboxes().pop())) {
            return;
          }
          pill.inTank = false;
          pill.carried = true;
        }
      }
      this.trees = trees;
      this.hasMine = action === 'mine';
      this.ref('pillbox', pill);
      if (this.hasMine) {
        this.owner.$.mines--;
      }
      this.owner.$.trees -= trees;
      this.order = this.states.actions[action];
      this.x = this.owner.$.x;
      this.y = this.owner.$.y;
      _ref = cell.getWorldCoordinates(), this.targetX = _ref[0], this.targetY = _ref[1];
      return this.updateCell();
    };
    Builder.prototype.kill = function() {
      var startingPos, _ref, _ref2, _ref3;
      if (!this.world.authority) {
        return;
      }
      this.soundEffect(sounds.MAN_DYING);
      this.order = this.states.parachuting;
      this.trees = 0;
      this.hasMine = false;
      if (this.pillbox) {
        this.pillbox.$.placeAt(this.cell);
        this.ref('pillbox', null);
      }
      if (this.owner.$.armour === 255) {
        _ref = [this.x, this.y], this.targetX = _ref[0], this.targetY = _ref[1];
      } else {
        _ref2 = [this.owner.$.x, this.owner.$.y], this.targetX = _ref2[0], this.targetY = _ref2[1];
      }
      startingPos = this.world.map.getRandomStart();
      return _ref3 = startingPos.cell.getWorldCoordinates(), this.x = _ref3[0], this.y = _ref3[1], _ref3;
    };
    Builder.prototype.spawn = function(owner) {
      this.ref('owner', owner);
      return this.order = this.states.inTank;
    };
    Builder.prototype.anySpawn = function() {
      this.team = this.owner.$.team;
      return this.animation = 0;
    };
    Builder.prototype.update = function() {
      if (this.order === this.states.inTank) {
        return;
      }
      this.animation = (this.animation + 1) % 9;
      switch (this.order) {
        case this.states.waiting:
          if (this.waitTimer-- === 0) {
            return this.order = this.states.returning;
          }
          break;
        case this.states.parachuting:
          return this.parachutingIn({
            x: this.targetX,
            y: this.targetY
          });
        case this.states.returning:
          if (this.owner.$.armour !== 255) {
            return this.move(this.owner.$, 128, 160);
          }
          break;
        default:
          return this.move({
            x: this.targetX,
            y: this.targetY
          }, 16, 144);
      }
    };
    Builder.prototype.move = function(target, targetRadius, boatRadius) {
      var ahead, dx, dy, movementAxes, newx, newy, onBoat, rad, speed, targetCell;
      speed = this.cell.getManSpeed(this);
      onBoat = false;
      targetCell = this.world.map.cellAtWorld(this.targetX, this.targetY);
      if (speed === 0 && this.cell === targetCell) {
        speed = 16;
      }
      if (this.owner.$.armour !== 255 && this.owner.$.onBoat && distance(this, this.owner.$) < boatRadius) {
        onBoat = true;
        speed = 16;
      }
      speed = min(speed, distance(this, target));
      rad = heading(this, target);
      newx = this.x + (dx = round(cos(rad) * ceil(speed)));
      newy = this.y + (dy = round(sin(rad) * ceil(speed)));
      movementAxes = 0;
      if (dx !== 0) {
        ahead = this.world.map.cellAtWorld(newx, this.y);
        if (onBoat || ahead === targetCell || ahead.getManSpeed(this) > 0) {
          this.x = newx;
          movementAxes++;
        }
      }
      if (dy !== 0) {
        ahead = this.world.map.cellAtWorld(this.x, newy);
        if (onBoat || ahead === targetCell || ahead.getManSpeed(this) > 0) {
          this.y = newy;
          movementAxes++;
        }
      }
      if (movementAxes === 0) {
        return this.order = this.states.returning;
      } else {
        this.updateCell();
        if (distance(this, target) <= targetRadius) {
          return this.reached();
        }
      }
    };
    Builder.prototype.reached = function() {
      var used;
      if (this.order === this.states.returning) {
        this.order = this.states.inTank;
        this.x = this.y = null;
        if (this.pillbox) {
          this.pillbox.$.inTank = true;
          this.pillbox.$.carried = false;
          this.ref('pillbox', null);
        }
        this.owner.$.trees = min(40, this.owner.$.trees + this.trees);
        this.trees = 0;
        if (this.hasMine) {
          this.owner.$.mines = min(40, this.owner.$.mines + 1);
        }
        this.hasMine = false;
        return;
      }
      if (this.cell.mine) {
        this.world.spawn(MineExplosion, this.cell);
        this.order = this.states.waiting;
        this.waitTimer = 20;
        return;
      }
      switch (this.order) {
        case this.states.actions.forest:
          if (this.cell.base || this.cell.pill || !this.cell.isType('#')) {
            break;
          }
          this.cell.setType('.');
          this.trees = 4;
          this.soundEffect(sounds.FARMING_TREE);
          break;
        case this.states.actions.road:
          if (this.cell.base || this.cell.pill || this.cell.isType('|', '}', 'b', '^', '#', '=')) {
            break;
          }
          if (this.cell.isType(' ') && this.cell.hasTankOnBoat()) {
            break;
          }
          this.cell.setType('=');
          this.trees = 0;
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.repair:
          if (this.cell.pill) {
            used = this.cell.pill.repair(this.trees);
            this.trees -= used;
          } else if (this.cell.isType('}')) {
            this.cell.setType('|');
            this.trees = 0;
          } else {
            break;
          }
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.boat:
          if (!(this.cell.isType(' ') && !this.cell.hasTankOnBoat())) {
            break;
          }
          this.cell.setType('b');
          this.trees = 0;
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.building:
          if (this.cell.base || this.cell.pill || this.cell.isType('b', '^', '#', '}', '|', ' ')) {
            break;
          }
          this.cell.setType('|');
          this.trees = 0;
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.pillbox:
          if (this.cell.pill || this.cell.base || this.cell.isType('b', '^', '#', '|', '}', ' ')) {
            break;
          }
          this.pillbox.$.armour = 15;
          this.trees = 0;
          this.pillbox.$.placeAt(this.cell);
          this.ref('pillbox', null);
          this.soundEffect(sounds.MAN_BUILDING);
          break;
        case this.states.actions.mine:
          if (this.cell.base || this.cell.pill || this.cell.isType('^', ' ', '|', 'b', '}')) {
            break;
          }
          this.cell.setType(null, true, 0);
          this.hasMine = false;
          this.soundEffect(sounds.MAN_LAY_MINE);
      }
      this.order = this.states.waiting;
      return this.waitTimer = 20;
    };
    Builder.prototype.parachutingIn = function(target) {
      var rad;
      if (distance(this, target) <= 16) {
        return this.order = this.states.returning;
      } else {
        rad = heading(this, target);
        this.x += round(cos(rad) * 3);
        this.y += round(sin(rad) * 3);
        return this.updateCell();
      }
    };
    return Builder;
  }();
  module.exports = Builder;
}).call(this);
