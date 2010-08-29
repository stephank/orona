###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# Orona uses two WebSocket connections during play. The first is the lobby connection, which is
# always open, and is also used for in-game chat. The second is used for world synchronization,
# which is kept separate so that the lobby connection cannot impede network performance of game
# updates (or at least diminish the effect).

# The collecting of data of world updates is governed by this module. World updates are split up
# in two kinds of messages.

# The first are critical updates, which are object creation an destruction. Both the server and
# client have lists of objects that are kept in sync. In order to do that, these updates are
# transmitted reliably to clients. (But actual transport is not done by this module.)

# The second are attribute updates for existing objects. A single update message of this kind
# (currently) contains a complete set of updates for all world objects. There are no differential
# updates, so it's okay for the underlying transport to drop some of these.

# In order to do the right thing in different situations without complicating simulation code,
# a global networking context object is used that handles all networking state. The simulation
# only calls into a couple of methods, and is ignorant of what happens from there.


# The interface provided by network contexts. Unused, but here for documentation.
class Context
  constructor: (game) ->

  # Called when the context is activated. See 'inContext' for more information.
  activated: ->

  # Notification sent by the simulation that the given object was created.
  created: (obj) ->

  # Notification sent by the simulation that the given object was destroyed.
  destroyed: (obj) ->

  # Notification sent by the simulation that the given map cell has changed.
  mapChanged: (cell, oldType, hadMine) ->


# All updates are processed by the active context.
activeContext = null

# Call +cb+ within the networking context +context+. This usually wraps calls to things that
# alter the simulation.
inContext = (ctx, cb) ->
  activeContext = ctx
  ctx.activated()
  cb()
  activeContext = null


# Exports.
exports.inContext = inContext

# Delegate the functions used by the simulation to the active context.
exports.created    = (obj) -> activeContext?.created(obj)
exports.destroyed  = (obj) -> activeContext?.destroyed(obj)
exports.mapChanged = (cell, oldType, hadMine) -> activeContext?.mapChanged(cell, oldType, hadMine)
