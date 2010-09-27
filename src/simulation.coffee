# The simulation keeps track of everything concerning the game world.


net         = require './net'
{unpack}    = require './struct'
WorldObject = require './world_object'

# These requires are here to ensure that all object types are registered.
require './objects/sim_pillbox'
require './objects/sim_base'
require './objects/tank'
require './objects/explosion'
require './objects/shell'
require './objects/fireball'


class Simulation
  constructor: (@map) ->
    @objects = []
    @tanks = []

    @spawnMapObjects()

  #### Basic object management

  # Spawn an object, as the authority or simulated. The `type` parameter is a class that will be
  # instantiated. The remaining arguments are passed to the `postCreate` event handlers.
  spawn: (type, args...) ->
    obj = new type(this)
    obj.emit 'simCreate', args...
    obj.emit 'authCreate' if net.isAuthority()
    obj.emit 'create'
    @insert obj
    net.created obj
    obj

  # Update the given object, as the authority or simulated.
  update: (obj) ->
    obj.update()
    obj.emit 'simUpdate'
    obj.emit 'authUpdate' if net.isAuthority()
    obj.emit 'update'

  # Destroy the given object, as the authority or simulated.
  destroy: (obj) ->
    obj.emit 'simDestroy'
    obj.emit 'authDestroy' if net.isAuthority()
    obj.emit 'destroy'
    @remove obj
    net.destroyed obj
    obj

  # Process a single simulation tick. This simply calls `update` for all objects.
  tick: ->
    for obj in @objects.slice(0)
      @update obj
    return

  #### Object synchronization

  # Spawn an object received from the network, as received from the network.
  netSpawn: (data, offset) ->
    type = WorldObject.getType data[offset]
    obj = @insert new type(this)
    bytes = obj.deserialize(yes, data, offset + 1)
    obj.emit 'netCreate'
    obj.emit 'authCreate'
    obj.emit 'create'
    bytes + 1

  # Update the given object, as received from the network.
  netUpdate: (obj, data, offset) ->
    bytes = obj.deserialize(no, data, offset)
    obj.emit 'netUpdate'
    obj.emit 'authUpdate'
    obj.emit 'update'
    bytes

  # Destroy the given object, as received from the network.
  netDestroy: (data, offset) ->
    [[obj_idx], bytes] = unpack('H', data, offset)
    obj = @objects[obj_idx]
    obj.emit 'netDestroy'
    obj.emit 'authDestroy'
    obj.emit 'destroy'
    @remove obj
    bytes

  # Process a network tick, ie. update-message. This simply calls `netUpdate` for all objects.
  netTick: (data, offset) ->
    bytes = 0
    for obj in @objects
      bytes += @netUpdate obj, data, offset + bytes
    bytes

  #### Helpers

  # These are methods that allow low-level manipulation of the object list, while keeping it
  # properly sorted, and keeping object indices up-to-date. Unless you're doing something special,
  # you will want to use `spawn` and `destroy` instead instead.

  insert: (obj) ->
    for other, i in @objects
      break if obj.updatePriority > other.updatePriority
    @objects.splice(i, 0, obj)
    for i in [i...@objects.length]
      @objects[i].idx = i
    obj

  remove: (obj) ->
    @objects.splice(obj.idx, 1)
    for i in [obj.idx...@objects.length]
      @objects[i].idx = i
    obj

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
    for i in [tank.tank_idx...@tanks.length]
      @tanks[i].tank_idx = i
    @resolveMapObjectOwners()

  #### Map object management

  # A helper method which returns all simulated map objects.
  getAllMapObjects: -> @map.pills.concat @map.bases

  # The special spawning logic for MapObjects. These are created when the map is loaded, which is
  # before the Simulation is created. We simulate `spawn` here for these objects. `simCreate`
  # receives the back-reference to this Simulation.
  spawnMapObjects: ->
    for obj in @getAllMapObjects()
      @insert obj
      obj.emit 'simCreate', this
      obj.emit 'authCreate'
      obj.emit 'create'
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
