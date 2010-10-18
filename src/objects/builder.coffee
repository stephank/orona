{floor}    = Math
BoloObject = require '../object'


ORDER_INTANK    = 0
ORDER_RETURN    = 1
ORDER_PARACHUTE = 2


class Builder extends BoloObject

  styled: yes

  serialization: (isCreate, p) ->
    if isCreate
      p 'O', 'owner'

    p 'B', 'order'
    if @order == ORDER_INTANK
      @x = @y = null
    else
      p 'H', 'x'
      p 'H', 'y'

  getTile: ->
    if @order == ORDER_PARACHUTE then [16, 1]
    else [17, floor(@animation / 3)]

  performOrder: (action, trees, cell) ->
    # FIXME


  #### World updates

  spawn: (owner) ->
    @ref 'owner', owner
    @order = ORDER_INTANK

  anySpawn: ->
    @team = @owner.$.team
    @animation = 0

  update: ->
    @animation = (@animation + 1) % 9


## Exports
module.exports = Builder
