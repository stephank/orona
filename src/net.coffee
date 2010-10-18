# Orona uses two WebSocket connections during play. The first is the lobby connection, which is
# always open, and is also used for in-game chat. The second is used for world synchronization,
# which is kept separate so that the lobby connection cannot impede network performance of game
# updates (or at least diminish the effect).

# The collecting of data of world updates is governed by this module. World updates are split up
# in two kinds of messages.

# The first are critical updates, which are object creation an destruction. Both the server and
# client have lists of objects that are kept in sync. In order to do that, these updates are
# transmitted reliably to clients. (But actual transport is not done by this module.)

# The second are attribute updates for existing objects. A single update message of this kind
# (currently) contains a complete set of updates for all world objects. There are no differential
# updates, so it's okay for the underlying transport to drop some of these.


# These are the server message identifiers both sides need to know about.
# The server sends binary data (encoded as base64). So we need to compare character codes.
exports.WELCOME_MESSAGE     = 'W'.charCodeAt(0)
exports.CREATE_MESSAGE      = 'C'.charCodeAt(0)
exports.DESTROY_MESSAGE     = 'D'.charCodeAt(0)
exports.MAPCHANGE_MESSAGE   = 'M'.charCodeAt(0)
exports.UPDATE_MESSAGE      = 'U'.charCodeAt(0)
exports.TINY_UPDATE_MESSAGE = 'u'.charCodeAt(0)
exports.SOUNDEFFECT_MESSAGE = 'S'.charCodeAt(0)

# And these are the client's messages. The client just sends one-character ASCII messages.
exports.START_TURNING_CCW  = 'L'; exports.STOP_TURNING_CCW  = 'l'
exports.START_TURNING_CW   = 'R'; exports.STOP_TURNING_CW   = 'r'
exports.START_ACCELERATING = 'A'; exports.STOP_ACCELERATING = 'a'
exports.START_BRAKING      = 'B'; exports.STOP_BRAKING      = 'b'
exports.START_SHOOTING     = 'S'; exports.STOP_SHOOTING     = 's'
exports.BUILD_ORDER        = 'O'
