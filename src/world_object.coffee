# All objects that a `Simulation` keeps track of implement `WorldObject`. This interface mostly
# concerns itself with state synchronisation, tick updates and graphics.


# The types indexed by their charId.
types = {}


# An interface that all objects in the world simulation should implement. It is not necessary
# to subclass this, it's mostly here for documentation.
class WorldObject
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

  # Instantiating a WorldObject is usually done using `sim.spawn MyObject, params...`. This wraps
  # the call to the actual constructor, and the simulation can thus keep track of the object.
  #
  # Even though not specified in `params`, the first parameter is always the Simulation instance.
  #
  # Note that this constructor is *not* invoked for objects instantiated from the network code.
  # The network code instead instantiates using a blank constructor, calls `deserialize`, and
  # then proceeds as normal with `postInitialize` and further updates.
  constructor: (sim) ->

  #### Callbacks

  # *The following are optional callbacks.*

  # Return the (x,y) index in the tilemap (base or styled, selected above) that the object should
  # be drawn with. May be a no-op if the object is never actually drawn.
  getTile: ->

  # Called after the object has been added to the Simulation, either through normal means or
  # through the network code.
  postInitialize: ->

  # Called after a network update has been processed.
  postNetUpdate: ->

  # Called before the object is about the be removed from the Simulation, either through normal
  # means or through the network code.
  preRemove: ->

  # Called when the object is destroyed through normal means. This may happen on the simulation
  # authority (local game or server), but also simulated on a client.
  destroy: ->

  # Called on every tick, either on the authority (local game or server)
  # or simulated on the client.
  update: ->

  # This method is called to serialize and deserialize an object's state. The parameter `p`
  # is a function which should be repeatedly called for each property of the object. It takes as
  # its first parameter a format specifier for `struct`, and as it's second parameter the current
  # value of the property. A special format specifier `O` may be used to (de-)serialize a reference
  # to another WorldObject, and `T` may be used for a reference to a Tank.
  #
  # If the function is called to serialize, then parameters are collected to form a packet, and
  # the return value is the same as the value parameter verbatim. If the function is called to
  # deserialize, then the value parameter is ignored, and the return value is the received value.
  serialization: (isCreate, p) ->

  #### Static methods

  # Find a type by character or character code.
  @getType: (c) ->
    c = String.fromCharCode(c) if typeof(c) != 'string'
    types[c]

  # This should be called after a class is defined, as for example `WorldObject.register MyObject`.
  @register: (type) ->
    types[type::charId] = type
    type::charCodeId = type::charId.charCodeAt(0)


#### Exports
module.exports = WorldObject
