Loop             = require 'villain/loop'
Progress         = require '../progress'
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
    progress = new Progress()
    progress.on 'complete', callback

    @images = images = {}
    loadImage = (name) ->
      images[name] = img = new Image()
      $(img).load progress.add()
      img.src = "images/#{name}.png"

    @soundkit = soundkit = new SoundKit()
    loadSound = (name) ->
      src = "sounds/#{name}.ogg"
      parts = name.split('_')
      for i in [1...parts.length]
        parts[i] = parts[i].substr(0, 1).toUpperCase() + parts[i].substr(1)
      methodName = parts.join('')
      soundkit.load methodName, src, progress.add()

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

    progress.wrapUp()

  # Common initialization once the map is available.
  commonInitialization: ->
    @renderer = new DefaultRenderer(this)

    @map.world = this
    @map.setView(@renderer)

    @boloInit()

    @loop = new Loop(this)
    @loop.tickRate = TICK_LENGTH_MS

    @input = d = $('<input id="input-dummy" type="text" autocomplete="off" />')
    d.insertBefore(@renderer.canvas).focus()
    d.keydown (e) => @handleKeydown(e)
    d.keyup (e)   => @handleKeyup(e)

  # Loop has processed all ticks for this iteration, draw a frame.
  idle: ->
    @renderer.draw()

  # Helper for `checkBuildOrder`. Return whether the cell has a tank on a boat in it.
  hasTankOnBoat: (cell) ->
    for tank in @tanks when tank.armour != 255 and tank.cell == cell
      return true if tank.onBoat
    false

  # Check and rewrite the build order that the user just tried to do.
  checkBuildOrder: (action, cell) ->
    # FIXME: These should notify the user why they failed.
    [action, trees, flexible] = switch action
      when 'forest'
        if cell.base or cell.pill or not cell.isType('#') then [false]
        else ['forest', 0]
      when 'road'
        if cell.base or cell.pill or cell.isType('|', '}', 'b', '^') then [false]
        else if cell.isType('#') then ['forest', 0]
        else if cell.isType('=') then [false]
        else if cell.isType(' ') and @hasTankOnBoat(cell) then [false]
        else ['road', 2]
      when 'building'
        if cell.base or cell.pill or cell.isType('b', '^') then [false]
        else if cell.isType('#') then ['forest', 0]
        else if cell.isType('}') then ['repair', 1]
        else if cell.isType('|') then [false]
        else if cell.isType(' ')
          if @hasTankOnBoat(cell) then [false]
          else ['boat', 20]
        else if cell == @player.cell then [false]
        else ['building', 2]
      when 'pillbox'
        if cell.pill
          if cell.pill.armour == 16 then [false]
          else if cell.pill.armour >= 11 then ['repair', 1, yes]
          else if cell.pill.armour >=  7 then ['repair', 2, yes]
          else if cell.pill.armour >=  3 then ['repair', 3, yes]
          else if cell.pill.armour  <  3 then ['repair', 4, yes]
        else if cell.isType('#') then ['forest', 0]
        else if cell.base or cell.isType('b', '^', '|', '}', ' ') then [false]
        else if cell == @player.cell then [false]
        else ['pillbox', 4]
      when 'mine'
        if cell.base or cell.pill or cell.isType('^', ' ', '|', 'b', '}') then [false]
        else ['mine']

    return [false] unless action
    if action == 'mine'
      return [false] if @player.mines == 0
      return ['mine']
    if action == 'pill'
      pills = @player.getCarryingPillboxes()
      return [false] if pills.length == 0
    if @player.trees < trees
      return [false] unless flexible
      trees = @player.trees
    [action, trees, flexible]

helpers.extend BoloClientWorldMixin, BoloWorldMixin


## Exports
module.exports = BoloClientWorldMixin
