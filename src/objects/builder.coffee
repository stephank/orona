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
      p 'B', 'trees'
      p 'f', 'hasMine'
    if @order == @states.parachuting or @order > @states.actions._min
      p 'H', 'targetX'
      p 'H', 'targetY'

  getTile: ->
    if @order == @states.parachuting then [16, 1]
    else [17, floor(@animation / 3)]

  performOrder: (action, trees, cell) ->
    return if @order != @states.inTank
    return unless @states.actions.hasOwnProperty(action)
    return if @owner.$.trees < trees
    return if action == 'mine' and @owner.$.mines == 0

    @order = @states.actions[action]
    if action == 'mine'
      @owner.$.mines -= 1;     @hasMine = yes; @trees = 0
    else
      @owner.$.trees -= trees; @hasMine = no;  @trees = trees
    [@targetX, @targetY] = cell.getWorldCoordinates()

    @x = @owner.$.x; @y = @owner.$.y

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
