{sqrt, atan2} = Math


# Extend a source object with the properties of another object (shallow copy).
# We use this to simulate Node's deprecated `process.mixin`.
extend = exports.extend = (object, properties) ->
  for all key, val of properties
    object[key] = val
  object

# Calculate the distance between two objects.
distance = exports.distance = (a, b) ->
  dx = a.x - b.x; dy = a.y - b.y
  sqrt(dx*dx + dy*dy)

# Calculate the heading from `a` towards `b` in radians.
heading = exports.heading = (a, b) ->
  atan2(b.y - a.y, b.x - a.x)
