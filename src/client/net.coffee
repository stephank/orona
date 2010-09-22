# The client networking context. It does it's best to keep the object list in sync with the server,
# while allowing the local simulation to continue. This is done by keeping track of changes made
# locally and marking them as transient, until the next server update.


class ClientContext
  constructor: (@sim) ->
    @transientMapCells = {}
    @transientChanges = []

  # The client context is no simulation authority.
  authority: no

  # Before calling 'inContext', the user should reset this special property, based on whether it
  # is about the process server updates or process a simulated tick. When set, the context will
  # assume updates are received from the server. When not set, updates are transient.
  authoritative: no

  # The client implementation of activated cleans up any transients
  # when new updates from the server arrive.
  activated: ->
    return unless @authoritative

    # Restore locally changed map cells.
    for idx, cell of @transientMapCells
      cell.setType cell._net_oldType, cell._net_hadMine
      cell.life = cell._net_oldLife
    @transientMapCells = {}

    # Undo transient changes reverse order.
    return unless @transientChanges.length > 0
    for [type, idx, obj] in @transientChanges
      switch type
        when 'C' then @sim.objects.splice idx, 1
        when 'D' then @sim.objects.splice idx, 0, obj
    @transientChanges = []

    # At this point, we need to reset all indices.
    for obj, i in @sim.objects
      obj.idx = i

    return

  # Keep track of object creations and destructions that we did locally. We remember these
  # operations in order, so that we me undo them once we start processing updates from the
  # server / authority.

  created: (obj) ->
    unless @authoritative
      @transientChanges.unshift ['C', obj.idx, obj]

  destroyed: (obj) ->
    unless @authoritative
      @transientChanges.unshift ['D', obj.idx, obj]
    return

  # Keep track of map changes that we made locally. We only remember the last state of a cell
  # that the server told us about, so we can restore it to that state before processing
  # server updates.
  mapChanged: (cell, oldType, hadMine, oldLife) ->
    unless @authoritative or @transientMapCells[cell.idx]?
      cell._net_oldType = oldType
      cell._net_hadMine = hadMine
      cell._net_oldLife = oldLife
      @transientMapCells[cell.idx] = cell
    return


# Exports
module.exports = ClientContext
