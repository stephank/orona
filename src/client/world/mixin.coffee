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
    @waitForCache =>
      @loadResources =>
        @loaded()

  # Wait for the applicationCache to finish downloading.
  waitForCache: (callback) ->
    return callback() unless applicationCache?

    cache = $(applicationCache)
    afterCache = ->
      cache.unbind '.bolo'
      callback()

    cache.bind 'cached.bolo', afterCache
    cache.bind 'noupdate.bolo', afterCache
    cache.bind 'updateready.bolo', -> location.reload()

  # Loads all required resources.
  loadResources: (callback) ->
    progress = new Progress()
    progress.on 'complete', callback

    @images = {}
    @loadImages (name) =>
      @images[name] = img = new Image()
      $(img).load progress.add()
      img.src = "images/#{name}.png"

    @soundkit = new SoundKit()
    @loadSounds (name) =>
      src = "sounds/#{name}.ogg"
      parts = name.split('_')
      for i in [1...parts.length]
        parts[i] = parts[i].substr(0, 1).toUpperCase() + parts[i].substr(1)
      methodName = parts.join('')
      @soundkit.load methodName, src, progress.add()

    progress.wrapUp()

  loadImages: (i) ->
    i 'base'
    i 'styled'
    i 'overlay'

  loadSounds: (s) ->
    s 'big_explosion_far'
    s 'big_explosion_near'
    s 'bubbles'
    s 'farming_tree_far'
    s 'farming_tree_near'
    s 'hit_tank_far'
    s 'hit_tank_near'
    s 'hit_tank_self'
    s 'man_building_far'
    s 'man_building_near'
    s 'man_dying_far'
    s 'man_dying_near'
    s 'man_lay_mine_near'
    s 'mine_explosion_far'
    s 'mine_explosion_near'
    s 'shooting_far'
    s 'shooting_near'
    s 'shooting_self'
    s 'shot_building_far'
    s 'shot_building_near'
    s 'shot_tree_far'
    s 'shot_tree_near'
    s 'tank_sinking_far'
    s 'tank_sinking_near'

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

  # Check and rewrite the build order that the user just tried to do.
  checkBuildOrder: (action, cell) ->
    # FIXME: queue actions
    builder = @player.builder.$
    return [false] if builder.order != builder.states.inTank

    # FIXME: These should notify the user why they failed.
    [action, trees, flexible] = switch action
      when 'forest'
        if cell.base or cell.pill or not cell.isType('#') then [false]
        else ['forest', 0]
      when 'road'
        if cell.base or cell.pill or cell.isType('|', '}', 'b', '^') then [false]
        else if cell.isType('#') then ['forest', 0]
        else if cell.isType('=') then [false]
        else if cell.isType(' ') and cell.hasTankOnBoat() then [false]
        else ['road', 2]
      when 'building'
        if cell.base or cell.pill or cell.isType('b', '^') then [false]
        else if cell.isType('#') then ['forest', 0]
        else if cell.isType('}') then ['repair', 1]
        else if cell.isType('|') then [false]
        else if cell.isType(' ')
          if cell.hasTankOnBoat() then [false]
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
