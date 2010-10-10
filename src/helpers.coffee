# These helpers were taken from CoffeeScript.

# Extend a source object with the properties of another object (shallow copy).
# We use this to simulate Node's deprecated `process.mixin`.
extend = exports.extend = (object, properties) ->
  for all key, val of properties
    object[key] = val
  object
