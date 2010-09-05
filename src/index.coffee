###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

Tank = require './tank'
net  = require './net'


class Simulation
  constructor: (@map) ->
    @objects = []
    @tanks = []

  # Basic object management.

  tick: ->
    for obj in @objects
      obj.update()
    return

  spawn: (type, args...) ->
    obj = new type(this, args...)
    # Register it.
    obj.idx = @objects.length
    @objects.push obj
    # Notify networking.
    net.created obj
    # Return the new object.
    obj

  destroy: (obj) ->
    @objects.splice obj.idx, 1
    # Update the indices of everything that follows.
    for i in [obj.idx...@objects.length]
      @objects[i].idx--
    # Notify networking.
    net.destroyed obj
    # Return the same object.
    obj

  # Player management.

  addTank: ->
    tank = @spawn Tank
    tank.tank_idx = @tanks.length
    @tanks.push tank
    tank

  removeTank: (tank) ->
    @tanks.splice tank.tank_idx, 1
    @destroy tank


# Exports.
module.exports = Simulation
