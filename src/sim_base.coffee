# The pillbox is a map object, and thus a slightly special case of world object.

WorldObject = require './world_object'


class SimBase
  charId: 'b'

  # Save our attributes when constructed on the authority, and override the cell's type.
  constructor: (map, @x, @y, @owner_idx, @armour, @shells, @mines) ->
    map.cellAtTile(@x, @y).setType '=', no, -1

  # Still on the authority, receive our simulation reference.
  postMapObjectInitialize: (@sim) ->

  # After initialization on client and server set-up the cell reference.
  postInitialize: ->
    @cell = @sim.map.cellAtTile(@x, @y)
    @cell.base = this

  # Keep our non-synchronized attributes up-to-date on the client.
  postNetUpdate: ->
    @owner_idx = if @owner then @owner.tank_idx else 255
    # FIXME: retile when owner changes.
    @cell.retile()

  # The state information to synchronize.
  serialization: (isCreate, p) ->
    if isCreate
      @x = p('B', @x)
      @y = p('B', @y)

    @owner = p('T', @owner)
    @armour = p('B', @armour)
    @shells = p('B', @shells)
    @mines = p('B', @mines)

WorldObject.register SimBase


#### Exports
module.exports = SimBase
