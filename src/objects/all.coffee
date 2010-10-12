exports.registerWithWorld = (w) ->
  w.registerType require './world_pillbox'
  w.registerType require './world_base'
  w.registerType require './tank'
  w.registerType require './explosion'
  w.registerType require './shell'
  w.registerType require './fireball'
  w.registerType require './builder'
