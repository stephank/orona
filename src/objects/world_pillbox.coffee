# The pillbox is a map object, and thus a slightly special case of world object.

{min, max, sqrt,
 round, ceil, PI
 cos, sin, atan2} = Math
{TILE_SIZE_WORLD} = require '../constants'
BoloObject        = require '../object'
sounds            = require '../sounds'
Shell             = require './shell'


class WorldPillbox extends BoloObject

  # This is a MapObject; it is constructed differently on the server.
  constructor: (world_or_map, x, y, @owner_idx, @armour, @speed) ->
    if arguments.length == 1
      @world = world_or_map
    else
      @x = (x + 0.5) * TILE_SIZE_WORLD; @y = (y + 0.5) * TILE_SIZE_WORLD

    # Keep track of owner and position changes.
    @on 'netUpdate', (changes) =>
      if changes.hasOwnProperty('x') or changes.hasOwnProperty('y')
        @updateCell()
      if changes.hasOwnProperty('owner')
        @owner_idx = if @owner then @owner.$.tank_idx else 255
        @cell?.retile()

  # Helper that updates the cell reference, and ensures a back-reference as well.
  updateCell: ->
    if @cell
      delete @cell.pill
      @cell.retile()
    if @x? and @y?
      @cell = @world.map.cellAtWorld(@x, @y)
      @cell.pill = this
      @cell.retile()
    else
      @cell = null

  # The state information to synchronize.
  serialization: (isCreate, p) ->
    p 'H', 'x'
    p 'H', 'y'

    p 'O', 'owner'
    p 'f', 'haveTarget'
    p 'B', 'armour'
    p 'B', 'speed'
    p 'B', 'coolDown'
    p 'B', 'reload'

  #### World updates

  spawn: ->
    @coolDown = 32
    @reload = 0

  anySpawn: ->
    @updateCell()

  update: ->
    return @haveTarget = no if @armour == 0

    @reload = min(@speed, @reload + 1)
    if --@coolDown == 0
      @coolDown = 32
      @speed = min(100, @speed + 1)
    return unless @reload >= @speed

    target = null; distance = Infinity
    for tank in @world.tanks when tank.armour != 255 and not @owner?.$.isAlly(tank)
      dx = tank.x - @x; dy = tank.y - @y
      d = sqrt(dx*dx + dy*dy)
      if d <= 2048 and d < distance
        target = tank; distance = d
    return @haveTarget = no unless target

    # On the flank from idle to targetting, don't fire immediatly.
    if @haveTarget
      # FIXME: This code needs some helpers, taken from Tank.
      rad = (256 - target.getDirection16th() * 16) * 2 * PI / 256
      dx = target.x + distance / 32 * round(cos(rad) * ceil(target.speed)) - @x
      dy = target.y + distance / 32 * round(sin(rad) * ceil(target.speed)) - @y
      direction = 256 - atan2(dy, dx) * 256 / (2*PI)
      @world.spawn Shell, this, {direction}
      @soundEffect sounds.SHOOTING
    @haveTarget = yes
    @reload = 0

  takeShellHit: (shell) ->
    @armour = max(0, @armour - 1)
    @coolDown = 32
    @speed = max(6, round(@speed / 2))
    @cell.retile()
    sounds.SHOT_BUILDING

  takeExplosionHit: ->
    @armour = max(0, @armour - 5)
    @cell.retile()


#### Exports
module.exports = WorldPillbox
