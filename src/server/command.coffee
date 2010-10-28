{puts} = require 'sys'
fs     = require 'fs'
createBoloAppServer = require './application'
createBoloIrcClient = require './irc'

exports.run = ->
  # FIXME: I want YAML, damnit!
  if process.argv.length != 3
    puts "Usage: bolo-server <config.json>"
    return
  config = JSON.parse fs.readFileSync(process.argv[2], 'utf-8')

  server = createBoloAppServer config
  server.listen config.web.port
  puts "Bolo server listening on port #{config.web.port}."

  if config.irc
    for link, options of config.irc
      createBoloIrcClient(server, options)

  return
