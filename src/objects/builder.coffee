{round, floor, ceil, min, cos, sin, sqrt, atan2} = Math
BoloObject    = require '../object'
sounds        = require '../sounds'
MineExplosion = require './mine_explosion'


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
      p 'H', 'targetX'
      p 'H', 'targetY'
      p 'B', 'trees'
      p 'O', 'pillbox'
      p 'f', 'hasMine'
    if @order == @states.waiting
      p 'B', 'waitTimer'

  getTile: ->
    if @order == @states.parachuting then [16, 1]
    else [17, floor(@animation / 3)]

  performOrder: (action, trees, cell) ->
    return if @order != @states.inTank
    return unless @owner.$.onBoat or @owner.$.cell == cell or @owner.$.cell.getManSpeed(this) > 0
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
    # Get our speed, and keep in mind special places a builder can move to.
    speed = @cell.getManSpeed(this)
    onBoat = no
    targetCell = @world.map.cellAtWorld(@targetX, @targetY)
    if @cell == targetCell
      speed = 16
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
    # Builder has returned to tank. Jump into the tank, and return resources.
    if @order == @states.returning
      @order = @states.inTank
      @x = @y = null

      if @pillbox
        @pillbox.$.inTank = yes; @pillbox.$.carried = no
        @ref 'pillbox', null
      @owner.$.trees = min(40, @owner.$.trees + @trees)
      @trees = 0
      @owner.$.mines = min(40, @owner.$.mines + 1) if @hasMine
      @hasMine = no
      return

    # Is the builder trying to build on a mine? Yowch!
    if @cell.mine
      @world.spawn MineExplosion, @cell
      @order = @states.waiting
      @waitTimer = 20
      return

    # Otherwise, build.
    # FIXME: possibly merge these checks with `checkBuildOrder`.
    switch @order
      when @states.actions.forest
        break if @cell.base or @cell.pill or not @cell.isType('#')
        @cell.setType '.'; @trees = 4
        @soundEffect sounds.FARMING_TREE
      when @states.actions.road
        break if @cell.base or @cell.pill or @cell.isType('|', '}', 'b', '^', '#', '=')
        break if @cell.isType(' ') and @cell.hasTankOnBoat()
        @cell.setType '='; @trees = 0
        @soundEffect sounds.MAN_BUILDING
      when @states.actions.repair
        if @cell.pill
          used = @cell.pill.repair(@trees); @trees -= used
        else if @cell.isType('}')
          @cell.setType '|'; @trees = 0
        else
          break
        @soundEffect sounds.MAN_BUILDING
      when @states.actions.boat
        break unless @cell.isType(' ') and not @cell.hasTankOnBoat()
        @cell.setType 'b'; @trees = 0
        @soundEffect sounds.MAN_BUILDING
      when @states.actions.building
        break if @cell.base or @cell.pill or @cell.isType('b', '^', '#', '}', '|', ' ')
        @cell.setType '|'; @trees = 0
        @soundEffect sounds.MAN_BUILDING
      when @states.actions.pillbox
        break if @cell.pill or @cell.base or @cell.isType('b', '^', '#', '|', '}', ' ')
        @pillbox.$.armour = 15; @trees = 0
        @pillbox.$.placeAt(@cell); @ref 'pillbox', null
        @soundEffect sounds.MAN_BUILDING
      when @states.actions.mine
        break if @cell.base or @cell.pill or @cell.isType('^', ' ', '|', 'b', '}')
        @cell.setType null, yes, 0; @hasMine = no
        @soundEffect sounds.MAN_LAY_MINE

    # Short pause while/after we build.
    @order = @states.waiting
    @waitTimer = 20


## Exports
module.exports = Builder
