# The pillbox is a map object, and thus a slightly special case of world object.

{max}       = Math
WorldObject = require '../world_object'


class SimPillbox extends WorldObject
  charId: 'p'

  # This is a MapObject; it is constructed differently.
  constructor: (map, @x, @y, @owner_idx, @armour, @speed) ->
    if arguments.length == 1
      super
    else
      super(null)

    # The Simulation is passed to us by `spawnMapObjects`.
    @on 'simCreate', (@sim) =>

    # After initialization on client and server set-up the cell reference.
    @on 'create', =>
      @updateCell()

    # Keep our non-synchronized attributes up-to-date on the client.
    @on 'netUpdate', (changes) =>
      if changes.hasOwnProperty('x') or changes.hasOwnProperty('y')
        @updateCell()
      if changes.hasOwnProperty('owner')
        @owner_idx = if @owner then @owner.tank_idx else 255
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
    p 'B', 'armour'
    p 'B', 'speed'

  update: ->
    return if @armour == 0
    # FIXME: swat at the annoying flies

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
