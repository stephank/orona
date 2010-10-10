# A fireball is the trail of fire left by a dying tank.

{round, cos,
 sin, PI}         = Math
{TILE_SIZE_WORLD} = require '../constants'
sounds            = require '../sounds'
BoloObject        = require '../object'
Explosion         = require './explosion'


class Fireball extends BoloObject

  styled: null

  serialization: (isCreate, p) ->
    if isCreate
      p 'B', 'direction'
      p 'f', 'largeExplosion'

    p 'H', 'x'
    p 'H', 'y'
    p 'B', 'lifespan'

  # Get the 1/16th direction step.
  getDirection16th: -> round((@direction - 1) / 16) % 16

  #### World updates

  spawn: (@x, @y, @direction, @largeExplosion) ->
    @lifespan = 80

  update: ->
    if @lifespan-- % 2 == 0
      return if @wreck()
      @move()
    if @lifespan == 0
      @explode()
      @world.destroy(this)

  wreck: ->
    @world.spawn Explosion, @x, @y
    cell = @world.map.cellAtWorld(@x, @y)
    if cell.isType '^'
      @world.destroy(this)
      @soundEffect sounds.TANK_SINKING
      return true
    else if cell.isType 'b'
      cell.setType ' '
      @soundEffect sounds.SHOT_BUILDING
    else if cell.isType '#'
      cell.setType '.'
      @soundEffect sounds.SHOT_TREE
    false

  move: ->
    unless @dx?
      radians = (256 - @direction) * 2 * PI / 256
      @dx = round(cos(radians) * 48)
      @dy = round(sin(radians) * 48)

    {dx, dy} = this
    newx = @x + dx
    newy = @y + dy

    unless dx == 0
      ahead = if dx > 0 then newx + 24 else newx - 24
      ahead = @world.map.cellAtWorld(ahead, newy)
      @x = newx unless ahead.isObstacle()

    unless dy == 0
      ahead = if dy > 0 then newy + 24 else newy - 24
      ahead = @world.map.cellAtWorld(newx, ahead)
      @y = newy unless ahead.isObstacle()

  explode: ->
    cell = @world.map.cellAtWorld(@x, @y)

    if @largeExplosion
      dx = if @dx > 0 then 1 else -1
      dy = if @dy > 0 then 1 else -1
      for c in [cell.neigh(dx, 0), cell.neigh(0, dy), cell.neigh(dx, dy)]
        [x, y] = c.getWorldCoordinates()
        @world.spawn Explosion, x, y
        c.takeExplosionHit()
      @soundEffect sounds.BIG_EXPLOSION
    else
      @soundEffect sounds.MINE_EXPLOSION

    [x, y] = cell.getWorldCoordinates()
    @world.spawn Explosion, x, y
    cell.takeExplosionHit()


#### Exports
module.exports = Fireball
