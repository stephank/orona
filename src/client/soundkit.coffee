# SoundKit is the basic audio layer. An instance of the SoundKit holds a set of sound effects as
# given by the `sounds` parameter in the constructor. This is usually passed on from `Loader`, but
# in general is an object of which all `Audio` attributes are collected. A helper method is created
# for each of these attributes, with the same name, which plays the effect when called.
class SoundKit
  constructor: (sounds) ->
    @sounds = {}
    for name, sound of sounds
      @buildHelper name, sound if sound instanceof Audio

  buildHelper: (name, snd) ->
    @sounds[name] = snd.currentSrc
    this[name] = => @play(name)

  # Play the effect called `name`.
  play: (name) ->
    effect = new Audio()
    effect.src = @sounds[name]
    effect.play()
    effect


#### Exports
module.exports = SoundKit
