###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# The client networking context. It does it's best to keep the object list in sync with the server,
# while allowing the local simulation to continue. This is done by keeping track of changes made
# locally and marking them as transient, until the next server update.
class ClientContext
  constructor: (@game) ->
    @transientMapCells = {}
    @transientDestructions = []

  # Before calling 'inContext', the user should reset this special property, based on whether it
  # is about the process server updates or process a simulated tick. When set, the context will
  # assume updates are received from the server. When not set, updates are transient.
  authoritative: no

  # The client implementation of activated cleans up any transients
  # when new updates from the server arrive.
  activated: ->
    return unless @authoritative

    # Find the first object that is marked transient.
    for obj, i in @game.objects
      break if obj._net_transient
    # We can assume all objects after this are transient as well.
    @game.objects.splice i, @game.objects.length - i

    # Now, restore locally changed map cells.
    for idx, cell of transientMapCells
      cell.setType cell._net_oldType, cell._net_hadMine
    @transientMapCells = {}

    # And revive destroyed objects in reverse order.
    return unless @transientDestructions.length > 0
    for obj in @transientDestructions
      @game.objects.splice obj.idx, 0, obj
    @transientDestructions = []

    # At this point, we need to reset all indices.
    for obj, i in @game.objects
      obj.idx = i

    return

  # Mark the object as transient if needed, so we can delete it on the next server update.
  created: (obj) ->
    obj._net_transient = not @authoritative

  # Keep track of map changes that we made locally. We only remember the last state of a cell
  # that the server told us about, so we can restore it to that state before processing
  # server updates.
  mapChanged: (cell, oldType, hadMine) ->
    unless @authoritative or @transientMapCells[cell.idx]?
      cell._net_oldType = oldType
      cell._net_hadMine = hadMine
      @transientMapCells[cell.idx] = cell
    return

  # We need to keep track of objects that are deleted locally, but managed by the server.
  # So if this is not a server update, and not a locally created object either, add it to a list
  # of things to restore later on.
  destroyed: (obj) ->
    unless @authoritative or obj._net_transient
      @transientDestructions.unshift obj
    return


# Exports
module.exports = ClientContext
