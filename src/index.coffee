# The simulation keeps track of everything concerning the game world.


net             = require './net'
{buildUnpacker} = require './struct'

# These requires are to ensure that all world objects are registered.
require './tank'
require './explosion'
require './shell'


class Simulation
  constructor: (@map) ->
    @objects = []
    @tanks = []

    @spawnMapObjects()

  # Basic object management.

  tick: ->
    # Work on a shallow copy of the object list.
    for obj in @objects.slice(0)
      obj.update?()
    return

  # Spawn an object, as the authority or simulated.
  spawn: (type, args...) ->
    obj = new type(this, args...)
    # Register it.
    obj.idx = @objects.length
    @objects.push obj
    # Invoke the callback.
    obj.postInitialize?()
    # Notify networking.
    net.created obj
    # Return the new object.
    obj

  # Create an object received from the network.
  netSpawn: (type, data, offset) ->
    blankConstructor = (@sim) -> this
    blankConstructor.prototype = type.prototype
    obj = new blankConstructor(this)
    # Register it.
    obj.idx = @objects.length
    @objects.push obj
    # Deserialize.
    unpacker = buildUnpacker(data, offset)
    obj.serialization?(yes, @buildDeserializer(unpacker))
    # Invoke the callback.
    obj.postInitialize?()
    # Return the number of bytes taken.
    unpacker.finish()

  # Destroy an object, as the authority or simulated.
  destroy: (obj) ->
    # Invoke the callback.
    obj.preRemove?()
    # Call the destructor.
    obj.destroy?()
    # Remove it from the list.
    @objects.splice obj.idx, 1
    # Update the indices of everything that follows.
    for i in [obj.idx...@objects.length]
      @objects[i].idx--
    # Notify networking.
    net.destroyed obj
    # Return the same object.
    obj

  # Destroy an object, as received from the network.
  netDestroy: (obj) ->
    # Invoke the callback.
    obj.preRemove?()
    # Remove it from the list.
    @objects.splice obj.idx, 1
    # Update the indices of everything that follows.
    for i in [obj.idx...@objects.length]
      @objects[i].idx--

  # Serialization

  buildSerializer: (packer) ->
    (specifier, value) ->
      switch specifier
        when 'O' then packer('H', if value then value.idx else 65535)
        when 'T' then packer('B', if value then value.tank_idx else 255)
        else          packer(specifier, value)
      value

  buildDeserializer: (unpacker) ->
    (specifier, value) =>
      switch specifier
        when 'O' then @objects[unpacker('H')]
        when 'T' then @tanks[unpacker('B')]
        else          unpacker(specifier)

  # Player management.

  addTank: (tank) ->
    tank.tank_idx = @tanks.length
    @tanks.push tank
    @resolveMapObjectOwners()

  removeTank: (tank) ->
    @tanks.splice tank.tank_idx, 1
    @resolveMapObjectOwners()

  # Map object management.

  getAllMapObjects: -> @map.pills.concat @map.bases

  # The special spawning logic for map objects. This happens way early in the game, and because
  # there's very little and especially no clients yet, we can drop some of `spawn`'s logic.
  spawnMapObjects: ->
    for obj in @getAllMapObjects()
      obj.idx = @objects.length
      @objects.push obj
      obj.postMapObjectInitialize?(this)
      obj.postInitialize?()
    return

  # Resolve pillbox and base owner indices to the actual tanks. This method is only really useful
  # on the server. Because of the way serialization works, the client doesn't get the see invalid
  # owner indices. (As can be seen in `buildSerializer`.)
  resolveMapObjectOwners: ->
    return unless net.isAuthority()
    for obj in @getAllMapObjects()
      obj.owner = @tanks[obj.owner_idx]
      obj.cell.retile()
    return

  # Called on the client to fill `map.pills` and `map.bases` based on the current object list.
  rebuildMapObjects: ->
    @map.pills = []; @map.bases = []
    for obj in @objects
      switch obj.charId
        when 'p' then @map.pills.push(obj)
        when 'b' then @map.bases.push(obj)
        else continue
      obj.cell.retile()
    return

# Exports.
module.exports = Simulation
