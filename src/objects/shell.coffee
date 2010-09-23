# You shoot these. Many, in fact. With intent. At your opponent. Or perhaps some other obstacle.


{round, floor, sqrt
 cos, sin, PI}      = Math
WorldObject         = require '../world_object'
{TILE_SIZE_WORLD}   = require '../constants'
Explosion           = require './explosion'


# This is the interface the handful of destructable objects implement. I'm talking about terrain
# (thus map cells), tanks, bases and pillboxes. Actually, bases are indestructable. But Hittable
# sounds too cheesy.
#
# The basic premise is a single method `takeShellHit` that receives the Shell object, so that it
# may possibly inspect its owner. The return value should be an impact sound effect name.
class Destructable
  takeShellHit: (shell) ->


class Shell extends WorldObject
  charId: 'S'
  updatePriority: 20
  styled: false

  constructor: ->
    super

    @on 'simCreate', (@owner, options) =>
      options ||= {}
      # Default direction is the owner's.
      @direction = options.direction || @owner.direction
      # Default lifespan (fired by pillboxes) is 7 tiles.
      @lifespan = options.lifespan || (7 * TILE_SIZE_WORLD / 32 - 2)
      # Default for onWater (fired by pillboxes) is no.
      @onWater = options.onWater || no
      # Start the owner's location, and move one step away.
      @x = @owner.x; @y = @owner.y
      @move()
      # When our owner goes away, we go away.
      @owner.on 'simDestroy', ownerWatcher = => @sim.destroy this
      @on 'authDestroy', => @owner.removeListener 'simDestroy', ownerWatcher

    # Track position updates.
    @on 'netUpdate', =>
      @updateCell()

  serialization: (isCreate, p) ->
    if isCreate
      @direction = p('B', @direction)
      @owner = p('O', @owner)
      @onWater = p('f', @onWater)

    @x = p('H', @x)
    @y = p('H', @y)
    @lifespan = p('B', @lifespan)

  # Helper, called in several places that change shell position.
  updateCell: ->
    @cell = @sim.map.cellAtWorld @x, @y

  # Get the 1/16th direction step.
  getDirection16th: -> round((@direction - 1) / 16) % 16

  # Get the tilemap index to draw. This is the index in base.png.
  getTile: ->
    tx = @getDirection16th()
    [tx, 4]

  # The following methods all update the simulation.

  update: ->
    @move()
    collision = @collide()
    if collision
      [mode, victim] = collision
      sfx = victim.takeShellHit(this)
      # FIXME: play sound effect.
      if mode == 'cell'
        x = (@cell.x + 0.5) * TILE_SIZE_WORLD
        y = (@cell.y + 0.5) * TILE_SIZE_WORLD
      else # mode == 'tank'
        {x, y} = this
      @sim.spawn Explosion, x, y
      @sim.destroy this

    return unless @lifespan-- == 0
    @sim.destroy this
    @sim.spawn Explosion, @x, @y

  move: ->
    @radians ||= (256 - @direction) * 2 * PI / 256
    @x += round(cos(@radians) * 32)
    @y += round(sin(@radians) * 32)
    @updateCell()

  collide: ->
    # Check for a collision with a pillbox.
    if pill = @cell.pill
      return ['cell', pill] if pill.armour > 0

    # Check for collision with tanks.
    for tank in @sim.tanks when tank != @owner
      dx = tank.x - @x; dy = tank.y - @y
      distance = sqrt(dx*dx + dy*dy)
      return ['tank', tank] if distance <= 127

    # Check for collision with enemy base.
    if base = @cell.base
      if @onWater or (base.armour > 4 and base?.owner? and not base.owner.isAlly(@owner))
        return ['cell', base]

    # Check for terrain collision
    terrainCollision =
      if @onWater
        not @cell.isType('^', ' ', '%')
      else
        @cell.isType('|', '}', '#', 'b')
    return ['cell', @cell] if terrainCollision

Shell.register()


#### Exports
module.exports = Shell
