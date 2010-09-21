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

  # Whether objects of this class are drawn using the regular 'base' tilemap, or the styled
  # tilemap. May also be `null`, in which case the object is not drawn at all.
  styled: null

  # These are properties containing the world coordinates of this object. These are actually
  # defined in the constructor. The value `null` for either means that the object is not physical
  # or 'not in the world' at this moment (ie. dead tanks).
  x: null
  y: null

  # Instantiating a WorldObject is done using `sim.spawn MyObject, params...`. This wraps the call
  # to the actual constructor, and the simulation can thus keep track of the object.
  #
  # Any `spawn` parameters are passed to the `postCreate` event. Subclasses of WorldObject normally
  # don't implement any logic in the constructor, directly call `super`, and only install event
  # handlers.
  constructor: (@sim) ->

  # This method is called to dump the object's state in an array of bytes. The default
  # implementation will suit most purposes. It uses `serialization` below, which is normally what
  # you want to override instead.
  serialize: (isCreate) ->
    packer = buildPacker()
    serializer = @sim.buildSerializer(packer)
    @serialization(isCreate, serializer)
    packer.finish()

  # This method is the opposite of the above. It is called to load the object's state from an
  # array of bytes. Again, you probably want to override `serialization` instead.
  deserialize: (isCreate, data, offset) ->
    unpacker = buildUnpacker(data, offset)
    deserializer = @sim.buildDeserializer(unpacker)
    @serialization(isCreate, deserializer)
    unpacker.finish()

  #### Abstract methods

  # This method is called to serialize and deserialize an object's state. The parameter `p`
  # is a function which should be repeatedly called for each property of the object. It takes as
  # its first parameter a format specifier for `struct`, and as it's second parameter the current
  # value of the property. A special format specifier `O` may be used to (de-)serialize a reference
  # to another WorldObject, and `T` may be used for a reference to a Tank.
  #
  # If the function is called to serialize, then parameters are collected to form a packet, and
  # the return value is the same as the `value` parameter verbatim. If the function is called to
  # deserialize, then the value parameter is ignored, and the return value is the received value.
  serialization: (isCreate, p) ->

  # Called on every tick, either on the authority (local game or server)
  # or simulated on the client.
  update: ->

  # Return the (x,y) index in the tilemap (base or styled, selected above) that the object should
  # be drawn with. May be a no-op if the object is never actually drawn.
  getTile: ->

  #### Events

  # The following events are emitted on an object:
  #
  # * `postCreate`: Called after the object is created, as the authority or simulated.
  # * `postUpdate`: Called after the update is processed, as the authority or simulated.
  # * `preDestroy`: Called before the object is destroyed, as the authority or simulated.
  # * `postNetCreate`: Called after the object is created, as received from the network.
  # * `postNetUpdate`: Called after the update is processed, as received from the network.
  # * `preNetDestroy`: Called before the object is destroyed, as received from the network.
  # * `postInitialize`: Always called after the object is created.
  # * `postChanged`: Always called after the update is processed.
  # * `preRemove`: Always called before the object is destroyed.
  #
  # You'll notice there's three key events: after creation, after an update, and before
  # destruction. They are fired in three situations: simulated, through networking, or always.
  # The 'always' kind of event is always fired after the others.

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
