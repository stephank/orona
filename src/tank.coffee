{round, ceil, min, max, sin, cos, PI} = Math


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

  update: ->
    @shootOrReload()
    @turn()
    @accelerate()
    # FIXME: check if the terrain is clear, or if someone built underneath us.
    @move() if @speed > 0
    # FIXME: check for mine impact
    # FIXME: Reveal hidden mines nearby

  shootOrReload: ->
    @reload-- if @reload > 0
    return unless @shooting and @reload == 0 and @shells > 0
    # We're clear to fire a shot.

    @reload = 13
    @shells--
    # FIXME: fire a projectile, play a sound.
    console.debug 'BAM!'

  turn: ->
    # Determine turn rate.
    maxTurn = @cell.getTankTurn @onBoat

    # Are the key presses cancelling eachother out?
    if @turningClockwise == @turningCounterClockwise
      @turnSpeedup = 0
      return

    # Determine angular acceleration, and apply speed-up.
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

    # Turn the tank.
    @direction += acceleration
    # Normalize direction.
    @direction += 256 while @direction < 0
    @direction %= 256 if @direction >= 256

  accelerate: ->
    # Determine acceleration.
    maxSpeed = @cell.getTankSpeed @onBoat
    # Is terrain forcing us to slow down?
    if @speed > maxSpeed then acceleration = -0.25
    # Are key presses cancelling eachother out?
    else if @accelerating == @braking then acceleration = 0.00
    # What's does the player want to do?
    else if @accelerating then acceleration = 0.25
    else acceleration = -0.25 # if @breaking
    # Adjust speed, and clip as necessary.
    if acceleration > 0.00 and @speed < maxSpeed
      @speed = min(maxSpeed, @speed + acceleration)
    else if acceleration < 0.00 and @speed > 0.00
      @speed = max(0.00, @speed + acceleration)

  move: ->
    # FIXME: UGLY, and probably incorrect too.
    rad = (256 - ((round((@direction - 1) / 16) % 16) * 16)) * 2 * PI / 256
    newx = @x + (dx = round(cos(rad) * ceil(@speed)))
    newy = @y + (dy = round(sin(rad) * ceil(@speed)))

    slowDown = yes

    # Check if we're running into an obstacle in either axis direction.
    unless dx == 0
      aheadx = if dx > 0 then newx + 64 else newx - 64
      aheadx = map.cellAtWorld(aheadx, newy)
      unless (@onBoat and !aheadx.isType(' ', '^') and @speed < 16) or aheadx.getTankSpeed(@onBoat) == 0
        @x = newx
        slowDown = no

    unless dy == 0
      aheady = if dy > 0 then newy + 64 else newy - 64
      aheady = map.cellAtWorld(newx, aheady)
      unless (@onBoat and !aheady.isType(' ', '^') and @speed < 16) or aheady.getTankSpeed(@onBoat) == 0
        @y = newy
        slowDown = no

    # If we're completely obstructed, reduce our speed.
    if slowDown
      @speed = max(0.00, @speed - 1)

    # Update the cell reference.
    oldcell = @cell
    @cell = map.cellAtWorld(@x, @y)

    # Check if we just left the water.
    @leaveBoat(oldcell) if @onBoat and !@cell.isType(' ', '^')

  leaveBoat: (oldcell) ->
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
