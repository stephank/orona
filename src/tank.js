var Tank = function(x, y, direction) {
  this.x = (x + 0.5) * TILE_SIZE_WORLD;
  this.y = (y + 0.5) * TILE_SIZE_WORLD;
  this.tile = map[y][x];

  this.speed = 0.00;
  this.accelerating = false;
  this.braking = false;

  this.direction = direction * 16;
  this.turningClockwise = false;
  this.turningCounterClockwise = false;
  this.turnSpeedup = 0;

  this.onBoat = true;
};

Tank.prototype.update = function() {
  // FIXME: terrain dependant.
  var maxSpeed = 16.00;
  // Determine acceleration.
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

  // FIXME: terrain dependant.
  var maxTurn = 1.00;
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
  this.x += Math.round(Math.cos(rad) * Math.round(this.speed));
  this.y += Math.round(Math.sin(rad) * Math.round(this.speed));

  // Update the tile reference.
  var tx = Math.round(this.x / TILE_SIZE_WORLD), ty = Math.round(this.y / TILE_SIZE_WORLD);
  this.tile = map[ty][tx];
};

Tank.prototype.draw = function() {
  var col = Math.round((this.direction - 1) / 16) % 16;
  var row = 12;
  // FIXME: allegiance
  if (this.onBoat) row += 1;

  var x = Math.round(this.x / PIXEL_SIZE_WORLD);
  var y = Math.round(this.y / PIXEL_SIZE_WORLD);

  c.drawImage(tiles, col * TILE_SIZE_PIXEL, row * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
      x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
};
