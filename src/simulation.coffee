# The simulation keeps track of everything concerning the game world.


net             = require './net'
{buildUnpacker} = require './struct'

# These requires are here to ensure that all object types are registered.
require './objects/sim_pillbox'
require './objects/sim_base'
require './objects/tank'
require './objects/explosion'
require './objects/shell'


class Simulation
  constructor: (@map) ->
    @objects = []
    @tanks = []

    @spawnMapObjects()

  #### Basic object management

  # Process a single simulation tick. This simply calls `update` on all objects that have it.
  tick: ->
    for obj in @objects.slice(0)
      obj.update?()
    return

  # Updates the indices of objects. Notably called when something is removed. The optional
  # `startIdx` is the object index to start processing. Usually the index of the object that was
  # just removed, so that all that follow may be updated.
  updateIndices: (startIdx) ->
    startIdx ||= 0
    for i in [startIdx...@objects.length]
      @objects[i].idx = i
    return

  # Spawn an object, as the authority or simulated. This method is meant to be a wrapper around
  # the actual object's constructor. It is invoked as for example:
  #
  #     sim.spawn Explosion, x, y
  #
  # The function will then call the `Explosion` constructor with arguments `sim, x, y`. Note the
  # implicit simulation parameter.
  #
  # After the object has been instantiated, it is assigned an index, its optional callback
  # `postInitialized` is invoked, and the networking context is notified. Finally, `spawn` returns
  # the object much like a regular constructor.
  spawn: (type, args...) ->
    obj = new type(this, args...)
    obj.idx = @objects.length; @objects.push obj

    obj.postInitialize?()
    net.created obj
    obj

  # Create an object received from the network. The `type` parameter is a class that will be
  # instiated with a blank constructor. The new instance will be assigned an index. Following this
  # the data at `data` and `offset` is deserialized as normal, but with the `isCreate` flag set.
  # Finally, the optional `postInitialized` callback is invoked, and `netSpawn` returns the number
  # of bytes that deserialization needed.
  netSpawn: (type, data, offset) ->
    blankConstructor = (@sim) -> this
    blankConstructor.prototype = type.prototype
    obj = new blankConstructor(this)
    obj.idx = @objects.length; @objects.push obj

    unpacker = buildUnpacker(data, offset)
    obj.serialization?(yes, @buildDeserializer(unpacker))
    obj.postInitialize?()
    unpacker.finish()

  # Destroy an object, as the authority or simulated. The callbacks `preRemove` and `destroy` are
  # invoked, before the object is removed from the simulation. After this, networking is notified,
  # before `destroy` returns the object again.
  destroy: (obj) ->
    obj.preRemove?()
    obj.destroy?()
    @objects.splice(obj.idx, 1); @updateIndices(obj.idx)
    net.destroyed obj
    obj

  # Destroy an object, as received from the network. The `preRemove` callback is invoked, before
  # the object is removed from the simulation.
  netDestroy: (obj) ->
    obj.preRemove?()
    @objects.splice(obj.idx, 1); @updateIndices(obj.idx)

  #### Serialization

  # These functions build the generators used in the `serialization` callback of objects. They
  # wrap `struct.packer` and `struct.unpacker` with the function signature that we want, and also
  # add the necessary support to process the object reference format specifiers `O` and `T`.

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

  #### Player management

  # The `Tank` class calls these, so that the we may keep a player list.

  addTank: (tank) ->
    tank.tank_idx = @tanks.length
    @tanks.push tank
    @resolveMapObjectOwners()

  removeTank: (tank) ->
    @tanks.splice tank.tank_idx, 1
    @resolveMapObjectOwners()

  #### Map object management

  # A helper method which returns all simulated map objects.
  getAllMapObjects: -> @map.pills.concat @map.bases

  # The special spawning logic for map objects. This happens way early in the game, and because
  # there's very little, and especially no clients yet, we can drop some of `spawn`'s logic.
  # Otherwise, the only difference is the extra `postMapObjectInitialize` callback.
  spawnMapObjects: ->
    for obj in @getAllMapObjects()
      obj.idx = @objects.length
      @objects.push obj
      obj.postMapObjectInitialize?(this)
      obj.postInitialize?()
    return

  # Resolve pillbox and base owner indices to the actual tanks. This method is only really useful
  # on the server. Because of the way serialization works, the client doesn't get the see invalid
  # owner indices. (As can be seen in `buildSerializer`.) It is called whenever a player joins
  # or leaves the game.
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


#### Exports
module.exports = Simulation
