# This module extends the classes defined in the `map` module, and provides the logic, data and
# hooks that are needed for a game to be simulated on a map.


{round, random,
 floor}              = Math
{TILE_SIZE_WORLD,
 TILE_SIZE_PIXELS}   = require './constants'
{Map, TERRAIN_TYPES} = require './map'
net                  = require './net'
WorldObject          = require './world_object'


# Extend `TERRAIN_TYPES` with additional attributes that matter to the simulation.

TERRAIN_TYPE_ATTRIBUTES =
  '|': { tankSpeed:  0, tankTurn: 0.00, manSpeed:  0 }
  ' ': { tankSpeed:  3, tankTurn: 0.25, manSpeed:  0 }
  '~': { tankSpeed:  3, tankTurn: 0.25, manSpeed:  4 }
  '%': { tankSpeed:  3, tankTurn: 0.25, manSpeed:  4 }
  '=': { tankSpeed: 16, tankTurn: 1.00, manSpeed: 16 }
  '#': { tankSpeed:  6, tankTurn: 0.50, manSpeed:  8 }
  ':': { tankSpeed:  3, tankTurn: 0.25, manSpeed:  4 }
  '.': { tankSpeed: 12, tankTurn: 1.00, manSpeed: 16 }
  '}': { tankSpeed:  0, tankTurn: 0.00, manSpeed:  0 }
  'b': { tankSpeed: 16, tankTurn: 1.00, manSpeed: 16 }
  '^': { tankSpeed:  3, tankTurn: 0.50, manSpeed:  0 }

extendTerrainMap = ->
  for ascii, attributes of TERRAIN_TYPE_ATTRIBUTES
    type = TERRAIN_TYPES[ascii]
    for key, value of attributes
      type[key] = value

extendTerrainMap()


#### Cell class

class SimMapCell extends Map::CellClass
  getTankSpeed: (tank) ->
    # Check for a pillbox.
    return 0 if @pill?.armour > 0
    # Check for an enemy base.
    if @base?.owner?
      return 0 unless @base.owner == tank or tank.isAlly(@base.owner) or @base.armour <= 9
    # Check if we're on a boat.
    return 16 if tank.onBoat and @isType('^', ' ')
    # Take the land speed.
    @type.tankSpeed

  getTankTurn: (tank) ->
    # Check for a pillbox.
    return 0.00 if @pill?.armour > 0
    # Check for an enemy base.
    if @base?.owner?
      return 0.00 unless @base.owner == tank or tank.isAlly(@base.owner) or @base.armour <= 9
    # Check if we're on a boat.
    return 1.00 if tank.onBoat and @isType('^', ' ')
    # Take the land turn speed.
    @type.tankTurn

  getManSpeed: (man) ->
    {tank} = man
    # Check for a pillbox.
    return 0 if @pill?.armour > 0
    # Check for an enemy base.
    if @base?.owner?
      return 0 unless @base.owner == tank or tank.isAlly(@base.owner) or @base.armour <= 9
    # Check if we're on a boat.
    return 16 if man.onBoat and @isType('^', ' ')
    # Take the land speed.
    @type.manSpeed

  setType: (newType, mine, retileRadius) ->
    oldType = @type; hadMine = @mine
    super
    net.mapChanged this, oldType, hadMine


#### Map objects

# These implement the interface of each kind of map object, and also implement WorldObject. The
# latter is so that we may synchronize their state across the network. Drawing is not done like
# a WorldObject however, but it done in the map drawing code.
#
# Constructors are also a special case. These objects are now actually `spawn`'d, but instead are
# created during map load, at which point the simulation is not yet available. The solution is a
# special method `postMapObjectInitialize` which receives the simulation reference.


class SimMapObject
  postMapObjectInitialize: (sim) ->


class SimPillbox
  charId: 'p'

  # Save our attributes when constructed on the authority.
  constructor: (map, @x, @y, @owner_idx, @armour, @speed) ->

  # Still on the authority, receive our simulation reference.
  postMapObjectInitialize: (@sim) ->

  # After initialization on client and server set-up the cell reference.
  postInitialize: ->
    @updateCell()

  # Keep our non-synchronized attributes up-to-date on the client.
  postNetUpdate: ->
    @updateCell()
    # FIXME: retile when owner changes.
    @owner_idx = if @owner then @owner.tank_idx else 255

  # Helper that updates the cell reference, and ensures a back-reference as well.
  updateCell: ->
    newCell = @sim.map.cellAtTile(@x, @y)
    return if @cell == newCell

    delete @cell.pill if @cell
    @cell = newCell
    @cell.pill = this
    @cell.retile()

  # The state information to synchronize.
  serialization: (isCreate, p) ->
    @x = p('B', @x)
    @y = p('B', @y)

    @owner = p('T', @owner)
    @armour = p('B', @armour)
    @speed = p('B', @speed)

WorldObject.register SimPillbox


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


#### Map class

class SimMap extends Map
  CellClass: SimMapCell
  PillboxClass: SimPillbox
  BaseClass: SimBase

  # Get the cell at the given pixel coordinates, or return a dummy cell.
  cellAtPixel: (x, y) ->
    @cellAtTile floor(x / TILE_SIZE_PIXELS), floor(y / TILE_SIZE_PIXELS)

  # Get the cell at the given world coordinates, or return a dummy cell.
  cellAtWorld: (x, y) ->
    @cellAtTile floor(x / TILE_SIZE_WORLD), floor(y / TILE_SIZE_WORLD)

  getRandomStart: ->
    @starts[round(random() * (@starts.length - 1))]


#### Exports
exports.SimulationMap = SimMap
