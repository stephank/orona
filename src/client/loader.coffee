# The loader takes care of loading a bunch of resources, providing progress information,
# firing a single event when everything is complete, and exposing resources in a tidy structure.

{EventEmitter} = require 'events'


class Loader extends EventEmitter
  constructor: ->
    @numResources = 0
    @numCompleted = 0
    @resources =
      images: {}
      sounds: {}

    @finished = no

  # Load a resource. This is a helper used internally.
  resource: (filename, constructor, completeEvent) ->
    res = new constructor()
    $(res).bind completeEvent, =>
      @numCompleted++
      @emit 'progress', this
      @_checkComplete()
    $(res).error =>
      @_handleError(res)
    res.src = filename
    res

  # Load an image.
  image: (name) ->
    @numResources++
    @resources.images[name] = @resource("img/#{name}.png", Image, 'load')

  # Load a sound file, creating one or more Audio objects.
  sound: (name, filetype, times) ->
    loadOne = =>
      @numResources++
      snd = @resource("snd/#{name}.#{filetype}", Audio, 'canplaythrough')
      snd.load()
      snd
    @resources.sounds[name] =
      if times?
        loadOne() while times-- > 0
      else
        loadOne()

  # Finish requesting resources. Only after a call to finish() will 'complete' be emitted.
  finish: ->
    @finished = yes
    @_checkComplete()

  # Check if all resources have been loaded, then emit 'complete'.
  _checkComplete: ->
    return unless @finished and @numCompleted == @numResources
    @emit 'complete', @resources
    @_stopEvents()

  # Emit 'error', and make sure no further events are fired.
  _handleError: (resource) ->
    @emit 'error', new Error("Failed to load resource: #{resource.src}")
    @_stopEvents()

  # Removes all event listeners.
  _stopEvents: ->
    @removeAllListeners('progress')
    @removeAllListeners('complete')
    @removeAllListeners('error')


#### Exports
module.exports = Loader
