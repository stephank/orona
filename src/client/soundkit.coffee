## Soundkit

# A thin audio layer.

class SoundKit
  constructor: ->
    @sounds = {}

    # FIXME: Probably want to switch to has.js at some point.
    @isSupported = no
    if Audio?
      dummy = new Audio()
      @isSupported = dummy.canPlayType?

  # Register the effect at the given url with the given name, and build a helper method
  # on this instance to play the sound effect.
  register: (name, url) ->
    @sounds[name] = url
    this[name] = => @play(name)

  # Wait for the given effect to be loaded, then register it.
  load: (name, url, cb) ->
    @register name, url
    return cb?() unless @isSupported
    loader = new Audio()
    $(loader).one('canplaythrough', cb) if cb
    $(loader).one 'error', (e) =>
      # FIXME: support more error codes.
      switch e.code
        when e.MEDIA_ERR_SRC_NOT_SUPPORTED
          @isSupported = no; cb?()
    loader.src = url
    loader.load()

  # Play the effect called `name`.
  play: (name) ->
    return unless @isSupported
    effect = new Audio()
    effect.src = @sounds[name]
    effect.play()
    effect

## Exports
module.exports = SoundKit
