###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# The server networking context. It records changes in the object list, the critical updates, and
# makes them available in the 'changes' attribute. It also provides a method 'dump' that provides
# the attribute updates.
class ServerContext
  constructor: (@game) ->

  # Clear the list of changes.
  activated: ->
    @changes = []

  # Record the creation.
  created: (obj) ->
    # FIXME: add to changes

  # Record the destruction.
  destroyed: (obj) ->
    # FIXME: add to changes

  # Record the map change.
  mapChanged: (cell, oldType, hadMine) ->
    # FIXME: add to changes

  # This method is specific to the server. It serializes all objects and concatenates the
  # updates into one large data block to be sent to the clients.
  dump: ->
    # FIXME
    []


# Exports
module.exports = ServerContext
