# This module contains everything needed to read, manipulate and save the BMAP format for Bolo
# maps. It's the same format that's used by the original Bolo and WinBolo. This is one of the few
# modules that is useful on it's own.


{floor, min}     = Math
{MAP_SIZE_TILES} = require './constants'


# All the different terrain types we know about, indexed both by the numeric ID used in the
# binary BMAP format, as well as by ASCII code we use here in Orona.
TERRAIN_TYPES = [
  { ascii: '|', description: 'building'        }
  { ascii: ' ', description: 'river'           }
  { ascii: '~', description: 'swamp'           }
  { ascii: '%', description: 'crater'          }
  { ascii: '=', description: 'road'            }
  { ascii: '#', description: 'forest'          }
  { ascii: ':', description: 'rubble'          }
  { ascii: '.', description: 'grass'           }
  { ascii: '}', description: 'shot building'   }
  { ascii: 'b', description: 'river with boat' }
  { ascii: '^', description: 'deep sea'        }
]

createTerrainMap = ->
  for type in TERRAIN_TYPES
    TERRAIN_TYPES[type.ascii] = type

createTerrainMap()


#### Cell class

class MapCell
  constructor: (@map, @x, @y) ->
    @type = TERRAIN_TYPES['^']
    @mine = @isEdgeCell()

    # This is just a unique index for this cell; used in a couple of places for convenience.
    @idx = @y * MAP_SIZE_TILES + @x

  # Get the cell at offset +dx+,+dy+ from this cell.
  # Most commonly used to get one of the neighbouring cells.
  # Will return a dummy deep sea cell if the location is off the map.
  neigh: (dx, dy) ->
    @map.cellAtTile(@x + dx, @y + dy)

  # Check whether the cell is one of the give types.
  # The splat variant is significantly slower
  #isType: (types...) ->
  #  for type in types
  #    return yes if @type == type or @type.ascii == type
  #  no
  isType: ->
    for i in [0..arguments.length]
      type = arguments[i]
      return yes if @type == type or @type.ascii == type
    no

  isEdgeCell: ->
    @x <= 20 or @x >= 236 or @y <= 20 or @y >= 236

  getNumericType: ->
    return -1 if @type.ascii == '^'
    num = TERRAIN_TYPES.indexOf @type
    num += 8 if @mine
    num

  setType: (newType, mine, retileRadius) ->
    retileRadius ||= 1

    oldType = @type
    hadMine = @mine

    @mine = mine unless mine == undefined
    if typeof(newType) == 'string'
      @type = TERRAIN_TYPES[newType]
      if newType.length != 1 or not @type?
        throw "Invalid terrain type: #{newType}"
    else if typeof(newType) == 'number'
      if newType >= 10
        newType -= 8
        @mine = yes
      else
        @mine = no
      @type = TERRAIN_TYPES[newType]
      if not @type?
        throw "Invalid terrain type: #{newType}"
    else unless newType == null
      @type = newType

    @mine = yes if @isEdgeCell()

    @map.retile(
      @x - retileRadius, @y - retileRadius,
      @x + retileRadius, @y + retileRadius
    ) unless retileRadius < 0

  # Helper for retile methods. Short-hand for notifying the view of a retile.
  # Also takes care of drawing mines.
  setTile: (tx, ty) ->
    ty += 10 if @mine and not (@pill? or @base?)
    @map.view.onRetile this, tx, ty

  # Retile this cell. See map#retile.
  retile: ->
    if @pill?
      @setTile @pill.armour, 2
    else if @base?
      @setTile 16, 0
    else
      switch @type.ascii
        when '^' then @retileDeepSea()
        when '|' then @retileBuilding()
        when ' ' then @retileRiver()
        when '~' then @setTile 7, 1
        when '%' then @setTile 5, 1
        when '=' then @retileRoad()
        when '#' then @retileForest()
        when ':' then @setTile 4, 1
        when '.' then @setTile 2, 1
        when '}' then @setTile 8, 1
        when 'b' then @retileBoat()

  retileDeepSea: ->
    # We only care if our neighbours are deep sea, water or land.
    neighbourSignificance = (dx, dy) =>
      n = @neigh dx, dy
      return 'd' if n.isType('^')
      return 'w' if n.isType(' ', 'b')
      return 'l'

    above      = neighbourSignificance( 0, -1)
    aboveRight = neighbourSignificance( 1, -1)
    right      = neighbourSignificance( 1,  0)
    belowRight = neighbourSignificance( 1,  1)
    below      = neighbourSignificance( 0,  1)
    belowLeft  = neighbourSignificance(-1,  1)
    left       = neighbourSignificance(-1,  0)
    aboveLeft  = neighbourSignificance(-1, -1)

    if      aboveLeft  != 'd' and above != 'd' and left  != 'd' and right == 'd' and below == 'd' then @setTile 10, 3
    else if aboveRight != 'd' and above != 'd' and right != 'd' and left  == 'd' and below == 'd' then @setTile 11, 3
    else if belowRight != 'd' and below != 'd' and right != 'd' and left  == 'd' and above == 'd' then @setTile 13, 3
    else if belowLeft  != 'd' and below != 'd' and left  != 'd' and right == 'd' and above == 'd' then @setTile 12, 3

    else if left  == 'w' and right == 'd' then @setTile 14, 3
    else if below == 'w' and above == 'd' then @setTile 15, 3
    else if above == 'w' and below == 'd' then @setTile 16, 3
    else if right == 'w' and left  == 'd' then @setTile 17, 3

    else @setTile 0, 0

  retileBuilding: ->
    # We only care if our neighbours are buildings or not.
    neighbourSignificance = (dx, dy) =>
      n = @neigh dx, dy
      return 'b' if n.isType('|', '}')
      return 'o'

    above      = neighbourSignificance( 0, -1)
    aboveRight = neighbourSignificance( 1, -1)
    right      = neighbourSignificance( 1,  0)
    belowRight = neighbourSignificance( 1,  1)
    below      = neighbourSignificance( 0,  1)
    belowLeft  = neighbourSignificance(-1,  1)
    left       = neighbourSignificance(-1,  0)
    aboveLeft  = neighbourSignificance(-1, -1)

    if aboveLeft == 'b' and above == 'b' and aboveRight == 'b' and left == 'b' and right == 'b' and belowLeft == 'b' and below == 'b' and belowRight == 'b' then @setTile 17, 1
    else if right == 'b' and above == 'b' and below == 'b' and left == 'b' and aboveRight != 'b' and aboveLeft != 'b' and belowRight != 'b' and belowLeft != 'b' then @setTile 30, 1
    else if right == 'b' and above == 'b' and below == 'b' and left == 'b' and aboveRight != 'b' and aboveLeft != 'b' and belowRight != 'b' and belowLeft == 'b' then @setTile 22, 2
    else if right == 'b' and above == 'b' and below == 'b' and left == 'b' and aboveRight != 'b' and aboveLeft == 'b' and belowRight != 'b' and belowLeft != 'b' then @setTile 23, 2
    else if right == 'b' and above == 'b' and below == 'b' and left == 'b' and aboveRight != 'b' and aboveLeft != 'b' and belowRight == 'b' and belowLeft != 'b' then @setTile 24, 2
    else if right == 'b' and above == 'b' and below == 'b' and left == 'b' and aboveRight == 'b' and aboveLeft != 'b' and belowRight != 'b' and belowLeft != 'b' then @setTile 25, 2

    else if aboveLeft == 'b' and above == 'b' and left == 'b' and right == 'b' and belowLeft == 'b' and below == 'b' and belowRight == 'b' then @setTile 16, 2
    else if above == 'b' and aboveRight == 'b' and left == 'b' and right == 'b' and belowLeft == 'b' and below == 'b' and belowRight == 'b' then @setTile 17, 2
    else if aboveLeft == 'b' and above == 'b' and aboveRight == 'b' and left == 'b' and right == 'b' and belowLeft == 'b' and below == 'b' then @setTile 18, 2
    else if aboveLeft == 'b' and above == 'b' and aboveRight == 'b' and left == 'b' and right == 'b' and below == 'b' and belowRight == 'b' then @setTile 19, 2

    else if left == 'b' and right == 'b' and above == 'b' and below == 'b' and aboveRight == 'b' and belowLeft == 'b' and aboveLeft  != 'b' and belowRight != 'b' then @setTile 20, 2
    else if left == 'b' and right == 'b' and above == 'b' and below == 'b' and belowRight == 'b' and aboveLeft == 'b' and aboveRight != 'b' and belowLeft  != 'b' then @setTile 21, 2

    else if above == 'b' and left == 'b' and right == 'b' and below == 'b' and belowRight == 'b' and aboveRight == 'b' then @setTile 8, 2
    else if above == 'b' and left == 'b' and right == 'b' and below == 'b' and belowLeft  == 'b' and aboveLeft  == 'b' then @setTile 9, 2
    else if above == 'b' and left == 'b' and right == 'b' and below == 'b' and belowLeft  == 'b' and belowRight == 'b' then @setTile 10, 2
    else if above == 'b' and left == 'b' and right == 'b' and below == 'b' and aboveLeft  == 'b' and aboveRight == 'b' then @setTile 11, 2

    else if above == 'b' and below == 'b' and left  == 'b' and right      != 'b' and belowLeft  == 'b' and aboveLeft  != 'b' then @setTile 12, 2
    else if above == 'b' and below == 'b' and right == 'b' and belowRight == 'b' and left       != 'b' and aboveRight != 'b' then @setTile 13, 2
    else if above == 'b' and below == 'b' and right == 'b' and aboveRight == 'b' and belowRight != 'b' then @setTile 14, 2
    else if above == 'b' and below == 'b' and left  == 'b' and aboveLeft  == 'b' and belowLeft  != 'b' then @setTile 15, 2

    else if right == 'b' and above == 'b' and left  == 'b' and below      != 'b' and aboveLeft  != 'b' and aboveRight != 'b' then @setTile 26, 1
    else if right == 'b' and below == 'b' and left  == 'b' and belowLeft  != 'b' and belowRight != 'b' then @setTile 27, 1
    else if right == 'b' and above == 'b' and below == 'b' and aboveRight != 'b' and belowRight != 'b' then @setTile 28, 1
    else if below == 'b' and above == 'b' and left  == 'b' and aboveLeft  != 'b' and belowLeft  != 'b' then @setTile 29, 1

    else if left == 'b' and right == 'b' and above == 'b' and aboveRight == 'b' and aboveLeft  != 'b' then @setTile 4, 2
    else if left == 'b' and right == 'b' and above == 'b' and aboveLeft  == 'b' and aboveRight != 'b' then @setTile 5, 2
    else if left == 'b' and right == 'b' and below == 'b' and belowLeft  == 'b' and belowRight != 'b' then @setTile 6, 2
    else if left == 'b' and right == 'b' and below == 'b' and above      != 'b' and belowRight == 'b' and belowLeft != 'b' then @setTile 7, 2

    else if right == 'b' and above == 'b' and below == 'b' then @setTile 0, 2
    else if left  == 'b' and above == 'b' and below == 'b' then @setTile 1, 2
    else if right == 'b' and left  == 'b' and below == 'b' then @setTile 2, 2

    else if right == 'b' and above == 'b' and left == 'b' then @setTile 3, 2
    else if right == 'b' and below == 'b' and belowRight == 'b' then @setTile 18, 1
    else if left  == 'b' and below == 'b' and belowLeft  == 'b' then @setTile 19, 1
    else if right == 'b' and above == 'b' and aboveRight == 'b' then @setTile 20, 1
    else if left  == 'b' and above == 'b' and aboveLeft  == 'b' then @setTile 21, 1

    else if right == 'b' and below == 'b' then @setTile 22, 1
    else if left  == 'b' and below == 'b' then @setTile 23, 1
    else if right == 'b' and above == 'b' then @setTile 24, 1
    else if left  == 'b' and above == 'b' then @setTile 25, 1
    else if left  == 'b' and right == 'b' then @setTile 11, 1
    else if above == 'b' and below == 'b' then @setTile 12, 1

    else if right == 'b' then @setTile 13, 1
    else if left  == 'b' then @setTile 14, 1
    else if below == 'b' then @setTile 15, 1
    else if above == 'b' then @setTile 16, 1

    else @setTile 6, 1

  retileRiver: ->
    # We only care if our neighbours are road, water, or land.
    neighbourSignificance = (dx, dy) =>
      n = @neigh dx, dy
      return 'r' if n.isType('=')
      return 'w' if n.isType('^', ' ', 'b')
      return 'l'

    above = neighbourSignificance( 0, -1)
    right = neighbourSignificance( 1,  0)
    below = neighbourSignificance( 0,  1)
    left  = neighbourSignificance(-1,  0)

    if      above == 'l' and below == 'l' and right == 'l' and left == 'l' then @setTile 30, 2
    else if above == 'l' and below == 'l' and right == 'w' and left == 'l' then @setTile 26, 2
    else if above == 'l' and below == 'l' and right == 'l' and left == 'w' then @setTile 27, 2
    else if above == 'l' and below == 'w' and right == 'l' and left == 'l' then @setTile 28, 2
    else if above == 'w' and below == 'l' and right == 'l' and left == 'l' then @setTile 29, 2

    else if above == 'l' and left  == 'l' then @setTile 6, 3
    else if above == 'l' and right == 'l' then @setTile 7, 3
    else if below == 'l' and left  == 'l' then @setTile 8, 3
    else if below == 'l' and right == 'l' then @setTile 9, 3
    else if below == 'l' and above == 'l' and below == 'l' then @setTile 0, 3
    else if left  == 'l' and right == 'l' then @setTile 1, 3

    else if left  == 'l' then @setTile 2, 3
    else if below == 'l' then @setTile 3, 3
    else if right == 'l' then @setTile 4, 3
    else if above == 'l' then @setTile 5, 3

    else @setTile 1, 0

  retileRoad: ->
    # We only care if our neighbours are road, water, or land.
    neighbourSignificance = (dx, dy) =>
      n = @neigh dx, dy
      return 'r' if n.isType('=')
      return 'w' if n.isType('^', ' ', 'b')
      return 'l'

    above      = neighbourSignificance( 0, -1)
    aboveRight = neighbourSignificance( 1, -1)
    right      = neighbourSignificance( 1,  0)
    belowRight = neighbourSignificance( 1,  1)
    below      = neighbourSignificance( 0,  1)
    belowLeft  = neighbourSignificance(-1,  1)
    left       = neighbourSignificance(-1,  0)
    aboveLeft  = neighbourSignificance(-1, -1)

    if aboveLeft != 'r' and above == 'r' and aboveRight != 'r' and left == 'r' and right == 'r' and belowLeft != 'r' and below == 'r' and belowRight != 'r' then @setTile 11, 0

    else if above == 'r' and left  == 'r' and right == 'r' and below == 'r' then @setTile 10, 0
    else if left  == 'w' and right == 'w' and above == 'w' and below == 'w' then @setTile 26, 0
    else if right == 'r' and below == 'r' and left  == 'w' and above == 'w' then @setTile 20, 0
    else if left  == 'r' and below == 'r' and right == 'w' and above == 'w' then @setTile 21, 0
    else if above == 'r' and left  == 'r' and below == 'w' and right == 'w' then @setTile 22, 0
    else if right == 'r' and above == 'r' and left  == 'w' and below == 'w' then @setTile 23, 0

    else if above == 'w' and below == 'w' then @setTile 24, 0 # and (left == 'r' or right == 'r')
    else if left  == 'w' and right == 'w' then @setTile 25, 0 # and (above == 'r' or below == 'r')
    else if above == 'w' and below == 'r' then @setTile 16, 0
    else if right == 'w' and left  == 'r' then @setTile 17, 0
    else if below == 'w' and above == 'r' then @setTile 18, 0
    else if left  == 'w' and right == 'r' then @setTile 19, 0

    else if right == 'r' and below == 'r' and above == 'r' and (aboveRight == 'r' or belowRight == 'r') then @setTile 27, 0
    else if left  == 'r' and right == 'r' and below == 'r' and (belowLeft  == 'r' or belowRight == 'r') then @setTile 28, 0
    else if left  == 'r' and above == 'r' and below == 'r' and (belowLeft  == 'r' or aboveLeft  == 'r') then @setTile 29, 0
    else if left  == 'r' and right == 'r' and above == 'r' and (aboveRight == 'r' or aboveLeft  == 'r') then @setTile 30, 0

    else if left  == 'r' and right == 'r' and below == 'r' then @setTile 12, 0
    else if left  == 'r' and above == 'r' and below == 'r' then @setTile 13, 0
    else if left  == 'r' and right == 'r' and above == 'r' then @setTile 14, 0
    else if right == 'r' and above == 'r' and below == 'r' then @setTile 15, 0

    else if below == 'r' and right == 'r' and belowRight == 'r' then @setTile 6, 0
    else if below == 'r' and left  == 'r' and belowLeft  == 'r' then @setTile 7, 0
    else if above == 'r' and left  == 'r' and aboveLeft  == 'r' then @setTile 8, 0
    else if above == 'r' and right == 'r' and aboveRight == 'r' then @setTile 9, 0

    else if below == 'r' and right == 'r' then @setTile 2, 0
    else if below == 'r' and left  == 'r' then @setTile 3, 0
    else if above == 'r' and left  == 'r' then @setTile 4, 0
    else if above == 'r' and right == 'r' then @setTile 5, 0

    else if right == 'r' or left  == 'r' then @setTile 0, 1
    else if above == 'r' or below == 'r' then @setTile 1, 1

    else @setTile 10, 0

  retileForest: () ->
    # Check in which directions we have adjoining forest.
    above = @neigh( 0, -1).isType('#')
    right = @neigh( 1,  0).isType('#')
    below = @neigh( 0,  1).isType('#')
    left  = @neigh(-1,  0).isType('#')

    if      !above and !left and  right and  below then @setTile  9, 9
    else if !above and  left and !right and  below then @setTile 10, 9
    else if  above and  left and !right and !below then @setTile 11, 9
    else if  above and !left and  right and !below then @setTile 12, 9
    else if  above and !left and !right and !below then @setTile 16, 9
    else if !above and !left and !right and  below then @setTile 15, 9
    else if !above and  left and !right and !below then @setTile 14, 9
    else if !above and !left and  right and !below then @setTile 13, 9
    else if !above and !left and !right and !below then @setTile  8, 9
    else @setTile 3, 1

  retileBoat: ->
    # We only care if our neighbours are water or land.
    neighbourSignificance = (dx, dy) =>
      n = @neigh dx, dy
      return 'w' if n.isType('^', ' ', 'b')
      return 'l'

    above = neighbourSignificance( 0, -1)
    right = neighbourSignificance( 1,  0)
    below = neighbourSignificance( 0,  1)
    left  = neighbourSignificance(-1,  0)

    if      above != 'w' and left  != 'w' then @setTile 15, 6
    else if above != 'w' and right != 'w' then @setTile 16, 6
    else if below != 'w' and right != 'w' then @setTile 17, 6
    else if below != 'w' and left  != 'w' then @setTile 14, 6

    else if left  != 'w' then @setTile 12, 6
    else if right != 'w' then @setTile 13, 6
    else if below != 'w' then @setTile 10, 6

    else @setTile 11, 6


#### View class

# This is an interface for map views. Map views are responsible for actually displaying the map on
# the screen. This class also functions as the do-nothing dummy implementation. You need not
# inherit from this class, just make sure whatever view object you use responds to the methods
# declared here.
class MapView
  # Called every time a tile changes, with the tile reference and the new tile coordinates to use.
  # This is also called on Map#setView, once for every tile.
  onRetile: (cell, tx, ty) ->


#### Map objects

# The following are interfaces and dummy default implementations of map objects. If a subclass
# of `Map` wishes to use different classes for map objects, it simply needs to define new classes
# with similar constructors and exposing the same attributes.

class MapObject
  constructor: (@map) -> @cell = @map.cells[@y][@x]

class Pillbox extends MapObject
  constructor: (map, @x, @y, @owner_idx, @armour, @speed) -> super

class Base extends MapObject
  constructor: (map, @x, @y, @owner_idx, @armour, @shells, @mines) -> super

class Start extends MapObject
  constructor: (map, @x, @y, @direction) -> super


#### Map class

class Map
  CellClass: MapCell
  PillboxClass: Pillbox
  BaseClass: Base
  StartClass: Start

  # Initialize the map array.
  constructor: ->
    @view = new MapView()

    @pills = []
    @bases = []
    @starts = []

    @cells = new Array(MAP_SIZE_TILES)
    for y in [0...MAP_SIZE_TILES]
      row = @cells[y] = new Array(MAP_SIZE_TILES)
      for x in [0...MAP_SIZE_TILES]
        row[x] = new @CellClass(this, x, y)

  setView: (@view) ->
    @retile()

  # Get the cell at the given tile coordinates, or return a dummy cell.
  cellAtTile: (x, y) ->
    if cell = @cells[y]?[x] then cell
    else new @CellClass(this, x, y, isDummy: yes)

  # Iterate over the map cells, either the complete map or a specific area.
  # The callback function will have each cell available as +this+.
  each: (cb, sx, sy, ex, ey) ->
    sx = 0                  unless sx? and sx >= 0
    sy = 0                  unless sy? and sy >= 0
    ex = MAP_SIZE_TILES - 1 unless ex? and ex < MAP_SIZE_TILES
    ey = MAP_SIZE_TILES - 1 unless ey? and ey < MAP_SIZE_TILES

    for y in [sy..ey]
      row = @cells[y]
      for x in [sx..ex]
        cb row[x]

    return this

  # Clear the map, or a specific area, by filling it with deep sea tiles.
  # Note: this will not do any retiling!
  clear: (sx, sy, ex, ey) ->
    @each (cell) ->
      cell.type = TERRAIN_TYPES['^']
      cell.mine = cell.isEdgeCell()
    , sx, sy, ex, ey

  # Recalculate the tile cache for each cell, or for a specific area.
  retile: (sx, sy, ex, ey) ->
    @each (cell) ->
      cell.retile()
    , sx, sy, ex, ey

  #### Saving and loading

  # Dump the map to an array of octets in BMAP format.
  dump: (options) ->
    options ||= {}

    # Private helper for collecting consecutive cells of the same type.
    consecutiveCells = (row, cb) ->
      currentType = null
      startx = null
      count = 0
      for cell, x in row
        num = cell.getNumericType()

        if currentType == num
          count++
          continue

        cb(currentType, count, startx) if currentType?

        currentType = num
        startx = x
        count = 1

      cb(currentType, count, startx) if currentType?
      return

    # Private helper for encoding an array of nibbles to an array of octets.
    encodeNibbles = (nibbles) ->
      octets = []
      val = null
      for nibble, i in nibbles
        nibble = nibble & 0x0F
        if i % 2 == 0
          val = nibble << 4
        else
          octets.push(val + nibble)
          val = null
      octets.push val if val?
      octets

    # Process options.
    pills =  if options.noPills  then [] else @pills
    bases =  if options.noBases  then [] else @bases
    starts = if options.noStarts then [] else @starts

    # Build the header.
    data = c.charCodeAt(0) for c in 'BMAPBOLO'
    data.push(1, pills.length, bases.length, starts.length)
    data.push(p.x, p.y, p.owner_idx, p.armour, p.speed) for p in pills
    data.push(b.x, b.y, b.owner_idx, b.armour, b.shells, b.mines) for b in bases
    data.push(s.x, s.y, s.direction) for s in starts

    # While building the map data, we collect sequences and runs.
    # What follows are helpers to deal with flushing these two arrays to data.
    run = seq = sx = ex = y = null

    # Flush the current run, and push it to data.
    flushRun = ->
      return unless run?

      flushSequence()

      octets = encodeNibbles(run)
      data.push(octets.length + 4, y, sx, ex)
      data = data.concat(octets)

      run = null

    # Ensure there's enough space in the run, or start a new one.
    ensureRunSpace = (numNibbles) ->
      return unless (255 - 4) * 2 - run.length < numNibbles
      flushRun()

      run = []
      sx = ex

    # Flush the current sequence, and push it to the run.
    flushSequence = ->
      return unless seq?

      # Prevent infinite recursion.
      localSeq = seq
      seq = null

      ensureRunSpace(localSeq.length + 1)
      run.push(localSeq.length - 1)
      run = run.concat(localSeq)
      ex += localSeq.length

    # Build the runs of map data.
    for row in @cells
      y = row[0].y
      run = sx = ex = seq = null
      consecutiveCells row, (type, count, x) ->
        # Deep sea cells are simply omitted in the map data.
        if type == -1
          flushRun()  # The previous run ends here.
          return

        # Create the new run of we're at the start.
        unless run?
          run = []
          sx = ex = x

        # Add a long sequence if we have 3 or more of the same type in a row.
        if count > 2
          # Flush existing short sequence.
          flushSequence()
          # Add long sequences until count is exhausted.
          # Because the size is a nibble, we can only encode sequences of 2..9.
          while count > 2
            ensureRunSpace(2)
            seqLen = min(count, 9)
            run.push(seqLen + 6, type)
            ex += seqLen
            count -= seqLen
          # Fall-through, the remaining count may allow for a short sequence.

        while count > 0
          # Add the short sequence.
          seq = [] unless seq?
          seq.push(type)
          # Flush if we run out of space.
          flushSequence() if seq.length == 8
          count--

    # Flush any remaining stuff.
    flushRun()

    # The sentinel.
    data.push(4, 0xFF, 0xFF, 0xFF)

    data

  # Load a map from +buffer+. The buffer is treated as an array of numbers
  # representing octets. So a node.js Buffer will work.
  @load: (buffer) ->
    # Helper for reading slices out of the buffer.
    filePos = 0
    readBytes = (num, msg) ->
      sub = try
        # FIXME: This is lame, but ensures we're not dealing with a Buffer object.
        # The only reason for that is because we can't pass a Buffer as a splat.
        x for x in buffer.slice(filePos, filePos + num)
      catch e
        throw msg
      filePos += num
      sub

    # Read the header.
    magic = readBytes(8, "Not a Bolo map.")
    for c, i in 'BMAPBOLO'
      throw "Not a Bolo map." unless c.charCodeAt(0) == magic[i]
    [version, numPills, numBases, numStarts] = readBytes(4, "Incomplete header")
    throw "Unsupported map version: #{version}" unless version == 1

    # Allocate the map.
    map = new this()

    # Read the map objects.
    pillsData  = readBytes(5, "Incomplete pillbox data")      for i in [0...numPills]
    basesData  = readBytes(6, "Incomplete base data")         for i in [0...numBases]
    startsData = readBytes(3, "Incomplete player start data") for i in [0...numStarts]

    # Read map data.
    loop
      [dataLen, y, sx, ex] = readBytes(4, "Incomplete map data")
      dataLen -= 4
      break if dataLen == 0 and y == 0xFF and sx == 0xFF and ex == 0xFF

      run = readBytes(dataLen, "Incomplete map data")
      runPos = 0
      takeNibble = ->
        index = floor(runPos)
        nibble = if index == runPos
          (run[index] & 0xF0) >> 4
        else
          (run[index] & 0x0F)
        runPos += 0.5
        nibble

      x = sx
      while x < ex
        seqLen = takeNibble()
        if seqLen < 8
          for i in [1..seqLen+1]
            map.cellAtTile(x++, y).setType takeNibble(), undefined, -1
        else
          type = takeNibble()
          for i in [1..seqLen-6]
            map.cellAtTile(x++, y).setType type, undefined, -1

    # Instantiate the map objects. Late, so they can do postprocessing on the map.
    map.pills  = new map.PillboxClass(map, args...) for args in pillsData
    map.bases  = new    map.BaseClass(map, args...) for args in basesData
    map.starts = new   map.StartClass(map, args...) for args in startsData

    map

  @extended: (child) ->
    child.load = @load unless child.load


#### Exports
exports.TERRAIN_TYPES = TERRAIN_TYPES
exports.MapView = MapView
exports.Map = Map
