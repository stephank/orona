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
      cell = @sim.map.cellAtWorld(@x, @y)
      x = cell.x * TILE_SIZE_WORLD; y = cell.y * TILE_SIZE_WORLD
      # FIXME: Large explosion, if @largeExplosion.
      # FIXME: Play sound.
      @sim.spawn Explosion, x, y
      cell.setType '%' unless cell.isType ' ', '^'
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
    @radians ||= (256 - @direction) * 2 * PI / 256
    newx = @x + (dx = round(cos(@radians) * 48))
    newy = @y + (dy = round(sin(@radians) * 48))

    unless dx == 0
      ahead = if dx > 0 then newx + 24 else newx - 24
      ahead = @sim.map.cellAtWorld(ahead, newy)
      @x = newx unless ahead.isObstacle()

    unless dy == 0
      ahead = if dy > 0 then newy + 24 else newy - 24
      ahead = @sim.map.cellAtWorld(newx, ahead)
      @y = newy unless ahead.isObstacle()

Fireball.register()


#### Exports
module.exports = Fireball
