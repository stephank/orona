###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# The loader takes care of loading a bunch of resources, providing progress information,
# firing a single event when everything is complete, and exposing resources in a tidy structure.
# FIXME: Add audio file support. Needs to be smart about supported formats.
# FIXME: Implement progress notification.
class Loader
  constructor: ->
    @resources =
      images: {}

    @finished = no

  # Load an image.
  image: (name) ->
    @resources.images[name] = img = new Image()
    $(img).load => @_checkComplete()
    $(img).error => @_handleError(img)
    img.src = "img/#{name}.png"
    img

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
    @onComplete()

  # Make sure no further events are fired, then call onError.
  _handleError: (resource) ->
    cb = @onError

    # Replace methods with empty functions.
    @image = ->
    @finish = ->
    @checkComplete = ->
    @handleError = ->

    cb(resource)

  # The user should replace these methods; they are more or less events.
  onComplete: ->
  onError: ->


# Exports.
module.exports = Loader
