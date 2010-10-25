BoloObject = require '../object'


## Flood fill

# An invisible object, which implements the slow but sure flooding when a crater or new tile of
# river is created.

class FloodFill extends BoloObject

  styled: null

  serialization: (isCreate, p) ->
    if isCreate
      p 'H', 'x'
      p 'H', 'y'

    p 'B', 'lifespan'

  #### World updates

  spawn: (cell) ->
    [@x, @y] = cell.getWorldCoordinates()
    @lifespan = 16

  anySpawn: ->
    @cell = @world.map.cellAtWorld(@x, @y)
    @neighbours = [@cell.neigh(1, 0), @cell.neigh(0, 1), @cell.neigh(-1, 0), @cell.neigh(0, -1)]

  update: ->
    if @lifespan-- == 0
      @flood()
      @world.destroy(this)

  canGetWet: ->
    result = no
    for n in @neighbours
      if not (n.base or n.pill) and n.isType(' ', '^', 'b')
        result = yes
        break
    return result

  flood: ->
    if @canGetWet()
      @cell.setType ' ', no
      @spread()

  spread: ->
    for n in @neighbours
      if not (n.base or n.pill) and n.isType('%')
        @world.spawn FloodFill, n
    return


## Exports
module.exports = FloodFill
