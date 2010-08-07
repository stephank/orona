{round, min, max, sin, cos, PI} = Math


class Tank
  constructor: (x, y, direction) ->
    @x = (x + 0.5) * TILE_SIZE_WORLD
    @y = (y + 0.5) * TILE_SIZE_WORLD
    @cell = map[y][x]

    @speed = 0.00
    @accelerating = no
    @braking = no

    @direction = direction * 16
    @turningClockwise = no
    @turningCounterClockwise = no
    @turnSpeedup = 0

    # FIXME: gametype dependant.
    @shells = 40
    @mines = 0
    @armour = 40
    @trees = 0

    @reload = 0
    @shooting = no

    @onBoat = yes

  update: () ->
    @reload-- if @reload > 0
    if @shooting and @reload == 0 and @shells > 0
      @reload = 13
      @shells--
      # FIXME: fire a projectile, play a sound
      console.debug 'BAM!'

    # FIXME: check if the terrain is clear, or if someone built underneath us.

    # Determine acceleration.
    maxSpeed = @cell.getTankSpeed @onBoat
    acceleration = if @speed > maxSpeed then -0.25 else 0.00
    if acceleration == 0.00 and @accelerating != @braking
      acceleration = if @accelerating then 0.25 else -0.25
    # Adjust speed, and clip only on the 'side' we're accelerating towards.
    if acceleration > 0.00 and @speed < maxSpeed
      @speed = min(maxSpeed, @speed + acceleration)
    else if acceleration < 0.00 and @speed > 0.00
      @speed = max(0.00, @speed + acceleration)

    # Determine turn rate.
    maxTurn = @cell.getTankTurn @onBoat
    if @turningClockwise == @turningCounterClockwise
      @turnSpeedup = 0
    else
      if @turningCounterClockwise
        acceleration = maxTurn
        if @turnSpeedup < 10 then acceleration /= 2
        if @turnSpeedup < 0 then @turnSpeedup = 0
        @turnSpeedup++
      else # if @turningClockwise
        acceleration = -maxTurn
        if @turnSpeedup > -10 then acceleration /= 2
        if @turnSpeedup > 0 then @turnSpeedup = 0
        @turnSpeedup--
      @direction += acceleration
      @direction += 256 while @direction < 0
      @direction %= 256 if @direction >= 256

    # Reposition.
    # FIXME: UGLY, and probably incorrect too.
    rad = (256 - ((round((@direction - 1) / 16) % 16) * 16)) * 2 * PI / 256
    newx = @x + round(cos(rad) * round(@speed))
    newy = @y + round(sin(rad) * round(@speed))

    if @onBoat then @moveOnBoat(newx, newy) else @moveOnLand(newx, newy)

    # FIXME: Reveal hidden mines nearby

  moveOnBoat: (newx, newy) ->
    oldcell = @cell
    actualx = newx
    actualy = newy

    # Check if we're running into land in either axis direction.
    aheadx = if newx > @x then newx + 64 else newx - 64
    aheadx = map.cellAtWorld(aheadx, newy)
    actualx = @x if !aheadx.isType(' ', '^') and (@speed < 16 or aheadx.getTankSpeed() == 0)
    aheady = if newy > @y then newy + 64 else newy - 64
    aheady = map.cellAtWorld(newx, aheady)
    actualy = @y if !aheady.isType(' ', '^') and (@speed < 16 or aheady.getTankSpeed() == 0)

    @x = actualx
    @y = actualy

    # Update the cell reference.
    @cell = map.cellAtWorld(@x, @y)

    # Check if we just left the water.
    unless @cell.isType(' ', '^')
      # Check if we're running over another boat; destroy it if so.
      if @cell.isType('b')
        # Don't need to retile surrounding cells for @
        @cell.setType(' ', 0)
        # FIXME: create a small explosion, play a sound.
      else
        # Leave a boat if we were on a river.
        if oldcell.isType(' ')
          # Don't need to retile surrounding cells for @
          oldcell.setType('b', 0)
        @onBoat = no

    # FIXME: check for mine impact

  moveOnLand: (newx, newy) ->
    # FIXME: all sorts of checks should be here.

    @x = newx
    @y = newy

    # Update the cell reference.
    @cell = map.cellAtWorld(@x, @y)

  draw: () ->
    col = round((@direction - 1) / 16) % 16
    row = 12
    # FIXME: allegiance
    row += 1 if @onBoat

    x = round(@x / PIXEL_SIZE_WORLD)
    y = round(@y / PIXEL_SIZE_WORLD)

    c.drawImage tilemap,
      col * TILE_SIZE_PIXEL,   row * TILE_SIZE_PIXEL,   TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
      x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL


# Exports.
window.Tank = Tank
