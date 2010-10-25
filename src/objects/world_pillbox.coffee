# The pillbox is a map object, and thus a slightly special case of world object.

{min, max, round, ceil, PI, cos, sin} = Math
{TILE_SIZE_WORLD} = require '../constants'
{distance, heading} = require '../helpers'
BoloObject = require '../object'
sounds     = require '../sounds'
Shell      = require './shell'


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
      if changes.hasOwnProperty('inTank') or changes.hasOwnProperty('carried')
        @updateCell()
      if changes.hasOwnProperty('owner')
        @updateOwner()
      if changes.hasOwnProperty('armour')
        @cell?.retile()

  # Helper that updates the cell reference, and ensures a back-reference as well.
  updateCell: ->
    if @cell?
      delete @cell.pill
      @cell.retile()
    if @inTank or @carried
      @cell = null
    else
      @cell = @world.map.cellAtWorld(@x, @y)
      @cell.pill = this
      @cell.retile()

  # Helper for common stuff to do when the owner changes.
  updateOwner: ->
    if @owner
      @owner_idx = @owner.$.tank_idx
      @team = @owner.$.team
    else
      @owner_idx = @team = 255
    @cell?.retile()

  # The state information to synchronize.
  serialization: (isCreate, p) ->
    p 'O', 'owner'

    p 'f', 'inTank'
    p 'f', 'carried'
    p 'f', 'haveTarget'

    unless @inTank or @carried
      p 'H', 'x'
      p 'H', 'y'
    else
      @x = @y = null

    p 'B', 'armour'
    p 'B', 'speed'
    p 'B', 'coolDown'
    p 'B', 'reload'

  # Called when dropped by a tank, or placed by a builder.
  placeAt: (cell) ->
    @inTank = @carried = no
    [@x, @y] = cell.getWorldCoordinates()
    @updateCell()
    @reset()

  #### World updates

  spawn: ->
    @reset()

  reset: ->
    @coolDown = 32
    @reload = 0

  anySpawn: ->
    @updateCell()

  update: ->
    return if @inTank or @carried
    if @armour == 0
      @haveTarget = no

      for tank in @world.tanks when tank.armour != 255
        if tank.cell == @cell
          @inTank = yes; @x = @y = null; @updateCell()
          @ref('owner', tank); @updateOwner()
          break
      return

    @reload = min(@speed, @reload + 1)
    if --@coolDown == 0
      @coolDown = 32
      @speed = min(100, @speed + 1)
    return unless @reload >= @speed

    target = null; targetDistance = Infinity
    for tank in @world.tanks when tank.armour != 255 and not @owner?.$.isAlly(tank)
      d = distance(this, tank)
      if d <= 2048 and d < targetDistance
        target = tank; targetDistance = d
    return @haveTarget = no unless target

    # On the flank from idle to targetting, don't fire immediatly.
    if @haveTarget
      # FIXME: This code needs some helpers, taken from Tank.
      rad = (256 - target.getDirection16th() * 16) * 2 * PI / 256
      x = target.x + targetDistance / 32 * round(cos(rad) * ceil(target.speed))
      y = target.y + targetDistance / 32 * round(sin(rad) * ceil(target.speed))
      direction = 256 - heading(this, {x, y}) * 256 / (2*PI)
      @world.spawn Shell, this, {direction}
      @soundEffect sounds.SHOOTING
    @haveTarget = yes
    @reload = 0

  aggravate: ->
    @coolDown = 32
    @speed = max(6, round(@speed / 2))

  takeShellHit: (shell) ->
    @aggravate()
    @armour = max(0, @armour - 1)
    @cell.retile()
    sounds.SHOT_BUILDING

  takeExplosionHit: ->
    @armour = max(0, @armour - 5)
    @cell.retile()

  repair: (trees) ->
    used = min(trees, ceil((15 - @armour) / 4))
    @armour = min(15, @armour + used*4)
    @cell.retile()
    used


#### Exports
module.exports = WorldPillbox
