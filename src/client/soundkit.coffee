# SoundKit is a thin audio layer.
class SoundKit
  constructor: ->
    @sounds = {}

  # Register the effect at the given url with the given name, and build a helper method
  # on this instance to play the sound effect.
  register: (name, url) ->
    @sounds[name] = url
    this[name] = => @play(name)

  # Play the effect called `name`.
  play: (name) ->
    effect = new Audio()
    effect.src = @sounds[name]
    effect.play()
    effect


#### Exports
module.exports = SoundKit
