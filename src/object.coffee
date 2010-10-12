NetWorldObject = require 'villain/world/net/object'


# The base class for all world objects in Bolo.
class BoloObject extends NetWorldObject

  # Whether objects of this class are drawn using the regular 'base' tilemap, or the styled
  # tilemap. May also be `null`, in which case the object is not drawn at all.
  styled: null

  # Styled objects should set their `team` attribute to the appropriate team number in order to
  # get the team color styling.
  team: null

  # These are properties containing the world coordinates of this object. The value `null` for
  # either means that the object is not physical or 'not in the world' at this moment
  # (ie. dead tanks).
  x: null
  y: null

  # Emit a sound effect from this object's location.
  soundEffect: (sfx) ->
    @world.soundEffect(sfx, @x, @y, this)

  #### Abstract methods

  # Return the (x,y) index in the tilemap (base or styled, selected above) that the object should
  # be drawn with. May be a no-op if the object is never actually drawn.
  getTile: ->


## Exports
module.exports = BoloObject
