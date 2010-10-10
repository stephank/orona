# The pillbox is a map object, and thus a slightly special case of world object.

{min, max}        = Math
{TILE_SIZE_WORLD} = require '../constants'
BoloObject        = require '../object'


class WorldBase extends BoloObject

  # This is a MapObject; it is constructed differently on the server.
  constructor: (world_or_map, x, y, @owner_idx, @armour, @shells, @mines) ->
    if arguments.length == 1
      @world = world_or_map
    else
      @x = (x + 0.5) * TILE_SIZE_WORLD; @y = (y + 0.5) * TILE_SIZE_WORLD
      # Override the cell's type.
      world_or_map.cellAtTile(x, y).setType '=', no, -1

    # Keep track of owner changes.
    @on 'netUpdate', (changes) =>
      if changes.hasOwnProperty('owner')
        @updateOwner()

  # The state information to synchronize.
  serialization: (isCreate, p) ->
    if isCreate
      p 'H', 'x'
      p 'H', 'y'

    p 'O', 'owner'
    p 'O', 'refueling'
    if @refueling
      p 'B', 'refuelCounter'
    p 'B', 'armour'
    p 'B', 'shells'
    p 'B', 'mines'

  # Helper for common stuff to do when the owner changes.
  updateOwner: ->
    @owner_idx = if @owner then @owner.$.tank_idx else 255
    @cell.retile()

  #### World updates

  anySpawn: ->
    @cell = @world.map.cellAtWorld(@x, @y)
    @cell.base = this

  update: ->
    if @refueling and (@refueling.$.cell != @cell or @refueling.$.armour == 255)
      @ref('refueling', null)

    return @findSubject() unless @refueling
    return unless --@refuelCounter == 0
    # We're clear to transfer some resources to the tank.

    if @armour > 0 and @refueling.$.armour < 40
      amount = min(5, @armour, 40 - @refueling.$.armour)
      @refueling.$.armour += amount
      @armour -= amount
      @refuelCounter = 46
    else if @shells > 0 and @refueling.$.shells < 40
      @refueling.$.shells += 1
      @shells -= 1
      @refuelCounter = 7
    else if @mines > 0 and @refueling.$.mines < 40
      @refueling.$.mines += 1
      @mines -= 1
      @refuelCounter = 7
    else
      @refuelCounter = 1

  # Look for someone to refuel, and check if he's claiming us too. Be careful to prevent rapid
  # reclaiming if two tanks are on the same tile.
  findSubject: ->
    tanks = tank for tank in @world.tanks when tank.armour != 255 and tank.cell == @cell
    for tank in tanks
      if @owner?.$.isAlly(tank)
        @ref 'refueling', tank
        @refuelCounter = 46
        break
      else
        canClaim = yes
        for other in tanks when other != tank
          canClaim = no unless tank.isAlly(other)
        if canClaim
          @ref('owner', tank); @updateOwner()
          @owner.on 'destroy', => @ref('owner', null); @updateOwner()
          @ref 'refueling', tank
          @refuelCounter = 46
          break
    return

  takeShellHit: (shell) ->
    @armour = max(0, @armour - 5)
    sounds.SHOT_BUILDING


#### Exports
module.exports = WorldBase
