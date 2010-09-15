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

  constructor: (sim, @owner, options) ->
    super
    options ||= {}
    # Default direction is the owner's.
    @direction = options.direction || @owner.direction
    # Default lifespan (fired by pillboxes) is 7 tiles.
    @lifespan = options.lifespan || (7 * TILE_SIZE_WORLD / 32 - 2)
    # Default for onWater (fired by pillboxes) is no.
    @onWater = options.onWater || no
    # Start the owner's location, and move one step away.
    @x = @owner.x; @y = @owner.y
    @move()

  serialization: (p) ->
    super
    @direction = p('B', @direction)
    @owner     = p('O', @owner)
    @lifespan  = p('B', @lifespan)
    @onWater   = p('f', @onWater)

  # Helper, called in several places that change shell position.
  updateCell: ->
    @cell = @sim.map.cellAtWorld @x, @y

  # Track position updates.
  postNetUpdate: ->
    @updateCell()

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
    @updateCell()

  collide: ->
    # Check for a collision with a pillbox.
    if pill = @cell.pill
      # FIXME: implement pillbox takeShellHit.
      #pill.takeShellHit(this)
      @sim.spawn Explosion, (@cell.x + 0.5) * TILE_SIZE_WORLD, (@cell.y + 0.5) * TILE_SIZE_WORLD
      # FIXME: play sound.
      @sim.destroy this
      return yes

    # Check for collision with tanks.
    for tank in @sim.tanks when tank != @owner
      dx = tank.x - @x; dy = tank.y - @y
      distance = sqrt(dx*dx + dy*dy)
      if distance <= 127
        tank.takeShellHit(this)
        # FIXME: play sound.
        @sim.destroy this
        return yes

    # Check for collision with enemy base.
    if base = @cell.base
      if @onWater or (base.armour > 4 and base?.owner? and not base.owner.isAlly(@owner))
        # FIXME: implement base takeShellHit.
        #base.takeShellHit(this)
        @sim.spawn Explosion, (@cell.x + 0.5) * TILE_SIZE_WORLD, (@cell.y + 0.5) * TILE_SIZE_WORLD
        # FIXME: play sound.
        @sim.destroy this
        return yes

    # Check for terrain collision
    terrainCollision =
      if @onWater
        not @cell.isType('^', ' ', '%')
      else
        @cell.isType('|', '}', '#', 'b')
    if terrainCollision
      # FIXME: implement cell takeShellHit.
      #@cell.takeShellHit()
      @sim.spawn Explosion, (@cell.x + 0.5) * TILE_SIZE_WORLD, (@cell.y + 0.5) * TILE_SIZE_WORLD
      # FIXME: play sound.
      @sim.destroy this

    return no

Shell.register()


# Exports.
module.exports = Shell
