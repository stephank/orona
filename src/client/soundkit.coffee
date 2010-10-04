# SoundKit is the basic audio layer.
# An instance of the SoundKit holds a set of sound effects and channels.
class SoundKit
  constructor: (@loader, @filetype) ->
    @filetype ||= @constructor.detect()
    @sounds = {}

  # Return the preferred filetype for this browser.
  @detect: ->
    return 'none' unless Audio?
    dummy = new Audio();
    return 'none' unless dummy.canPlayType?
    if      dummy.canPlayType('audio/ogg; codecs="vorbis"') != 'no' then 'ogg' 
    else if dummy.canPlayType('audio/mpeg; codecs="mp3"')   != 'no' then 'mp3'
    else 'wav'

  # Load a sound effect. This wraps `Loader#sound`, and should just the same be called while
  # loading resources. For each sample, a helper method is created named after `name`, which can
  # simply be called with no parameters to play the effect. A number of channels is created,
  # which is the maximum number of overlapping playbacks this particular sample can have.
  load: (name, channels) ->
    this[name] =
      if @filetype == 'none'
        -> # No-op
      else
        channels ||= 1
        @sounds[name] = pool = @loader.sound(name, @filetype, channels)
        => @play(name)

  # Play the effect called `name`.
  play: (name) ->
    return if @filetype == 'none'
    for channel in @sounds[name]
      if channel.paused or channel.ended
        channel.currentTime = 0
        channel.play()
        break
    return


#### Exports
module.exports = SoundKit
