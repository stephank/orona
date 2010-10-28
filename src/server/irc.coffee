jerk = require 'jerk'


createBoloIrcClient = (server, options) ->
  client = jerk (j) ->
    j.watch_for new RegExp("^#{options.nick}[:, ]+map\\s+(.+?)\\s*$"), (m) ->
      mapName = m.match_data[1]
      # FIXME: validate input
      game = server.app.createGame(mapName)
      m.say "#{m.user}: #{mapName} - #{game.url}"

  client.connect options
  client


## Exports
module.exports = createBoloIrcClient
