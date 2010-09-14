###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{round, floor, sqrt
 cos, sin, PI}      = Math
WorldObject         = require './world_object'
{TILE_SIZE_WORLD}   = require './constants'
Explosion           = require './explosion'


# FIXME: Shells need an owner.

class Shell extends WorldObject
  charId: 'S'
  styled: false

  constructor: (sim, @x, @y, @direction, @lifespan) ->
    super
    # Default lifespan (fired by pillboxes) is 7 tiles.
    @lifespan ||= 7 * TILE_SIZE_WORLD / 32 - 2
    # Move a single step away from the owner.
    @move()

  serialization: (p) ->
    super
    @direction = p('B', @direction)
    @lifespan = p('H', @lifespan)

  # Get the 1/16th direction step.
  getDirection16th: -> round((@direction - 1) / 16) % 16

  # Get the tilemap index to draw. This is the index in base.png.
  getTile: ->
    tx = @getDirection16th()
    [tx, 4]

  # The following methods all update the simulation.

  update: ->
    @move()
    return if @collide()

    return unless @lifespan-- == 0
    @sim.destroy this
    @sim.spawn Explosion, @x, @y

  move: ->
    @radians ||= (256 - @direction) * 2 * PI / 256

    @x += round(cos(@radians) * 32)
    @y += round(sin(@radians) * 32)

    # Update the cell reference.
    @cell = @sim.map.cellAtWorld(@x, @y)

  collide: ->
    # FIXME: This code is a draft, take this out once it actually works.
    return no

    # Check for a collision with a pillbox.
    # FIXME: implement pillbox takeShellHit.
    if pill = @cell.pill
      pill.takeShellHit(this)
      @sim.destroy this
      @sim.spawn Explosion, (@cell.x + 0.5) * TILE_SIZE_WORLD, (@cell.y + 0.5) * TILE_SIZE_WORLD
      return yes

    # Check for collision with tanks.
    # FIXME: implement @owner.
    for tank in @sim.tanks when tank != @owner
      dx = tank.x - @x; dy = tank.y - @y
      distance = sqrt(dx*dx + dy*dy)
      if distance <= 127
        tank.takeShellHit(this)
        @sim.destroy this
        return yes

    # Check for collision with enemy base.
    # FIXME: implement @owner, @onBoat, base takeShellHit
    if base = @cell.base
      if @onBoat or (base.armour > 4 and base?.owner? and not base.owner.isAlly(@owner))
        base.takeShellHit(this)
        @sim.destroy this
        @sim.spawn Explosion, (@cell.x + 0.5) * TILE_SIZE_WORLD, (@cell.y + 0.5) * TILE_SIZE_WORLD
        return yes

    # FIXME: implement terrain collision

    return no

Shell.register()


# Exports.
module.exports = Shell
