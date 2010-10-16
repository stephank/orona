{EventEmitter} = require 'events'


## Progress tracking

# A generic progress tracking mechanism. Typical usage is as follows:
#
#  * Add a number of tasks using calls to `add`.
#  * Install listeners for `progress` and `complete`.
#  * Call `wrapUp` to signal all tasks have been started.
#  * Wait for the `complete` signal, and continue as normal.
#
# Typically, you specify an amount of tasks that are running, but it could just as well be a
# remaining byte count or a percentage. The `amount` parameters are arbitrary numbers.

class Progress extends EventEmitter

  constructor: (initialAmount) ->
    @total = if initialAmount? then initialAmount else 0
    @completed = 0
    @wrappingUp = no

  # Add the given amount to the total. `amount` is optional, and defaults to 1. The return value is
  # a function that is a shortcut for `step(amount)`, and can be used as a callback for an event
  # listener. If given, the returned function will call `cb` as well, allowing for chaining.
  add: (args...) ->
    if typeof args[0] == 'number'   then amount = args.shift() else amount = 1
    if typeof args[0] == 'function' then cb     = args.shift() else cb = null
    @total += amount
    @emit 'progress', this
    return =>
      @step(amount)
      cb?()

  # Mark the given amount as completed. `amount` is optional, and defaults to 1.
  step: (amount) ->
    amount = 1 unless amount?
    @completed += amount
    @emit 'progress', this
    @checkComplete()

  # Reset the both `total` and `completed` counters.
  set: (@total, @completed) ->
    @emit 'progress', this
    @checkComplete()

  # Signal that all tasks are running, and no further `add` calls will be made. From this point on,
  # a `complete` event may be emitted. (Note: it may also be emitted from *within* this method.)
  wrapUp: ->
    @wrappingUp = yes
    @checkComplete()

  # An internal helper that emits the 'complete' signal when appropriate.
  checkComplete: ->
    return unless @wrappingUp and @completed >= @total
    @emit 'complete'


## Exports

module.exports = Progress
