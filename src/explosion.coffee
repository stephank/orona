# An explosion is really just a static animation.


{floor}        = Math
WorldObject    = require './world_object'


class Explosion
  charId: 'E'
  styled: false

  constructor: (@sim, @x, @y) ->
    @lifespan = 23

  serialization: (isCreate, p) ->
    # These are only set once.
    if isCreate
      @x = p('H', @x)
      @y = p('H', @y)

    @lifespan = p('B', @lifespan)

  update: ->
    if @lifespan-- == 0
      @sim.destroy(this)

  getTile: ->
    switch floor(@lifespan / 3)
      when 7 then [20, 3]
      when 6 then [21, 3]
      when 5 then [20, 4]
      when 4 then [21, 4]
      when 3 then [20, 5]
      when 2 then [21, 5]
      when 1 then [18, 4]
      else [19, 4]

WorldObject.register Explosion


#### Exports
module.exports = Explosion
