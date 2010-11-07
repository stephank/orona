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
      m.person.ident = "#{m.person.user}@#{m.person.host}"
      m.say = (text) =>
        @client.privmsg m.channel, "#{m.person.nick}: #{text}", yes
      for watcher in @watchers
        if m.match_data = m.text.match(watcher.re)
          if watcher.onlyAdmin and m.person.ident != options.admin
            m.say "I can't let you do that."
          else
            watcher.callback(m)
          break
      return

    @client.addListener 'disconnected', =>
      @reconnectTimer = setTimeout =>
        @reconnectTimer = null
        @client.connect()
      , 10000

    @client.connect()

  watch_for: (re, callback) ->
    @watchers.push {re, callback}
  watch_for_admin: (re, callback) ->
    @watchers.push {re, callback, onlyAdmin: yes}


# The gist of the IRC functionality we provide.
createBoloIrcClient = (server, options) ->
  irc = new BoloIrc(options)

  findHisGame = (ident) ->
    for gid, game of server.app.games
      return game if game.owner == ident
    return

  irc.watch_for /^map\s+(.+?)$/, (m) ->
    return m.say "You already have a game open." if findHisGame(m.person.ident)
    return m.say "All game slots are full at the moment." unless server.app.haveOpenSlots()

    matches = server.app.maps.fuzzy m.match_data[1]
    if matches.length == 1
      [descr] = matches
      fs.readFile descr.path, (err, data) ->
        return m.say "Having some trouble loading that map, sorry." if err
        game = server.app.createGame(data)
        game.owner = m.person.ident
        m.say "Started game “#{descr.name}” at: #{game.url}"
    else if matches.length == 0
      m.say "I can't find any map like that."
    else if matches.length > 4
      m.say "You need to be a bit more specific than that."
    else
      names = "“#{descr.name}”" for descr in matches
      m.say "Did you mean one of these: #{names.join(', ')}"

  irc.watch_for /^close$/, (m) ->
    return m.say "You don't have a game open." unless game = findHisGame(m.person.ident)
    server.app.closeGame(game)
    m.say "Your game was closed."

  irc.watch_for_admin /^reindex$/, (m) ->
    server.app.maps.reindex ->
      m.say "Index rebuilt."

  irc


## Exports
module.exports = createBoloIrcClient
