var Tank = function(x, y, direction) {
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

  // FIXME: gametype dependant.
  this.shells = 40;
  this.mines = 0;
  this.armour = 40;
  this.trees = 0;

  this.reload = 0;
  this.shooting = false;

  this.onBoat = true;
};

Tank.prototype.update = function() {
  if (this.reload > 0) this.reload--;
  if (this.shooting && this.reload === 0 && this.shells > 0) {
    this.reload = 13;
    this.shells--;
    // FIXME: fire a projectile, play a sound
    console.debug('BAM!');
  }

  // FIXME: check if the terrain is clear, or if someone built underneath us.

  // Determine acceleration.
  var maxSpeed = this.cell.getTankSpeed(this.onBoat);
  var acceleration = (this.speed > maxSpeed) ? -0.25 : 0.00;
  if (acceleration === 0.00 && this.accelerating !== this.braking) {
    if (this.accelerating)       acceleration =  0.25;
    else /* if (this.braking) */ acceleration = -0.25;
  }
  // Adjust speed, and clip only on the 'side' we're accelerating towards.
  if (acceleration > 0.00 && this.speed < maxSpeed)
    this.speed = Math.min(maxSpeed, this.speed + acceleration)
  else if (acceleration < 0.00 && this.speed > 0.00)
    this.speed = Math.max(0.00, this.speed + acceleration);

  // Determine turn rate.
  var maxTurn = this.cell.getTankTurn(this.onBoat);
  if (this.turningClockwise === this.turningCounterClockwise) {
    this.turnSpeedup = 0;
  }
  else {
    if (this.turningCounterClockwise) {
      acceleration = maxTurn;
      if (this.turnSpeedup < 0) this.turnSpeedup = 0;
      if (this.turnSpeedup < 10) acceleration /= 2;
      this.turnSpeedup++;
    }
    else /* if (this.turningClockwise) */ {
      acceleration = -maxTurn;
      if (this.turnSpeedup > 0) this.turnSpeedup = 0;
      if (this.turnSpeedup > -10) acceleration /= 2;
      this.turnSpeedup--;
    }
    this.direction += acceleration;
    while (this.direction < 0) this.direction += 256;
    if (this.direction >= 256) this.direction %= 256;
  }

  // Reposition.
  // FIXME: UGLY, and probably incorrect too.
  var rad = (256 - ((Math.round((this.direction - 1) / 16) % 16) * 16)) * 2 * Math.PI / 256;
  var newx = this.x + Math.round(Math.cos(rad) * Math.round(this.speed));
  var newy = this.y + Math.round(Math.sin(rad) * Math.round(this.speed));

  if (this.onBoat)
    this.moveOnBoat(newx, newy);
  else
    this.moveOnLand(newx, newy);

  // FIXME: Reveal hidden mines nearby
}

Tank.prototype.moveOnBoat = function(newx, newy) {
  var oldcell = this.cell;
  var actualx = newx;
  var actualy = newy;

  // Check if we're running into land in either axis direction.
  var aheadx = map.cellAtWorld((newx > this.x) ? newx + 64 : newx - 64, newy);
  if (!aheadx.isType(' ', '^') && (this.speed < 16 || aheadx.getTankSpeed() === 0))
    actualx = this.x;
  var aheady = map.cellAtWorld(newx, (newy > this.y) ? newy + 64 : newy - 64);
  if (!aheady.isType(' ', '^') && (this.speed < 16 || aheady.getTankSpeed() === 0))
    actualy = this.y;

  this.x = actualx;
  this.y = actualy;

  // Update the cell reference.
  this.cell = map.cellAtWorld(this.x, this.y);

  // Check if we just left the water.
  if (!this.cell.isType(' ', '^')) {
    // Check if we're running over another boat; destroy it if so.
    if (this.cell.isType('b')) {
      // Don't need to retile surrounding cells for this.
      this.cell.setType(' ', 0);
      // FIXME: create a small explosion, play a sound.
    }
    else {
      // Leave a boat if we were on a river.
      if (oldcell.isType(' '))
        // Don't need to retile surrounding cells for this.
        oldcell.setType('b', 0);
      this.onBoat = false;
    }
  }

  // FIXME: check for mine impact
}

Tank.prototype.moveOnLand = function(newx, newy) {
  // FIXME: all sorts of checks should be here.

  this.x = newx;
  this.y = newy;

  // Update the cell reference.
  this.cell = map.cellAtWorld(this.x, this.y);
};

Tank.prototype.draw = function() {
  var col = Math.round((this.direction - 1) / 16) % 16;
  var row = 12;
  // FIXME: allegiance
  if (this.onBoat) row += 1;

  var x = Math.round(this.x / PIXEL_SIZE_WORLD);
  var y = Math.round(this.y / PIXEL_SIZE_WORLD);

  c.drawImage(tilemap, col * TILE_SIZE_PIXEL, row * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
      x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
};
