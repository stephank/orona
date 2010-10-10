# You shoot these. Many, in fact. With intent. At your opponent. Or perhaps some other obstacle.

{round, floor, sqrt
 cos, sin, PI}      = Math
BoloObject          = require '../object'
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


class Shell extends BoloObject

  updatePriority: 20
  styled: false

  constructor: (@world) ->
    # Track position updates.
    @on 'netSync', =>
      @updateCell()

  serialization: (isCreate, p) ->
    if isCreate
      p 'B', 'direction'
      p 'O', 'owner'
      p 'O', 'attribution'
      p 'f', 'onWater'

    p 'H', 'x'
    p 'H', 'y'
    p 'B', 'lifespan'

  # Helper, called in several places that change shell position.
  updateCell: ->
    @cell = @world.map.cellAtWorld @x, @y

  # Get the 1/16th direction step.
  getDirection16th: -> round((@direction - 1) / 16) % 16

  # Get the tilemap index to draw. This is the index in base.png.
  getTile: ->
    tx = @getDirection16th()
    [tx, 4]

  #### World updates

  spawn: (owner, options) =>
    options ||= {}

    @ref 'owner', owner
    if @owner.$.owner?
      @ref 'attribution', @owner.$.owner
    else
      @ref 'attribution', @owner.$

    # Default direction is the owner's.
    @direction = options.direction || @owner.$.direction
    # Default lifespan (fired by pillboxes) is 7 tiles.
    @lifespan = options.lifespan || (7 * TILE_SIZE_WORLD / 32 - 2)
    # Default for onWater (fired by pillboxes) is no.
    @onWater = options.onWater || no
    # Start the owner's location, and move one step away.
    @x = @owner.$.x; @y = @owner.$.y
    @move()

  update: ->
    @move()
    collision = @collide()
    if collision
      [mode, victim] = collision
      sfx = victim.takeShellHit(this)
      if mode == 'cell'
        x = (@cell.x + 0.5) * TILE_SIZE_WORLD
        y = (@cell.y + 0.5) * TILE_SIZE_WORLD
        @world.soundEffect sfx, x, y
      else # mode == 'tank'
        {x, y} = this
        victim.soundEffect sfx
      @world.spawn Explosion, x, y
      @world.destroy this

    return unless @lifespan-- == 0
    @world.destroy this
    @world.spawn Explosion, @x, @y

  move: ->
    @radians ||= (256 - @direction) * 2 * PI / 256
    @x += round(cos(@radians) * 32)
    @y += round(sin(@radians) * 32)
    @updateCell()

  collide: ->
    # Check for a collision with a pillbox, but not our owner.
    if pill = @cell.pill
      return ['cell', pill] if pill.armour > 0 and pill != @owner?.$

    # Check for collision with tanks. Carefully avoid hitting our owner when fired from a tank.
    # At the same time, remember that a pillbox *can* hit its owner.
    for tank in @world.tanks when tank != @owner?.$ and tank.armour != 255
      dx = tank.x - @x; dy = tank.y - @y
      distance = sqrt(dx*dx + dy*dy)
      return ['tank', tank] if distance <= 127

    # Check for collision with enemy base.
    if base = @cell.base
      if @onWater or (base.armour > 4 and base?.owner? and not base.owner.$.isAlly(@attribution.$))
        return ['cell', base]

    # Check for terrain collision
    terrainCollision =
      if @onWater
        not @cell.isType('^', ' ', '%')
      else
        @cell.isType('|', '}', '#', 'b')
    return ['cell', @cell] if terrainCollision


#### Exports
module.exports = Shell
