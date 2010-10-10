# An explosion is really just a static animation.

{floor}    = Math
BoloObject = require '../object'


class Explosion extends BoloObject

  styled: false

  serialization: (isCreate, p) ->
    if isCreate
      p 'H', 'x'
      p 'H', 'y'

    p 'B', 'lifespan'

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

  #### World updates

  spawn: (@x, @y) ->
    @lifespan = 23

  update: ->
    if @lifespan-- == 0
      @world.destroy(this)


#### Exports
module.exports = Explosion
