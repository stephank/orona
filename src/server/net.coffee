# The server networking context. It records changes in the object list —the critical updates— and
# makes them available in the 'changes' attribute. It also provides a method 'dump' that provides
# the attribute updates.


net    = require '../net'
{pack} = require '../struct'


class ServerContext
  constructor: (@sim) ->

  # The server context is a simulation authority.
  authority: yes

  # Clear the list of changes.
  activated: ->
    @changes = []

  # Record the creation.
  created: (obj) ->
    msg = pack('BB', net.CREATE_MESSAGE, obj.charCodeId).concat(obj.serialize(yes))
    @changes = @changes.concat msg

  # Record the destruction.
  destroyed: (obj) ->
    @changes = @changes.concat pack('BH', net.DESTROY_MESSAGE, obj.idx)

  # Record the map change.
  mapChanged: (cell, oldType, hadMine, oldLife) ->
    @changes = @changes.concat(pack('BBBBBf', net.MAPCHANGE_MESSAGE,
      cell.x, cell.y, cell.type.ascii.charCodeAt(0), cell.life, cell.mine
    ))

  # Record the sound effect.
  soundEffect: (sfx, x, y, owner) ->
    owner = if owner? then owner.idx else 65535
    @changes = @changes.concat(pack('BBHHH', net.SOUNDEFFECT_MESSAGE,
      sfx, x, y, owner
    ))

  # This method is specific to the server. It serializes all objects and concatenates the
  # updates into one large data block to be sent to the clients.
  dump: ->
    data = pack('B', net.UPDATE_MESSAGE)
    for obj in @sim.objects
      data = data.concat obj.serialize(no)
    data


#### Exports
module.exports = ServerContext
