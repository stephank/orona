class Vignette

  constructor: ->
    @container = $('<div class="vignette"/>').appendTo('body')
    @messageLine = $('<div class="vignette-message"/>').appendTo(@container)

  message: (text) ->
    @messageLine.text(text)

  showProgress: ->
    # FIXME

  hideProgress: ->
    # FIXME

  progress: (p) ->
    # FIXME

  destroy: ->
    @container.remove()
    @container = @messageLine = null


## Exports
module.exports = Vignette
