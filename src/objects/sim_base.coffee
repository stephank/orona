# The pillbox is a map object, and thus a slightly special case of world object.

WorldObject = require '../world_object'


class SimBase extends WorldObject
  charId: 'b'

  # This is a MapObject; it is constructed differently on the authority.
  constructor: (map, @x, @y, @owner_idx, @armour, @shells, @mines) ->
    if arguments.length == 1
      super
    else
      super(null)

      # Override the cell's type.
      map.cellAtTile(@x, @y).setType '=', no, -1

    # After initialization on client and server set-up the cell reference.
    @on 'anySpawn', =>
      @cell = @sim.map.cellAtTile(@x, @y)
      @cell.base = this

    # Keep our non-synchronized attributes up-to-date on the client.
    @on 'netUpdate', (changes) =>
      if changes.hasOwnProperty('owner')
        @owner_idx = if @owner then @owner.tank_idx else 255
        @cell.retile()

  # The state information to synchronize.
  serialization: (isCreate, p) ->
    if isCreate
      p 'B', 'x'
      p 'B', 'y'

    p 'T', 'owner'
    p 'B', 'armour'
    p 'B', 'shells'
    p 'B', 'mines'

  takeShellHit: (shell) ->
    # FIXME: do something to armour and shells

SimBase.register()


#### Exports
module.exports = SimBase
