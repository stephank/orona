# The Tank class contains all the logic you need to tread well. (And all the other logic needed
# to punish you if you don't.)

{round, floor, ceil, min, sqrt, max, sin, cos, PI} = Math
{TILE_SIZE_WORLD} = require '../constants'
BoloObject        = require '../object'
sounds            = require '../sounds'
Explosion         = require './explosion'
Shell             = require './shell'
Fireball          = require './fireball'


class Tank extends BoloObject

  styled: true

  # Tanks are only ever spawned and destroyed on the server.
  constructor: (@world) ->
    # Track position updates.
    @on 'netUpdate', (changes) =>
      if changes.hasOwnProperty('x') or changes.hasOwnProperty('y') or changes.armour == 255
        @updateCell()

  # Keep the player list updated.
  anySpawn: ->
    @updateCell()
    @world.addTank(this)
    @on 'finalize', => @world.removeTank(this)

  # Helper, called in several places that change tank position.
  updateCell: ->
    @cell =
      if @x? and @y?
        @world.map.cellAtWorld @x, @y
      else
        null

  # (Re)spawn the tank. Initializes all state. Only ever called on the server.
  reset: ->
    startingPos = @world.map.getRandomStart()
    @x = (startingPos.x + 0.5) * TILE_SIZE_WORLD
    @y = (startingPos.y + 0.5) * TILE_SIZE_WORLD
    @direction = startingPos.direction * 16
    @updateCell()

    @speed          = 0.00
    @slideTicks     = 0
    @slideDirection = 0
    @accelerating   = no
    @braking        = no

    @turningClockwise        = no
    @turningCounterClockwise = no
    @turnSpeedup             = 0

    # FIXME: gametype dependant.
    @shells = 40
    @mines  = 0
    @armour = 40
    @trees  = 0

    @reload   = 0
    @shooting = no

    @onBoat = yes

  serialization: (isCreate, p) ->
    # Team is only set once.
    p 'B', 'team' if isCreate

    p 'B', 'armour'

    # Are we dead?
    if @armour == 255
      p 'O', 'fireball'
      @x = @y = null
      return
    else
      @fireball?.clear()

    p 'H', 'x'
    p 'H', 'y'
    p 'B', 'direction'
    # Uses 0.25 increments, so we can pack this as a byte.
    p 'B', 'speed',
      tx: (v) -> v * 4
      rx: (v) -> v / 4
    p 'B', 'slideTicks'
    p 'B', 'slideDirection'
    # FIXME: should simply be a signed byte.
    p 'B', 'turnSpeedup',
      tx: (v) -> v + 50
      rx: (v) -> v - 50
    p 'B', 'shells'
    p 'B', 'mines'
    p 'B', 'trees'
    p 'B', 'reload'

    # Group bit fields.
    p 'f', 'accelerating'
    p 'f', 'braking'
    p 'f', 'turningClockwise'
    p 'f', 'turningCounterClockwise'
    p 'f', 'shooting'
    p 'f', 'onBoat'


  # Get the 1/16th direction step.
  # FIXME: Should move our angle-related calculations to a separate module or so.
  getDirection16th: -> round((@direction - 1) / 16) % 16
  getSlideDirection16th: -> round((@slideDirection - 1) / 16) % 16

  # Get the tilemap index to draw. This is the index in styled.png.
  getTile: ->
    tx = @getDirection16th()
    ty = if @onBoat then 1 else 0
    [tx, ty]

  # Tell whether the other tank is an ally.
  isAlly: (other) -> other == this or (@team != 255 and other.team == @team)

  # We've taken a hit. Check if we were killed, otherwise slide and possibly kill our boat.
  takeShellHit: (shell) ->
    @armour -= 5
    if @armour < 0
      largeExplosion = @shells + @mines > 20
      @ref 'fireball', @world.spawn(Fireball, @x, @y, shell.direction, largeExplosion)
      @kill()
    else
      @slideTicks = 8
      @slideDirection = shell.direction
      if @onBoat
        @onBoat = no
        @speed = 0
        @sink() if @cell.isType('^')
    sounds.HIT_TANK


  #### World updates

  spawn: ->
    # FIXME: Proper way to select teams.
    @team = @world.tanks.length % 2
    # Initialize.
    @reset()

  update: ->
    return if @death()
    @shootOrReload()
    @turn()
    @accelerate()
    @fixPosition()
    @move()

  destroy: ->
    @dropPillboxes()

  death: ->
    return no unless @armour == 255

    # Count down ticks from 255, before respawning.
    if @world.authority and --@respawnTimer == 0
      delete @respawnTimer
      @reset()
      return no

    return yes

  shootOrReload: ->
    @reload-- if @reload > 0
    return unless @shooting and @reload == 0 and @shells > 0
    # We're clear to fire a shot.

    @reload = 13
    @shells--
    # FIXME: variable firing distance
    @world.spawn Shell, this, onWater: @onBoat
    @soundEffect sounds.SHOOTING

  turn: ->
    # Determine turn rate.
    maxTurn = @cell.getTankTurn this

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
    maxSpeed = @cell.getTankSpeed this
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

  fixPosition: ->
    # Check to see if there's a solid underneath the tank. This could happen if some other player
    # builds underneath us. In that case, we try to nudge the tank off the solid.
    if @cell.getTankSpeed(this) == 0
      halftile = TILE_SIZE_WORLD / 2
      if @x % TILE_SIZE_WORLD >= halftile then @x++ else @x--
      if @y % TILE_SIZE_WORLD >= halftile then @y++ else @y--
      @speed = max(0.00, @speed - 1)

    # Also check if we're on top of another tank.
    for other in @world.tanks when other != this and other.armour != 255
      dx = other.x - @x; dy = other.y - @y
      distance = sqrt(dx*dx + dy*dy)
      continue if distance > 255

      # FIXME: winbolo actually does an increasing size of nudges while the tanks are colliding,
      # keeping a static/global variable. But perhaps this should be combined with tank sliding?
      if dx < 0 then @x++ else @x--
      if dy < 0 then @y++ else @y--

  move: ->
    dx = dy = 0
    # FIXME: Our angle unit should match more closely that of JavaScript.
    if @speed > 0
      rad = (256 - @getDirection16th() * 16) * 2 * PI / 256
      dx += round(cos(rad) * ceil(@speed))
      dy += round(sin(rad) * ceil(@speed))
    if @slideTicks > 0
      rad = (256 - @getSlideDirection16th() * 16) * 2 * PI / 256
      dx += round(cos(rad) * 16)
      dy += round(sin(rad) * 16)
      @slideTicks--
    newx = @x + dx; newy = @y + dy

    slowDown = yes

    # Check if we're running into an obstacle in either axis direction.
    unless dx == 0
      ahead = if dx > 0 then newx + 64 else newx - 64
      ahead = @world.map.cellAtWorld(ahead, newy)
      unless ahead.getTankSpeed(this) == 0
        slowDown = no
        @x = newx unless @onBoat and !ahead.isType(' ', '^') and @speed < 16

    unless dy == 0
      ahead = if dy > 0 then newy + 64 else newy - 64
      ahead = @world.map.cellAtWorld(newx, ahead)
      unless ahead.getTankSpeed(this) == 0
        slowDown = no
        @y = newy unless @onBoat and !ahead.isType(' ', '^') and @speed < 16

    unless dx == 0 and dy == 0
      # If we're completely obstructed, reduce our speed.
      if slowDown
        @speed = max(0.00, @speed - 1)

      # Update the cell reference.
      oldcell = @cell
      @updateCell()

      # Check our new terrain if we changed cells.
      @checkNewCell(oldcell) if oldcell != @cell

  checkNewCell: (oldcell) ->
    # FIXME: check for mine impact
    # FIXME: Reveal hidden mines nearby

    # Check if we just entered or left the water.
    if @onBoat
      @leaveBoat(oldcell) unless @cell.isType(' ', '^')
    else
      return @sink() if @cell.isType('^')
      return @enterBoat() if @cell.isType('b')

  leaveBoat: (oldcell) ->
    # Check if we're running over another boat; destroy it if so.
    if @cell.isType('b')
      # Don't need to retile surrounding cells for this.
      @cell.setType(' ', no, 0)
      # Create a small explosion at the center of the tile.
      x = (@cell.x + 0.5) * TILE_SIZE_WORLD; y = (@cell.y + 0.5) * TILE_SIZE_WORLD
      @world.spawn Explosion, x, y
      @world.soundEffect sounds.SHOT_BUILDING, x, y
    else
      # Leave a boat if we were on a river.
      if oldcell.isType(' ')
        # Don't need to retile surrounding cells for this.
        oldcell.setType('b', no, 0)
      @onBoat = no

  enterBoat: ->
    # Don't need to retile surrounding cells for this.
    @cell.setType(' ', no, 0)
    @onBoat = yes

  sink: ->
    @world.soundEffect sounds.TANK_SINKING, @x, @y
    # FIXME: Somehow blame a killer, if instigated by a shot?
    @kill()

  kill: ->
    # FIXME: Message the other players. Probably want a scoreboard too.
    @dropPillboxes()
    @x = @y = null
    @armour = 255
    # The respawnTimer attribute exists only on the server.
    # It is deleted once the timer is triggered, which happens in death().
    @respawnTimer = 255

  # Drop all pillboxes we own in a neat square area.
  dropPillboxes: ->
    pills = pill for pill in @world.map.pills when pill.inTank and pill.owner?.$ == this
    return if pills.length == 0

    x = @cell.x; sy = @cell.y
    width = sqrt(pills.length)
    delta = floor(width / 2)
    width = round(width)
    x -= delta; sy -= delta
    ey = sy + width

    while pills.length != 0
      for y in [sy...ey]
        cell = @world.map.cellAtTile(x, y)
        continue if cell.base? or cell.pill? or cell.isType('|', '}', 'b')
        return unless pill = pills.pop()
        pill.placeAt cell
      x += 1
    return


#### Exports
module.exports = Tank
