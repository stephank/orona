# The loader takes care of loading a bunch of resources, providing progress information,
# firing a single event when everything is complete, and exposing resources in a tidy structure.


# FIXME: Implement progress notification.

class Loader
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

  # Finish requesting resources.
  # Only after a call to finish() will onComplete() be called.
  finish: ->
    @finished = yes
    @_checkComplete()

  # Check if all resources have been loaded, then call onComplete.
  _checkComplete: ->
    return unless @finished
    for category, container of @resources
      for name, resource of container
        return unless resource.complete
    @_stopEvents()
    @onComplete()

  # Make sure no further events are fired, then call onError.
  _handleError: (resource) ->
    @_stopEvents()
    @onError(resource)

  # Replace methods with empty functions, to prevent any further events.
  _stopEvents: ->
    @image = ->
    @finish = ->
    @_checkComplete = ->
    @_handleError = ->

  # The user should replace these methods; they are more or less events.
  onComplete: ->
  onError: ->


#### Exports
module.exports = Loader
