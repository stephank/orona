###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{round, random, floor} = Math
{TILE_SIZE_WORLD,
 TILE_SIZE_PIXEL,
 MAP_SIZE_TILES}       = require './constants'


# All the different terrain types we know about.
terrainTypes = {}
for type in [
  { ascii: '^', tankSpeed:  3, tankTurn: 0.50, manSpeed:  0, description: 'deep sea'        }
  { ascii: '|', tankSpeed:  0, tankTurn: 0.00, manSpeed:  0, description: 'building'        }
  { ascii: ' ', tankSpeed:  3, tankTurn: 0.25, manSpeed:  0, description: 'river'           }
  { ascii: '~', tankSpeed:  3, tankTurn: 0.25, manSpeed:  4, description: 'swamp'           }
  { ascii: '%', tankSpeed:  3, tankTurn: 0.25, manSpeed:  4, description: 'crater'          }
  { ascii: '=', tankSpeed: 16, tankTurn: 1.00, manSpeed: 16, description: 'road'            }
  { ascii: '#', tankSpeed:  6, tankTurn: 0.50, manSpeed:  8, description: 'forest'          }
  { ascii: ':', tankSpeed:  3, tankTurn: 0.25, manSpeed:  4, description: 'rubble'          }
  { ascii: '.', tankSpeed: 12, tankTurn: 1.00, manSpeed: 16, description: 'grass'           }
  { ascii: '}', tankSpeed:  0, tankTurn: 0.00, manSpeed:  0, description: 'shot building'   }
  { ascii: 'b', tankSpeed: 16, tankTurn: 1.00, manSpeed: 16, description: 'river with boat' }
]
  terrainTypes[type.ascii] = type


# A class to represent a cell on the map.
class MapCell
  constructor: (@map, @x, @y) ->
    @type = terrainTypes['^']
    @mine = no

  getTankSpeed: (onBoat) ->
    return  0 if @pill?.armour > 0
    # FIXME: check for an enemy base, otherwise fall through. The tile is road any way.
    return 16 if onBoat and @isType('^', ' ')
    @type.tankSpeed

  getTankTurn: (onBoat) ->
    return 0.00 if @pill?.armour > 0
    # FIXME: check for an enemy base, otherwise fall through. The tile is road any way.
    return 1.00 if onBoat and @isType('^', ' ')
    @type.tankTurn

  getManSpeed: (onBoat) ->
    return  0 if @pill?.armour > 0
    # FIXME: check for an enemy base, otherwise fall through. The tile is road any way.
    return 16 if onBoat and @isType('^', ' ')
    @type.manSpeed

  # Get the cell at offset +dx+,+dy+ from this cell.
  # Most commonly used to get one of the neighbouring cells.
  # Will return a dummy deep sea cell if the location is off the map.
  neigh: (dx, dy) ->
    @map.cellAtTile(@x + dx, @y + dy)

  # Check whether the cell is one of the give types.
  # FIXME: The splat variant is significantly slower
  #isType: (types...) ->
  #  for type in types
  #    return yes if @type == type or @type.ascii == type
  #  no
  isType: ->
    for i in [0..arguments.length]
      type = arguments[i]
      return yes if @type == type or @type.ascii == type
    no

  setType: (newType, @mine, retileRadius) ->
    @mine ||= no
    retileRadius ||= 1

    if typeof(newType) == 'string'
      @type = terrainTypes[newType]
      if newType.length != 1 or not @type?
        throw "Invalid terrain type: #{newType}"
    else
      @type = newType

    @map.retile(
      @x - retileRadius, @y - retileRadius,
      @x + retileRadius, @y + retileRadius
    )

  # Short-hand for notifying the view of a retile.
  setTile: (tx, ty) ->
    @map.view.onRetile this, tx, ty

  # Retile this cell. See map#retile.
  retile: ->
    if @pill?
      # FIXME: allegiance
      @setTile @pill.armour, 4
    else if @base?
      # FIXME: allegiance
      @setTile 16, 4
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
      # FIXME: draw mine

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


# This is an interface for map views. Map views are responsible for actually
# displaying the map on the screen. This class also functions as the
# do-nothing dummy implementation. You need not inherit from this class, just
# make sure whatever view object you use responds to the methods declared here.
class MapView
  # Called every time a tile changes, with the tile reference and the new
  # tile coordinates to use. This is also called on map load, once for every tile.
  onRetile: (cell, tx, ty) ->
    # Default is to do nothing.


# This class holds a complete map.
class Map
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
        row[x] = new MapCell(this, x, y)

  getRandomStart: ->
    @starts[round(random() * (@starts.length - 1))]

  # Get the cell at the given tile coordinates, or return a dummy cell.
  cellAtTile: (x, y) ->
    if cell = @cells[y]?[x] then cell
    else new MapCell(x, y)

  # Get the cell at the given pixel coordinates, or return a dummy cell.
  cellAtPixel: (x, y) ->
    @cellAtTile floor(x / TILE_SIZE_PIXEL), floor(y / TILE_SIZE_PIXEL)

  # Get the cell at the given world coordinates, or return a dummy cell.
  cellAtWorld: (x, y) ->
    @cellAtTile floor(x / TILE_SIZE_WORLD), floor(y / TILE_SIZE_WORLD)

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
      cell.type = terrainTypes['^']
      cell.mine = no
    , sx, sy, ex, ey

  # Recalculate the tile cache for each cell, or for a specific area.
  retile: (sx, sy, ex, ey) ->
    @each (cell) ->
      cell.retile()
    , sx, sy, ex, ey

  # Load the map from the string in +data+.
  load: (data) ->
    @clear()

    # Determine which kind of newline we're dealing with.
    i = data.indexOf '\n'
    throw 'Not a Bolo map.' if i < 19
    newline = if data.charAt(i - 1) == '\r' then '\r\n' else '\n'

    # Read the version line.
    lines = data.split(newline)
    throw 'Not a Bolo map.' if lines[0] != 'Bolo map, version 0'
    throw 'Not a Bolo map.' if lines[1] != ''

    # Iteration helpers
    line = lines[i = 2]
    eachInSection = (section, cb) ->
      throw 'Corrupt map.' if line != (section + ':')
      line = lines[++i]
      until line == ''
        throw 'Corrupt map.' if line.substr(0, 2) != '  '
        cb line.substr(2)
        line = lines[++i]
      line = lines[++i]

    # Read the various sections on map attributes.
    @pills = []
    re = /^@(\d+),(\d+)\s+owner:(\d+)\s+armour:(\d+)\s+speed:(\d+)$/
    eachInSection 'Pillboxes', (pillDesc) =>
      throw 'Corrupt map.' unless matches = re.exec(pillDesc)
      # FIXME: check input
      @pills.push(
        x:      parseInt matches[1]
        y:      parseInt matches[2]
        owner:  parseInt matches[3]
        armour: parseInt matches[4]
        speed:  parseInt matches[5]
      )

    @bases = []
    re = /^@(\d+),(\d+)\s+owner:(\d+)\s+armour:(\d+)\s+shells:(\d+)\s+mines:(\d+)$/
    eachInSection 'Bases', (baseDesc) =>
      throw 'Corrupt map.' unless matches = re.exec(baseDesc)
      # FIXME: check input
      @bases.push(
        x:      parseInt matches[1]
        y:      parseInt matches[2]
        owner:  parseInt matches[3]
        armour: parseInt matches[4]
        shells: parseInt matches[5]
        mines:  parseInt matches[6]
      )

    @starts = []
    re = /^@(\d+),(\d+)\s+direction:(\d+)$/
    eachInSection 'Starting positions', (startDesc) =>
      throw 'Corrupt map.' unless matches = re.exec(startDesc)
      # FIXME: check input
      @starts.push(
        x:         parseInt matches[1]
        y:         parseInt matches[2]
        direction: parseInt matches[3]
      )

    # Process the terrain.
    for y in [0...MAP_SIZE_TILES]
      line = lines[i + y]
      row = @cells[y]
      for x in [0...MAP_SIZE_TILES]
        cell = row[x]
        # FIXME: check input
        unless cell.type = terrainTypes[line.charAt(x * 2)]
          throw 'Corrupt map, invalid terrain type: ' + line.charAt(x * 2)
        # FIXME: check if the specific terrain can even have a mine
        cell.mine = yes if line.charAt(x * 2 + 1) == '*'

    # Link pills and bases to their cells.
    for pill in @pills
      pill.cell = @cells[pill.y][pill.x]
      pill.cell.pill = pill
    for base in @bases
      base.cell = @cells[base.y][base.x]
      base.cell.base = base
      # Override cell type.
      base.cell.type = terrainTypes['=']
      base.cell.mine = no

    # Recalculate tiles.
    @retile()


# Exports.
exports.terrainTypes = terrainTypes
exports.MapCell = MapCell
exports.MapView = MapView
exports.Map = Map
