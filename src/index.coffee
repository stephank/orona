###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

Tank = require './tank'


class Simulation
  constructor: (@map) ->
    @tanks = []

  tick: ->
    tank.update() for tank in @tanks
    return

  addTank: ->
    tank = new Tank(this, @map.getRandomStart())
    @tanks.push tank
    tank

  removeTank: (tank) ->
    idx = @tanks.indexOf(tank)
    throw new Error "Tried to remove unknown tank from game." if idx == -1
    @tanks.splice(idx, 1)
    tank


# Exports.
module.exports = Simulation
