{sqrt} = Math
{TILE_SIZE_WORLD} = require '../constants'
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

    for tank in @world.tanks when tank.armour != 255
      dx = tank.x - @x; dy = tank.y - @y
      distance = sqrt(dx*dx + dy*dy)
      tank.takeMineHit() if distance < 384

      builder = tank.builder.$
      continue if builder.order in [builder.states.inTank, builder.states.parachuting]
      dx = builder.x - @x; dy = builder.y - @y
      distance = sqrt(dx*dx + dy*dy)
      builder.kill() if distance < (TILE_SIZE_WORLD / 2)

    @world.spawn Explosion, @x, @y
    @soundEffect sounds.MINE_EXPLOSION
    @spread()

  spread: ->
    n = @cell.neigh( 1,  0); @world.spawn(MineExplosion, n) unless n.isType '^'
    n = @cell.neigh( 0,  1); @world.spawn(MineExplosion, n) unless n.isType '^'
    n = @cell.neigh(-1,  0); @world.spawn(MineExplosion, n) unless n.isType '^'
    n = @cell.neigh( 0, -1); @world.spawn(MineExplosion, n) unless n.isType '^'


## Exports
module.exports = MineExplosion
