###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{round, ceil, min,
 max, sin, cos, PI} = Math
{TILE_SIZE_WORLD}   = require './constants'
net                 = require './net'
{pack, unpack}      = require './struct'


class Tank
  constructor: (@game, startingPos) ->
    @x = (startingPos.x + 0.5) * TILE_SIZE_WORLD
    @y = (startingPos.y + 0.5) * TILE_SIZE_WORLD
    @direction = startingPos.direction * 16

    @cell = @game.map.cells[startingPos.y][startingPos.x]

    @speed = 0.00
    @accelerating = no
    @braking = no

    @turningClockwise = no
    @turningCounterClockwise = no
    @turnSpeedup = 0

    # FIXME: gametype dependant.
    @shells = 40
    @mines = 0
    @armour = 40
    @trees = 0

    @reload = 0
    @shooting = no

    @onBoat = yes

  # The alternate constructor used by networking.
  constructFromNetwork: (@game) ->
    return this

  # These methods are used by networking to synchronize state.
  serialize: ->
    speed = round(@speed * 4)
    pack 'HHBBBBBBBBffffff', @x, @y, @direction, speed, @turnSpeedup, @shells, @mines, @armour,
      @trees, @reload, @accelerating, @braking, @turningClockwise, @turningCounterClockwise,
      @shooting, @onBoat

  deserialize: (data, offset) ->
    [@x, @y, @direction, speed, @turnSpeedup, @shells, @mines, @armour,
      @trees, @reload, @accelerating, @braking, @turningClockwise, @turningCounterClockwise,
      @shooting, @onBoat] = unpack 'HHBBBBBBBBffffff', data, offset
    @speed = speed / 4
    @cell = @game.map.cellAtWorld @x, @y
    # We ate 13 bytes.
    13


  getDirection16th: ->
    round((@direction - 1) / 16) % 16

  getTile: ->
    tx = @getDirection16th()

    ty = 12
    # FIXME: allegiance
    ty += 1 if @onBoat

    [tx, ty]

  update: ->
    @shootOrReload()
    @turn()
    @accelerate()
    # FIXME: check if the terrain is clear, or if someone built underneath us.
    @move() if @speed > 0
    # FIXME: check for mine impact
    # FIXME: Reveal hidden mines nearby

  shootOrReload: ->
    @reload-- if @reload > 0
    return unless @shooting and @reload == 0 and @shells > 0
    # We're clear to fire a shot.

    @reload = 13
    @shells--
    # FIXME: fire a projectile, play a sound.

  turn: ->
    # Determine turn rate.
    maxTurn = @cell.getTankTurn @onBoat

    # Are the key presses cancelling eachother out?
    if @turningClockwise == @turningCounterClockwise
      @turnSpeedup = 0
      return

    # Determine angular acceleration, and apply speed-up.
    if @turningCounterClockwise
      acceleration = maxTurn
      if @turnSpeedup < 10 then acceleration /= 2
      if @turnSpeedup < 0 then @turnSpeedup = 0
      @turnSpeedup++
    else # if @turningClockwise
      acceleration = -maxTurn
      if @turnSpeedup > -10 then acceleration /= 2
      if @turnSpeedup > 0 then @turnSpeedup = 0
      @turnSpeedup--

    # Turn the tank.
    @direction += acceleration
    # Normalize direction.
    @direction += 256 while @direction < 0
    @direction %= 256 if @direction >= 256

  accelerate: ->
    # Determine acceleration.
    maxSpeed = @cell.getTankSpeed @onBoat
    # Is terrain forcing us to slow down?
    if @speed > maxSpeed then acceleration = -0.25
    # Are key presses cancelling eachother out?
    else if @accelerating == @braking then acceleration = 0.00
    # What's does the player want to do?
    else if @accelerating then acceleration = 0.25
    else acceleration = -0.25 # if @breaking
    # Adjust speed, and clip as necessary.
    if acceleration > 0.00 and @speed < maxSpeed
      @speed = min(maxSpeed, @speed + acceleration)
    else if acceleration < 0.00 and @speed > 0.00
      @speed = max(0.00, @speed + acceleration)

  move: ->
    # FIXME: UGLY, and probably incorrect too.
    rad = (256 - @getDirection16th() * 16) * 2 * PI / 256
    newx = @x + (dx = round(cos(rad) * ceil(@speed)))
    newy = @y + (dy = round(sin(rad) * ceil(@speed)))

    slowDown = yes

    # Check if we're running into an obstacle in either axis direction.
    unless dx == 0
      aheadx = if dx > 0 then newx + 64 else newx - 64
      aheadx = @game.map.cellAtWorld(aheadx, newy)
      unless aheadx.getTankSpeed(@onBoat) == 0
        slowDown = no
        @x = newx unless @onBoat and !aheadx.isType(' ', '^') and @speed < 16

    unless dy == 0
      aheady = if dy > 0 then newy + 64 else newy - 64
      aheady = @game.map.cellAtWorld(newx, aheady)
      unless aheady.getTankSpeed(@onBoat) == 0
        slowDown = no
        @y = newy unless @onBoat and !aheady.isType(' ', '^') and @speed < 16

    # If we're completely obstructed, reduce our speed.
    if slowDown
      @speed = max(0.00, @speed - 1)

    # Update the cell reference.
    oldcell = @cell
    @cell = @game.map.cellAtWorld(@x, @y)

    # Check if we just entered or left the water.
    if @onBoat
      @leaveBoat(oldcell) unless @cell.isType(' ', '^')
    else
      @enterBoat() if @cell.isType('b')

  leaveBoat: (oldcell) ->
    # Check if we're running over another boat; destroy it if so.
    if @cell.isType('b')
      # Don't need to retile surrounding cells for this.
      @cell.setType(' ', no, 0)
      # FIXME: create a small explosion, play a sound.
    else
      # Leave a boat if we were on a river.
      if oldcell.isType(' ')
        # Don't need to retile surrounding cells for this.
        oldcell.setType('b', no, 0)
      @onBoat = no

  enterBoat: ->
    # Don't need to retile surrounding cells for this.
    @cell.setType(' ', no, 0)
    @onBoat = yes


# Networking.
net.registerType 'T', Tank

# Exports.
module.exports = Tank
