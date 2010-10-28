fs   = require 'fs'
jerk = require 'jerk'


createBoloIrcClient = (server, options) ->
  client = jerk (j) ->
    j.watch_for new RegExp("^#{options.nick}[:, ]+map\\s+(.+?)\\s*$"), (m) ->
      # FIXME: Limit number of games, and one per user.
      if descr = server.app.maps.fuzzy m.match_data[1]
        fs.readFile descr.path, (err, data) ->
          return m.say "#{m.user}: Having some trouble loading that map, sorry." if err
          game = server.app.createGame(data)
          m.say "#{m.user}: Started game “#{descr.name}” at: #{game.url}"
      else
        m.say "#{m.user}: I don't seem to have that map, sorry."

    j.watch_for new RegExp("^#{options.nick}[:, ]+reindex\\s*$"), (m) ->
      # FIXME: Only allow admins to do this!
      server.app.maps.reindex ->
        m.say "#{m.user}: Index rebuilt."

  client.connect options
  client


## Exports
module.exports = createBoloIrcClient
