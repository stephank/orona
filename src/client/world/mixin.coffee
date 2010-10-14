Loop             = require 'villain/loop'
SoundKit         = require '../soundkit'
DefaultRenderer  = require '../renderer/offscreen_2d'
{TICK_LENGTH_MS} = require '../../constants'
helpers          = require '../../helpers'
BoloWorldMixin   = require '../../world_mixin'


## Client world mixin

# Common logic between `BoloLocalWorld` and `BoloClientWorld`

BoloClientWorldMixin =

  start: ->
    @loadResources => @loaded()

  # Loads all required resources.
  loadResources: (callback) ->
    numResources = 0; numCompleted = 0; finished = no
    checkComplete = ->
      callback() if finished and numCompleted == numResources
    finish = ->
      finished = yes
      checkComplete()

    @images = images = {}
    loadImage = (name) ->
      numResources++
      images[name] = img = new Image()
      $(img).load ->
        numCompleted++
        checkComplete()
      img.src = "img/#{name}.png"

    @soundkit = soundkit = new SoundKit()
    loadSound = (name) ->
      src = "snd/#{name}.ogg"
      parts = name.split('_')
      for i in [1...parts.length]
        parts[i] = parts[i].substr(0, 1).toUpperCase() + parts[i].substr(1)
      methodName = parts.join('')

      unless Audio?
        soundkit.register(methodName, src)
        return

      numResources++
      snd = new Audio()
      $(snd).bind 'canplaythrough', ->
        soundkit.register(methodName, snd.currentSrc)
        numCompleted++
        checkComplete()
      snd.src = src
      snd.load()

    loadImage 'base'
    loadImage 'styled'
    loadImage 'overlay'

    loadSound 'big_explosion_far'
    loadSound 'big_explosion_near'
    loadSound 'bubbles'
    loadSound 'farming_tree_far'
    loadSound 'farming_tree_near'
    loadSound 'hit_tank_far'
    loadSound 'hit_tank_near'
    loadSound 'hit_tank_self'
    loadSound 'man_building_far'
    loadSound 'man_building_near'
    loadSound 'man_dying_far'
    loadSound 'man_dying_near'
    loadSound 'man_lay_mine_near'
    loadSound 'mine_explosion_far'
    loadSound 'mine_explosion_near'
    loadSound 'shooting_far'
    loadSound 'shooting_near'
    loadSound 'shooting_self'
    loadSound 'shot_building_far'
    loadSound 'shot_building_near'
    loadSound 'shot_tree_far'
    loadSound 'shot_tree_near'
    loadSound 'tank_sinking_far'
    loadSound 'tank_sinking_near'

    finish()

  # Common initialization once the map is available.
  commonInitialization: ->
    @renderer = new DefaultRenderer(this)

    @map.world = this
    @map.setView(@renderer)

    @boloInit()

    @loop = new Loop(this)
    @loop.tickRate = TICK_LENGTH_MS

    $(document).keydown (e) => @handleKeydown(e)
    $(document).keyup (e)   => @handleKeyup(e)

  idle: ->
    @renderer.draw()

  handleClick: (cell) ->
    # FIXME

helpers.extend BoloClientWorldMixin, BoloWorldMixin


## Exports
module.exports = BoloClientWorldMixin
