# The loader takes care of loading a bunch of resources, providing progress information,
# firing a single event when everything is complete, and exposing resources in a tidy structure.

{EventEmitter} = require 'events'


# FIXME: Implement progress notification.

class Loader extends EventEmitter
  constructor: ->
    @resources =
      images: {}
      sounds: {}

    @finished = no

  # Load any resource. This is a helper used internally.
  resource: (filename, constructor) ->
    res = new constructor()
    $(res).load => @_checkComplete()
    $(res).error => @_handleError(res)
    res.src = filename
    res

  # Load an image.
  image: (name) ->
    @resources.images[name] = @resource("img/#{name}.png", Image)

  # Load a sound file.
  sound: (name, filetype) ->
    @resources.sounds[name] = @resource("snd/#{name}.#{filetype}", Audio)

  # Finish requesting resources. Only after a call to finish() will 'complete' be emitted.
  finish: ->
    @finished = yes
    @_checkComplete()

  # Check if all resources have been loaded, then emit 'complete'.
  _checkComplete: ->
    return unless @finished
    for category, container of @resources
      for name, resource of container
        return unless resource.complete
    @emit 'complete', @resources
    @_stopEvents()

  # Emit 'error', and make sure no further events are fired.
  _handleError: (resource) ->
    @emit 'error', "Failed to load resource: #{resource.src}"
    @_stopEvents()

  # Removes all event listeners.
  _stopEvents: ->
    @removeAllListeners('complete')
    @removeAllListeners('error')


#### Exports
module.exports = Loader
