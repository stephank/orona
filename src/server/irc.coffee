fs  = require 'fs'
IRC = require 'irc-js'


# This mimics basic Jerk functionality, but only accepts commands in channels,
# and only when the bot is addressed by its nickname. It also automatically reconnects.
class BoloIrc
  constructor: (options) ->
    @didAddressMe = new RegExp("^#{options.nick}[:, ]+(.+?)\\s*$", 'i')
    @watchers = []
    @client = new IRC(options)

    if options.channels?.length
      @client.addListener 'connected', =>
        @client.join options.channels.join(',')

    @client.addListener 'privmsg', (m) =>
      return unless (m.channel = m.params[0]).charAt(0) == '#'
      completeText = m.params[m.params.length - 1]
      return unless match = @didAddressMe.exec(completeText)
      m.text = match[1]
      m.say = (text) =>
        @client.privmsg m.channel, "#{m.person.nick}: #{text}", yes
      for [re, callback] in @watchers
        return callback(m) if m.match_data = m.text.match(re)

    @client.addListener 'disconnected', =>
      @reconnectTimer = setTimeout =>
        @reconnectTimer = null
        @client.connect()
      , 10000

    @client.connect()

  watch_for: (re, callback) ->
    @watchers.push [re, callback]


# The gist of the IRC functionality we provide.
createBoloIrcClient = (server, options) ->
  irc = new BoloIrc(options)

  irc.watch_for /^map\s+(.+?)$/, (m) ->
    # FIXME: Limit number of games, and one per user.
    if descr = server.app.maps.fuzzy m.match_data[1]
      fs.readFile descr.path, (err, data) ->
        return m.say "Having some trouble loading that map, sorry." if err
        game = server.app.createGame(data)
        m.say "Started game “#{descr.name}” at: #{game.url}"
    else
      m.say "I don't seem to have that map, sorry."

  irc.watch_for /^reindex$/, (m) ->
    # FIXME: Only allow admins to do this!
    server.app.maps.reindex ->
      m.say "Index rebuilt."

  irc


## Exports
module.exports = createBoloIrcClient
