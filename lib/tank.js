(function() {
  var PI, Tank, _a, ceil, cos, max, min, round, sin;
  /*
  Orona, © 2010 Stéphan Kochen

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.
  */
  _a = Math;
  round = _a.round;
  ceil = _a.ceil;
  min = _a.min;
  max = _a.max;
  sin = _a.sin;
  cos = _a.cos;
  PI = _a.PI;
  Tank = function(x, y, direction) {
    this.x = (x + 0.5) * TILE_SIZE_WORLD;
    this.y = (y + 0.5) * TILE_SIZE_WORLD;
    this.cell = map[y][x];
    this.speed = 0.00;
    this.accelerating = false;
    this.braking = false;
    this.direction = direction * 16;
    this.turningClockwise = false;
    this.turningCounterClockwise = false;
    this.turnSpeedup = 0;
    this.shells = 40;
    this.mines = 0;
    this.armour = 40;
    this.trees = 0;
    this.reload = 0;
    this.shooting = false;
    this.onBoat = true;
    return this;
  };
  Tank.prototype.update = function() {
    this.shootOrReload();
    this.turn();
    this.accelerate();
    if (this.speed > 0) {
      return this.move();
    }
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
    return console.debug('BAM!');
  };
  Tank.prototype.turn = function() {
    var acceleration, maxTurn;
    maxTurn = this.cell.getTankTurn(this.onBoat);
    if (this.turningClockwise === this.turningCounterClockwise) {
      this.turnSpeedup = 0;
      return null;
    }
    if (this.turningCounterClockwise) {
      acceleration = maxTurn;
      this.turnSpeedup < 10 ? acceleration /= 2 : null;
      this.turnSpeedup < 0 ? (this.turnSpeedup = 0) : null;
      this.turnSpeedup++;
    } else {
      acceleration = -maxTurn;
      this.turnSpeedup > -10 ? acceleration /= 2 : null;
      this.turnSpeedup > 0 ? (this.turnSpeedup = 0) : null;
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
    maxSpeed = this.cell.getTankSpeed(this.onBoat);
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
      return (this.speed = min(maxSpeed, this.speed + acceleration));
    } else if (acceleration < 0.00 && this.speed > 0.00) {
      return (this.speed = max(0.00, this.speed + acceleration));
    }
  };
  Tank.prototype.move = function() {
    var aheadx, aheady, dx, dy, newx, newy, oldcell, rad, slowDown;
    rad = (256 - ((round((this.direction - 1) / 16) % 16) * 16)) * 2 * PI / 256;
    newx = this.x + (dx = round(cos(rad) * ceil(this.speed)));
    newy = this.y + (dy = round(sin(rad) * ceil(this.speed)));
    slowDown = true;
    if (!(dx === 0)) {
      aheadx = dx > 0 ? newx + 64 : newx - 64;
      aheadx = map.cellAtWorld(aheadx, newy);
      if (!(aheadx.getTankSpeed(this.onBoat) === 0)) {
        slowDown = false;
        if (!(this.onBoat && !aheadx.isType(' ', '^') && this.speed < 16)) {
          this.x = newx;
        }
      }
    }
    if (!(dy === 0)) {
      aheady = dy > 0 ? newy + 64 : newy - 64;
      aheady = map.cellAtWorld(newx, aheady);
      if (!(aheady.getTankSpeed(this.onBoat) === 0)) {
        slowDown = false;
        if (!(this.onBoat && !aheady.isType(' ', '^') && this.speed < 16)) {
          this.y = newy;
        }
      }
    }
    slowDown ? (this.speed = max(0.00, this.speed - 1)) : null;
    oldcell = this.cell;
    this.cell = map.cellAtWorld(this.x, this.y);
    if (this.onBoat) {
      if (!(this.cell.isType(' ', '^'))) {
        return this.leaveBoat(oldcell);
      }
    } else {
      if (this.cell.isType('b')) {
        return this.enterBoat();
      }
    }
  };
  Tank.prototype.leaveBoat = function(oldcell) {
    if (this.cell.isType('b')) {
      return this.cell.setType(' ', 0);
    } else {
      oldcell.isType(' ') ? oldcell.setType('b', 0) : null;
      return (this.onBoat = false);
    }
  };
  Tank.prototype.enterBoat = function() {
    this.cell.setType(' ', 0);
    return (this.onBoat = true);
  };
  Tank.prototype.draw = function() {
    var col, row, x, y;
    col = round((this.direction - 1) / 16) % 16;
    row = 12;
    if (this.onBoat) {
      row += 1;
    }
    x = round(this.x / PIXEL_SIZE_WORLD);
    y = round(this.y / PIXEL_SIZE_WORLD);
    return c.drawImage(tilemap, col * TILE_SIZE_PIXEL, row * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
  };
  window.Tank = Tank;
})();
