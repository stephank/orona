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
      p 'O', 'pillbox'
      p 'f', 'hasMine'
    if @order == @states.waiting
      p 'B', 'waitTimer'
    else if @order == @states.parachuting or @order > @states.actions._min
      p 'H', 'targetX'
      p 'H', 'targetY'

  getTile: ->
    if @order == @states.parachuting then [16, 1]
    else [17, floor(@animation / 3)]

  performOrder: (action, trees, cell) ->
    return if @order != @states.inTank
    pill = null
    if action == 'mine'
      return if @owner.$.mines == 0
      trees = 0
    else
      return if @owner.$.trees < trees
      if action == 'pillbox'
        return unless pill = @owner.$.getCarryingPillboxes().pop()
        pill.inTank = no; pill.carried = yes

    @trees = trees
    @hasMine = (action == 'mine')
    @ref 'pillbox', pill
    @owner.$.mines-- if @hasMine
    @owner.$.trees -= trees

    @order = @states.actions[action]
    @x = @owner.$.x; @y = @owner.$.y
    [@targetX, @targetY] = cell.getWorldCoordinates()


  #### World updates

  spawn: (owner) ->
    @ref 'owner', owner
    @order = @states.inTank

  anySpawn: ->
    @team = @owner.$.team
    @animation = 0

  update: ->
    return if @order == @states.inTank
    @animation = (@animation + 1) % 9

    switch @order
      when @states.waiting
        if @waitTimer-- == 0 then @order = @states.returning
      when @states.returning
        @move(@owner.$.x, @owner.$.y) unless @owner.$.armour == 255
      else
        @move(@targetX,   @targetY)

  move: (x, y) ->
    # FIXME

## Exports
module.exports = Builder
