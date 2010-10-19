{floor}    = Math
BoloObject = require '../object'


class Builder extends BoloObject

  states:
    inTank:       0
    waiting:      1
    returning:    2
    parachuting:  3

    actions:
      _min:       10
      forest:     10
      road:       11
      repair:     12
      boat:       13
      building:   14
      pillbox:    15
      mine:       16

  styled: yes

  serialization: (isCreate, p) ->
    if isCreate
      p 'O', 'owner'

    p 'B', 'order'
    if @order == @states.inTank
      @x = @y = null
    else
      p 'H', 'x'
      p 'H', 'y'

  getTile: ->
    if @order == @states.parachuting then [16, 1]
    else [17, floor(@animation / 3)]

  performOrder: (action, trees, cell) ->
    return if @order != @states.inTank
    # FIXME


  #### World updates

  spawn: (owner) ->
    @ref 'owner', owner
    @order = @states.inTank

  anySpawn: ->
    @team = @owner.$.team
    @animation = 0

  update: ->
    @animation = (@animation + 1) % 9


## Exports
module.exports = Builder
