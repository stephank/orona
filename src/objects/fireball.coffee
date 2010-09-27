# A fireball is the trail of fire left by a dying tank.


{round, cos,
 sin, PI}    = Math
WorldObject  = require '../world_object'
Explosion    = require './explosion'


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
      # FIXME: Create the actual explosion, play sound.
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
    # FIXME: check for collision.
    @x += round(cos(@radians) * 48)
    @y += round(sin(@radians) * 48)

Fireball.register()


#### Exports
module.exports = Fireball
