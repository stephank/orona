{TILE_SIZE_WORLD} = require '../constants'
{distance} = require '../helpers'
BoloObject = require '../object'
sounds     = require '../sounds'
Explosion  = require './explosion'


## Mine explosion

# An invisible object, which triggers a mine after a short delay. These are always spawned when
# mines are supposed to be triggered, even if there is no mine on the cell at the time.

class MineExplosion extends BoloObject

  styled: null

  serialization: (isCreate, p) ->
    if isCreate
      p 'H', 'x'
      p 'H', 'y'

    p 'B', 'lifespan'

  #### World updates

  spawn: (cell) ->
    [@x, @y] = cell.getWorldCoordinates()
    @lifespan = 10

  anySpawn: ->
    @cell = @world.map.cellAtWorld(@x, @y)

  update: ->
    if @lifespan-- == 0
      @asplode() if @cell.mine
      @world.destroy(this)

  asplode: ->
    @cell.setType null, no, 0

    @cell.takeExplosionHit()
    for tank in @world.tanks
      tank.takeMineHit() if tank.armour != 255 and distance(this, tank) < 384
      builder = tank.builder.$
      unless builder.order in [builder.states.inTank, builder.states.parachuting]
        builder.kill() if distance(this, builder) < (TILE_SIZE_WORLD / 2)

    @world.spawn Explosion, @x, @y
    @soundEffect sounds.MINE_EXPLOSION
    @spread()

  spread: ->
    n = @cell.neigh( 1,  0); @world.spawn(MineExplosion, n) unless n.isEdgeCell()
    n = @cell.neigh( 0,  1); @world.spawn(MineExplosion, n) unless n.isEdgeCell()
    n = @cell.neigh(-1,  0); @world.spawn(MineExplosion, n) unless n.isEdgeCell()
    n = @cell.neigh( 0, -1); @world.spawn(MineExplosion, n) unless n.isEdgeCell()


## Exports
module.exports = MineExplosion
