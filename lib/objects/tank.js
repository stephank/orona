(function() {
  var BoloObject, Builder, Explosion, Fireball, MineExplosion, PI, Shell, TILE_SIZE_WORLD, Tank, ceil, cos, distance, floor, max, min, round, sin, sounds, sqrt;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  round = Math.round, floor = Math.floor, ceil = Math.ceil, min = Math.min, sqrt = Math.sqrt, max = Math.max, sin = Math.sin, cos = Math.cos, PI = Math.PI;
  TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
  distance = require('../helpers').distance;
  BoloObject = require('../object');
  sounds = require('../sounds');
  Explosion = require('./explosion');
  MineExplosion = require('./mine_explosion');
  Shell = require('./shell');
  Fireball = require('./fireball');
  Builder = require('./builder');
  Tank = function() {
    function Tank(world) {
      this.world = world;
      this.on('netUpdate', __bind(function(changes) {
        if (changes.hasOwnProperty('x') || changes.hasOwnProperty('y') || changes.armour === 255) {
          return this.updateCell();
        }
      }, this));
    }
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
      return this.cell = (this.x != null) && (this.y != null) ? this.world.map.cellAtWorld(this.x, this.y) : null;
    };
    Tank.prototype.reset = function() {
      var startingPos, _ref;
      startingPos = this.world.map.getRandomStart();
      _ref = startingPos.cell.getWorldCoordinates(), this.x = _ref[0], this.y = _ref[1];
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
      this.firingRange = 7;
      this.waterTimer = 0;
      return this.onBoat = true;
    };
    Tank.prototype.serialization = function(isCreate, p) {
      var _ref;
      if (isCreate) {
        p('B', 'team');
        p('O', 'builder');
      }
      p('B', 'armour');
      if (this.armour === 255) {
        p('O', 'fireball');
        this.x = this.y = null;
        return;
      } else {
        if ((_ref = this.fireball) != null) {
          _ref.clear();
        }
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
      p('B', 'firingRange', {
        tx: function(v) {
          return v * 2;
        },
        rx: function(v) {
          return v / 2;
        }
      });
      p('B', 'waterTimer');
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
    Tank.prototype.getCarryingPillboxes = function() {
      var pill, _i, _len, _ref, _ref2, _results;
      _ref = this.world.map.pills;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pill = _ref[_i];
        if (pill.inTank && ((_ref2 = pill.owner) != null ? _ref2.$ : void 0) === this) {
          _results.push(pill);
        }
      }
      return _results;
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
    Tank.prototype.increaseRange = function() {
      return this.firingRange = min(7, this.firingRange + 0.5);
    };
    Tank.prototype.decreaseRange = function() {
      return this.firingRange = max(1, this.firingRange - 0.5);
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
    Tank.prototype.takeMineHit = function() {
      var largeExplosion;
      this.armour -= 10;
      if (this.armour < 0) {
        largeExplosion = this.shells + this.mines > 20;
        this.ref('fireball', this.world.spawn(Fireball, this.x, this.y, this.direction, largeExplosion));
        return this.kill();
      } else if (this.onBoat) {
        this.onBoat = false;
        this.speed = 0;
        if (this.cell.isType('^')) {
          return this.sink();
        }
      }
    };
    Tank.prototype.spawn = function(team) {
      this.team = team;
      this.reset();
      return this.ref('builder', this.world.spawn(Builder, this));
    };
    Tank.prototype.update = function() {
      if (this.death()) {
        return;
      }
      this.shootOrReload();
      this.turn();
      this.accelerate();
      this.fixPosition();
      return this.move();
    };
    Tank.prototype.destroy = function() {
      this.dropPillboxes();
      return this.world.destroy(this.builder.$);
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
        return;
      }
      this.shells--;
      this.reload = 13;
      this.world.spawn(Shell, this, {
        range: this.firingRange,
        onWater: this.onBoat
      });
      return this.soundEffect(sounds.SHOOTING);
    };
    Tank.prototype.turn = function() {
      var acceleration, maxTurn;
      maxTurn = this.cell.getTankTurn(this);
      if (this.turningClockwise === this.turningCounterClockwise) {
        this.turnSpeedup = 0;
        return;
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
      if (this.direction >= 256) {
        return this.direction %= 256;
      }
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
      if (acceleration > 0.00 && this.speed < maxSpeed) {
        return this.speed = min(maxSpeed, this.speed + acceleration);
      } else if (acceleration < 0.00 && this.speed > 0.00) {
        return this.speed = max(0.00, this.speed + acceleration);
      }
    };
    Tank.prototype.fixPosition = function() {
      var halftile, other, _i, _len, _ref, _results;
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
      _ref = this.world.tanks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        other = _ref[_i];
        if (other !== this && other.armour !== 255) {
          _results.push(distance(this, other) <= 255 ? (other.x < this.x ? this.x++ : this.x--, other.y < this.y ? this.y++ : this.y--) : void 0);
        }
      }
      return _results;
    };
    Tank.prototype.move = function() {
      var ahead, dx, dy, newx, newy, oldcell, rad, slowDown;
      dx = dy = 0;
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
        if (oldcell !== this.cell) {
          this.checkNewCell(oldcell);
        }
      }
      if (!this.onBoat && this.speed <= 3 && this.cell.isType(' ')) {
        if (++this.waterTimer === 15) {
          if (this.shells !== 0 || this.mines !== 0) {
            this.soundEffect(sounds.BUBBLES);
          }
          this.shells = max(0, this.shells - 1);
          this.mines = max(0, this.mines - 1);
          return this.waterTimer = 0;
        }
      } else {
        return this.waterTimer = 0;
      }
    };
    Tank.prototype.checkNewCell = function(oldcell) {
      if (this.onBoat) {
        if (!this.cell.isType(' ', '^')) {
          this.leaveBoat(oldcell);
        }
      } else {
        if (this.cell.isType('^')) {
          return this.sink();
        }
        if (this.cell.isType('b')) {
          this.enterBoat();
        }
      }
      if (this.cell.mine) {
        return this.world.spawn(MineExplosion, this.cell);
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
        return this.onBoat = false;
      }
    };
    Tank.prototype.enterBoat = function() {
      this.cell.setType(' ', false, 0);
      return this.onBoat = true;
    };
    Tank.prototype.sink = function() {
      this.world.soundEffect(sounds.TANK_SINKING, this.x, this.y);
      return this.kill();
    };
    Tank.prototype.kill = function() {
      this.dropPillboxes();
      this.x = this.y = null;
      this.armour = 255;
      return this.respawnTimer = 255;
    };
    Tank.prototype.dropPillboxes = function() {
      var cell, delta, ey, pill, pills, sy, width, x, y;
      pills = this.getCarryingPillboxes();
      if (pills.length === 0) {
        return;
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
            return;
          }
          pill.placeAt(cell);
        }
        x += 1;
      }
      return;
    };
    return Tank;
  }();
  module.exports = Tank;
}).call(this);
