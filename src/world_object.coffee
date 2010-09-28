# All objects that a `Simulation` keeps track of are subclasses of `WorldObject`.


{EventEmitter}  = require 'events'
{buildUnpacker,
 buildPacker}   = require './struct'


# The types indexed by their charId.
types = {}


# This base class mostly concerns itself with network synchronisation, while defining an interface
# for tick updates and graphics.
class WorldObject extends EventEmitter
  # This is a single character identifier for this class. It's handy for type checks without
  # having to require the module, but is also used as the network identifier.
  charId: null

  # A arbitrary value that is used to sort the objects in the Simulation object list. Purpose of
  # this is to have some control over the order in which objects are updated. Objects are sorted
  # in descending order of priority, so high priority objects get updated before others.
  updatePriority: 0

  # Whether objects of this class are drawn using the regular 'base' tilemap, or the styled
  # tilemap. May also be `null`, in which case the object is not drawn at all.
  styled: null

  # These are properties containing the world coordinates of this object. The value `null` for
  # either means that the object is not physical or 'not in the world' at this moment
  # (ie. dead tanks).
  x: null
  y: null

  # Instantiating a WorldObject is done using `sim.spawn MyObject, params...`. This wraps the call
  # to the actual constructor, and the simulation can thus keep track of the object.
  #
  # Any `spawn` parameters are passed to the `postSimCreate` event. Subclasses of WorldObject
  # normally don't implement any logic in the constructor, directly call `super`, and only install
  # event handlers.
  constructor: (@sim) ->

  # This method is called to dump the object's state in an array of bytes. The default
  # implementation will suit most purposes. It uses `serialization` below, which is normally what
  # you want to override instead.
  serialize: (isCreate) ->
    packer = buildPacker()
    serializer = @sim.buildSerializer(this, packer)
    @serialization(isCreate, serializer)
    packer.finish()

  # This method is the opposite of the above. It is called to load the object's state from an
  # array of bytes. Again, you probably want to override `serialization` instead.
  deserialize: (isCreate, data, offset) ->
    unpacker = buildUnpacker(data, offset)
    deserializer = @sim.buildDeserializer(this, unpacker)
    @serialization(isCreate, deserializer)
    [unpacker.finish(), deserializer.changes]

  #### Abstract methods

  # This method is called to serialize and deserialize an object's state. The parameter `p`
  # is a function which should be repeatedly called for each property of the object. It takes as
  # its first parameter a format specifier for `struct`, and as its second parameter an attribute
  # name.
  #
  # A special format specifier `O` may be used to (de-)serialize a reference to another
  # WorldObject, and `T` may be used for a reference to a Tank.
  #
  # There are also two options, `tx` and `rx`, that can be specified when calling `p`. Each of
  # these is a function that transforms the attribute value before sending and receiving
  # respectively.
  #
  # The `isCreate` parameter is true if called in response to a create message. This can be used to
  # synchronize parameters that are only ever set once at construction.
  #
  # If the function is called to serialize, then attributes are collected to form a packet.
  # If the function is called to deserialize, then attributes are filled with new values.
  serialization: (isCreate, p) ->

  # Called on every tick, either on the authority (local game or server)
  # or simulated on the client.
  update: ->

  # Return the (x,y) index in the tilemap (base or styled, selected above) that the object should
  # be drawn with. May be a no-op if the object is never actually drawn.
  getTile: ->

  #### Events

  # The following three kinds of events are defined: after creation, after an update, and before
  # destruction. Each of these events may happen in four different situations. The list of
  # available events thus looks as follows (in the order emitted):
  #
  # * The following are called as part of the simulation. They can happen both on the server and
  #   the client, considering they both run a simulation. These are the only kind that run inside
  #   the simulation. If you want to create or destroy other objects in response to events, you
  #   need to use these.
  #    * `simCreate`: Called after the object is created. Additional parameters to `spawn` will
  #      be passed on to handlers of this event.
  #    * `simUpdate`: Called after the update is processed.
  #    * `simDestroy`: Called before the object is destroyed.
  # * The following are called when network updates arrive. You'd use these, for example, to update
  #   attributes that are cache and depend on synchronized properties.
  #    * `netCreate`: Called after the object is created.
  #    * `netUpdate`: Called after the update is processed.
  #    * `netDestroy`: Called before the object is destroyed.
  # * The following are called when an authoritive change is made. The authority is either the
  #   server in a networked game, or just the local game. You can be sure that the change reported
  #   is definitive. It's a good place to clean up any event handlers on referenced objects.
  #    * `authCreate`: Called after the object is created.
  #    * `authUpdate`: Called after the update is processed.
  #    * `authDestroy`: Called before the object is destroyed.
  # * The following are called in any situation.
  #    * `create`: Called after the object is created.
  #    * `update`: Called after the update is processed.
  #    * `destroy`: Called before the object is destroyed.

  #### Static methods

  # Find a type by character or character code.
  @getType: (c) ->
    c = String.fromCharCode(c) if typeof(c) != 'string'
    types[c]

  # This should be called after a class is defined, as for example `MyObject.register()`.
  @register: ->
    types[this::charId] = this
    this::charCodeId = this::charId.charCodeAt(0)

  # Called automatically by CoffeeScript. Make `register` available on our subclass.
  @extended: (child) ->
    child.register = @register


#### Exports
module.exports = WorldObject
