# A fireball is the trail of fire left by a dying tank.


{round, cos,
 sin, PI}         = Math
{TILE_SIZE_WORLD} = require '../constants'
WorldObject       = require '../world_object'
Explosion         = require './explosion'


class Fireball extends WorldObject
  charId: 'F'
  styled: null

  constructor: ->
    super

    @on 'simCreate', (@x, @y, @direction, @largeExplosion) =>
      @lifespan = 80

  serialization: (isCreate, p) ->
    if isCreate
      @direction = p('B', @direction)
      @largeExplosion = p('f', @largeExplosion)

    @x = p('H', @x)
    @y = p('H', @y)
    @lifespan = p('B', @lifespan)

  # Get the 1/16th direction step.
  getDirection16th: -> round((@direction - 1) / 16) % 16

  update: ->
    if @lifespan-- % 2 == 0
      return if @wreck()
      @move()
    if @lifespan == 0
      @explode()
      @sim.destroy(this)

  wreck: ->
    @sim.spawn Explosion, @x, @y
    cell = @sim.map.cellAtWorld(@x, @y)
    # FIXME: Play sound for each of these.
    if cell.isType '^'
      @sim.destroy(this)
      return true
    else if cell.isType 'b'
      cell.setType ' '
    else if cell.isType '#'
      cell.setType '.'
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
      ahead = @sim.map.cellAtWorld(ahead, newy)
      @x = newx unless ahead.isObstacle()

    unless dy == 0
      ahead = if dy > 0 then newy + 24 else newy - 24
      ahead = @sim.map.cellAtWorld(newx, ahead)
      @y = newy unless ahead.isObstacle()

  explode: ->
    cell = @sim.map.cellAtWorld(@x, @y)

    if @largeExplosion
      dx = if @dx > 0 then 1 else -1
      dy = if @dy > 0 then 1 else -1
      for c in [cell.neigh(dx, 0), cell.neigh(0, dy), cell.neigh(dx, dy)]
        [x, y] = c.getWorldCoordinates()
        @sim.spawn Explosion, x, y
        c.takeExplosionHit()

    # FIXME: Play sound.

    [x, y] = cell.getWorldCoordinates()
    @sim.spawn Explosion, x, y
    cell.takeExplosionHit()

Fireball.register()


#### Exports
module.exports = Fireball
