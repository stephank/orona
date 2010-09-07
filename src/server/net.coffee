###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

net    = require '../net'
{pack} = require '../struct'


# The server networking context. It records changes in the object list, the critical updates, and
# makes them available in the 'changes' attribute. It also provides a method 'dump' that provides
# the attribute updates.
class ServerContext
  constructor: (@sim) ->

  # The server context is a simulation authority.
  authority: yes

  # Clear the list of changes.
  activated: ->
    @changes = []

  # Record the creation.
  created: (obj) ->
    @changes = @changes
      .concat pack('BB', net.CREATE_MESSAGE, obj._net_identifier)
      .concat obj.serialize()

  # Record the destruction.
  destroyed: (obj) ->
    @changes = @changes.concat pack('BI', net.DESTROY_MESSAGE, obj.idx)

  # Record the map change.
  mapChanged: (cell, oldType, hadMine) ->
    @changes = @changes.concat(pack('BBBBf', net.MAPCHANGE_MESSAGE,
      cell.x, cell.y, cell.type.ascii.charCodeAt(0), cell.mine
    ))

  # This method is specific to the server. It serializes all objects and concatenates the
  # updates into one large data block to be sent to the clients.
  dump: ->
    data = [net.UPDATE_MESSAGE]
    for obj in @sim.objects
      data = data.concat obj.serialize()
    data


# Exports
module.exports = ServerContext
