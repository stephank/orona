{round, floor, ceil, min, cos, sin, sqrt, atan2} = Math
BoloObject = require '../object'
sounds     = require '../sounds'


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

  # Builders are only ever spawned and destroyed on the server.
  constructor: (@world) ->
    # Track position updates.
    @on 'netUpdate', (changes) =>
      if changes.hasOwnProperty('x') or changes.hasOwnProperty('y')
        @updateCell()

  # Helper, called in several places that change builder position.
  updateCell: ->
    @cell =
      if @x? and @y?
        @world.map.cellAtWorld @x, @y
      else
        null

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
    @updateCell()


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
        @move(@owner.$.x, @owner.$.y, 128, 160) unless @owner.$.armour == 255
      else
        @move(@targetX,   @targetY,    16, 144)

  move: (targetX, targetY, targetRadius, boatRadius) ->
    # Get our speed, and see if we're on our owner's boat.
    speed = @cell.getManSpeed(this)
    onBoat = no
    if @owner.$.armour != 255 and @owner.$.onBoat
      ownerDx = @owner.$.x - @x; ownerDy = @owner.$.y - @y
      ownerDistance = sqrt(ownerDx*ownerDx + ownerDy*ownerDy)
      if ownerDistance < boatRadius
        onBoat = yes
        speed = 16

    # Determine how far to move.
    targetDx = targetX - @x; targetDy = targetY - @y
    targetDistance = sqrt(targetDx*targetDx + targetDy*targetDy)
    speed = min(speed, targetDistance)
    rad = atan2(targetDy, targetDx)
    newx = @x + (dx = round(cos(rad) * ceil(speed)))
    newy = @y + (dy = round(sin(rad) * ceil(speed)))

    # Check if we're running into an obstacle in either axis direction.
    movementAxes = 0
    targetCell = @world.map.cellAtWorld(targetX, targetY)
    unless dx == 0
      ahead = @world.map.cellAtWorld(newx, @y)
      if onBoat or ahead == targetCell or ahead.getManSpeed(this) > 0
        @x = newx; movementAxes++
    unless dy == 0
      ahead = @world.map.cellAtWorld(@x, newy)
      if onBoat or ahead == targetCell or ahead.getManSpeed(this) > 0
        @y = newy; movementAxes++

    # Are we there yet?
    if movementAxes == 0
      @order = @states.returning
    else
      @updateCell()
      targetDx = targetX - @x; targetDy = targetY - @y
      targetDistance = sqrt(targetDx*targetDx + targetDy*targetDy)
      @reached() if targetDistance <= targetRadius

  reached: ->
    if @order == @states.returning
      @order = @states.inTank
      @x = @y = null
      return

    switch @order
      when @states.actions.forest
        break if @cell.base or @cell.pill or not @cell.isType('#')
        @cell.setType '.'
        @trees = 4
        @soundEffect sounds.FARMING_TREE
      # FIXME

    @order = @states.waiting
    @waitTimer = 20


## Exports
module.exports = Builder
