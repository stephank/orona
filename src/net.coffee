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
  # Called when the context is activated. See 'activate' for more information.
  activated: ->

  # Create the given object in the simulation. The object is usually freshly instantiated, and
  # this method then registers it in the networking context.
  create: (obj) ->

  # Destroy the object in the simulation. The object is unregistered from the networking context,
  # and the user will usually discard the object when this method finishes.
  destroy: (obj) ->


# The local context is used for simulations that are not networked. All of the methods in the
# above interface are implemented as no-ops.
class LocalContext
  activated: ->
  create: (obj) ->
  destroy: (obj) ->

# The server context is used on the server. It keeps a list of objects and keeps track of changes
# to this list. The changes are available as a block of data from the 'changes' attribute.
class ServerContext
  constructor: ->
    @objects = []

  # Clear the list of changes.
  activated: ->
    @changes = []

  # Record the creation and add to the object list.
  create: (obj) ->
    # FIXME: add to changes
    obj._net_idx = @objects.length
    @objects.push obj

  # Record the destruction and remove from the object list.
  destroy: (obj) ->
    # FIXME: add to changes
    @objects.splice obj._net_idx, 1
    # Update indices.
    for o, i in @objects
      o._net_idx = i

  # This method is specific to the server. It serializes all objects and concatenates the
  # updates into one large data block to be sent to the clients.
  dump: ->
    # FIXME

# The client context is used on the client. It keeps a list of objects like the server, and does
# it's best to keep it in sync. The client context allows for the client simulation to continue
# while the connection is interrupted, by marking all changes made on the client as transient.
class ClientContext
  constuctor: ->
    @objects = []

  # Before calling 'activate', the user should reset this special property, based on whether it
  # is about the process server updates or process a simulated tick. When set, the context
  # will assume updates are received from the server. When not set, updates are transient.
  authoritative: no

  # The client implmentation of activated cleans up any transient objects when new updates
  # from the server arrive.
  activated: ->
    if @authoritative
      # Find the first object that is marked transient.
      for obj, i in @objects
        break if obj._net_transient
      # We can assume all objects after this are transient as well.
      @objects.splice i, @objects.length - i
      # FIXME: This probably won't do. How to tell the simulation that objects
      # it destroyed are now possibly back in play?
    return

  # Append the object to the list, and mark the object as transient if needed.
  create: (obj) ->
    obj._net_idx = @objects.length
    obj._net_transient = not @authoritative
    @objects.push obj

  # If this is not an update from the server, keep the object around. The simulation won't
  # touch it any more, and this way we keep indices aligned with the server.
  destroy: (obj) ->
    if @authoritative
      @objects.splice obj._net_idx, 1
      # Update indices.
      for o, i in @objects
        o._net_idx = i
    return


# All updates are processed by the active context. Create an implicit local context here,
# to make things work when the user doesn't touch the networking code.
activeContext = new LocalContext()

# Call +cb+ within the networking context +context+. This usually wraps calls to things that
# alter the simulation.
activate = (ctx, cb) ->
  activeContext = ctx
  ctx.activated()
  cb()
  activeContext = null


# Exports.
exports.LocalContext  = LocalContext
exports.ServerContext = ServerContext
exports.ClientContext = ClientContext
exports.activate = activate

# Delegate the functions used by the simulation to the active context.
exports.create  = (obj) -> activeContext.create(obj)
exports.destroy = (obj) -> activeContext.destroy(obj)
