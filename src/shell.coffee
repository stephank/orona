###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{round, floor,
 cos, sin, PI}    = Math
net               = require './net'
{TILE_SIZE_WORLD} = require './constants'
{pack, unpack}    = require './struct'
Explosion         = require './explosion'


# FIXME: Shells need an owner.

class Shell
  constructor: (@sim, @x, @y, @direction, @lifespan) ->
    # Default lifespan (fired by pillboxes) is 7 tiles.
    @lifespan ||= 7 * TILE_SIZE_WORLD / 32 - 2
    # Precalculate direction in radians
    @radians = (256 - @direction) * 2 * PI / 256
    # Move a single step away from the owner.
    @move()

  destroy: ->

  initFromNetwork: (@sim, data, offset) ->
    bytes = @deserialize(data, offset)
    @radians = (256 - @direction) * 2 * PI / 256
    bytes

  destroyFromNetwork: ->

  serialize: ->
    pack 'HHBH', @x, @y, @direction, @lifespan

  deserialize: (data, offset) ->
    [@x, @y, @direction, @lifespan] = unpack 'HHBH', data, offset
    return 7

  # Get the 1/16th direction step.
  getDirection16th: -> round((@direction - 1) / 16) % 16

  update: ->
    @move()

    # FIXME: check collision

    return unless @lifespan-- == 0
    @sim.destroy this
    @sim.spawn Explosion, @x, @y

  move: ->
    @x += round(cos(@radians) * 32)
    @y += round(sin(@radians) * 32)

  # The tile index to draw.
  getTile: ->
    tx = @getDirection16th()
    [tx, 4]


# Networking.
net.registerType 'S', Shell

# Exports.
module.exports = Shell
