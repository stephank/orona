## World mixin

# Common logic between all bolo world classes.

BoloWorldMixin =

  #### Player management

  # If only we could extend constructors using mixins.
  boloInit: ->
    @tanks = []

  addTank: (tank) ->
    tank.tank_idx = @tanks.length
    @tanks.push tank
    @resolveMapObjectOwners() if @authority

  removeTank: (tank) ->
    @tanks.splice tank.tank_idx, 1
    for i in [tank.tank_idx...@tanks.length]
      @tanks[i].tank_idx = i
    @resolveMapObjectOwners() if @authority

  #### Map helpers

  # A helper method which returns all map objects.
  getAllMapObjects: -> @map.pills.concat @map.bases

  # The special spawning logic for MapObjects. These are created when the map is loaded, which is
  # before the World is created. We emulate `spawn` here for these objects.
  spawnMapObjects: ->
    for obj in @getAllMapObjects()
      obj.world = this
      @insert obj
      obj.spawn()
      obj.anySpawn()
    return

  # Resolve pillbox and base owner indices to the actual tanks. This method is only really useful
  # on the server. Because of the way serialization works, the client doesn't get the see invalid
  # owner indices. (As can be seen in `ServerWorld#serialize`.) It is called whenever a player
  # joins or leaves the game.
  resolveMapObjectOwners: ->
    for obj in @getAllMapObjects()
      obj.ref 'owner', @tanks[obj.owner_idx]
      obj.cell?.retile()
    return


## Exports
module.exports = BoloWorldMixin
