# The pillbox is a map object, and thus a slightly special case of world object.

{min, max, sqrt}  = Math
{TILE_SIZE_WORLD} = require '../constants'
WorldObject       = require '../world_object'


class SimPillbox extends WorldObject
  charId: 'p'

  # This is a MapObject; it is constructed differently on the authority.
  constructor: (sim_or_map, @x, @y, @owner_idx, @armour, @speed) ->
    if arguments.length == 1
      @sim = sim_or_map

    @on 'spawn', =>
      @coolDown = 32
      @reload = 0

    # After initialization on client and server set-up the cell reference.
    @on 'anySpawn', =>
      @updateCell()

    # Keep our non-synchronized attributes up-to-date on the client.
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
      @cell = @sim.map.cellAtTile(@x, @y)
      @cell.pill = this
      @cell.retile()
    else
      @cell = null

  # The state information to synchronize.
  serialization: (isCreate, p) ->
    p 'B', 'x'
    p 'B', 'y'

    p 'T', 'owner'
    p 'T', 'target'
    p 'B', 'armour'
    p 'B', 'speed'
    p 'B', 'coolDown'
    p 'B', 'reload'

  update: ->
    return if @armour == 0
    @reload = min(@speed, @reload + 1)
    if --@coolDown == 0
      @coolDown = 32
      @speed = min(100, @speed + 1)
    @updateTarget()
    @fire() if @target and @reload >= @speed

  # Find the closest tank we can give hell.
  updateTarget: ->
    closestTank = null; closestDistance = Infinity
    for tank in @sim.tanks when tank.armour != 255 and not @owner?.$.isAlly(tank)
      dx = tank.x - @x * TILE_SIZE_WORLD; dy = tank.y - @y * TILE_SIZE_WORLD
      distance = sqrt(dx*dx + dy*dy)
      if distance <= 2048 and distance < closestDistance
        closestDistance = distance
        closestTank = tank
    # On the flank from `null` to a valid target, restart the reload timer.
    @reload = 0 unless @target
    @ref 'target', closestTank

  # Take a shot at `@target`. We need to find the right angle to shoot at in order to hit a
  # possibly moving tank. We need to match up the X and Y coordinates of our shell and the tank
  # as a function of time:
  #     Xt + cos(At) * Vt * T = Xp + cos(Ap) * 32 * (T+1)
  #     Yt + sin(At) * Vt * T = Yp + sin(Ap) * 32 * (T+1)
  # `Xt`, `Yt`, `At`, and `Vt` are the tank's current position, angle and velocity.
  # `Xp`, `Yp`, are our current position. The shell speed is a constant 32. `T=0` is this moment.
  # We're trying to find `Ap`.
  fire: ->
    # FIXME
    @reload = 0

  takeShellHit: (shell) ->
    @armour = max(0, @armour - 1)
    @cell.retile()
    # FIXME: do something with speed

  takeExplosionHit: ->
    @armour = max(0, @armour - 5)
    @cell.retile()

SimPillbox.register()


#### Exports
module.exports = SimPillbox
