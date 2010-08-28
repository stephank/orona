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


# The local context is used for simulations that are not networked. All of the methods in the
# above interface are implemented as no-ops.
class LocalContext
  constructor: (game) ->
  activated: ->
  created: (obj) ->
  destroyed: (obj) ->

# The server context is used on the server. It records changes in the object list, the critical
# updates, and makes them available in the 'changes' attribute. It also provides a method 'dump'
# that provides the attribute updates.
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

  # This method is specific to the server. It serializes all objects and concatenates the
  # updates into one large data block to be sent to the clients.
  dump: ->
    # FIXME

# The client context is used on the client. It does it's best to keep the object list in sync with
# the server, while allowing the local simulation to continue. This is done by keeping track of
# changes made locally and marking them as transient, until the next server update.
class ClientContext
  constructor: (@game) ->
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

    # Now, revive the locally destroyed objects in reverse order.
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

  # We need to keep track of objects that are deleted locally, but managed by the server.
  # So if this is not a server update, and not a locally created object either, add it to a list
  # of things to restore later on.
  destroyed: (obj) ->
    unless @authoritative or obj._net_transient
      @transientDestructions.unshift obj
    return


# All updates are processed by the active context. Create an implicit local context here,
# to make things work when the user doesn't touch the networking code.
activeContext = new LocalContext()

# Call +cb+ within the networking context +context+. This usually wraps calls to things that
# alter the simulation.
inContext = (ctx, cb) ->
  activeContext = ctx
  ctx.activated()
  cb()
  activeContext = null


# Exports.
exports.LocalContext  = LocalContext
exports.ServerContext = ServerContext
exports.ClientContext = ClientContext
exports.inContext = inContext

# Delegate the functions used by the simulation to the active context.
exports.created   = (obj) -> activeContext.created(obj)
exports.destroyed = (obj) -> activeContext.destroyed(obj)
