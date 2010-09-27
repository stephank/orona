# This module extends the classes defined in the `map` module, and provides the logic, data and
# hooks that are needed for a game to be simulated on a map.


{round, random,
 floor}              = Math
{TILE_SIZE_WORLD,
 TILE_SIZE_PIXELS}   = require './constants'
{Map, TERRAIN_TYPES} = require './map'
net                  = require './net'
WorldObject          = require './world_object'
SimPillbox           = require './objects/sim_pillbox'
SimBase              = require './objects/sim_base'


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
  constructor: (map, x, y) ->
    super
    @life = 0

  isObstacle: -> @pill?.armour > 0 or @type.tankSpeed == 0

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
    [oldType, hadMine, oldLife] = [@type, @mine, @life]
    super
    @life = switch @type.ascii
      when '.' then 5
      when '}' then 5
      when ':' then 5
      when '~' then 4
      else 0
    net.mapChanged this, oldType, hadMine, oldLife

  takeShellHit: (shell) ->
    # FIXME: check for a mine
    sfx = 'shot_building'
    if @isType '.', '}', ':', '~'
      if --@life == 0
        nextType = switch @type.ascii
          when '.' then '~'
          when '}' then ':'
          when ':' then ' '
          when '~' then ' '
        @setType nextType
      else
        net.mapChanged this, @type, @mine
    else if @isType '#'
      @setType '.'
      sfx = 'shot_tree'
    else if @isType '='
      neigh =
        if      shell.direction >= 224  or shell.direction <  32 then @neigh( 1,  0)
        else if shell.direction >=  32 and shell.direction <  96 then @neigh( 0, -1)
        else if shell.direction >=  96 and shell.direction < 160 then @neigh(-1,  0)
        else @neigh(0, 1)
      @setType(' ') if neigh.isType(' ', '^')
    else
      nextType = switch @type.ascii
        when '|' then '}'
        when 'b' then ' '
      @setType nextType
    sfx


#### Map objects

# The interface for map objects, which is a spceial case of a WorldObject. Map objects are tracked
# as regular objects for network synchronization. The difference with regular objects is mostly in
# the constructor and the extra `postMapObjectInitialize` method. They are also not drawn like
# regular objects, but drawn as part of the map.
#
# The constructor is special because these objects are now actually `spawn`'d, but instead are
# created during map load, at which point the simulation is not yet available. The solution is the
# extra method `postMapObjectInitialize` which receives the simulation reference.

class SimMapObject
  postMapObjectInitialize: (sim) ->


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
exports.SimMapObject = SimMapObject
exports.SimMap = SimMap
