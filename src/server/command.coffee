{puts} = require 'sys'
fs     = require 'fs'
path   = require 'path'
createBoloAppServer = require './application'
createBoloIrcClient = require './irc'

exports.run = ->
  # FIXME: I want YAML, damnit!
  if process.argv.length != 3
    puts "Usage: bolo-server <config.json>"
    puts "If the file does not exist, a sample will be created."
    return

  try
    content = fs.readFileSync process.argv[2], 'utf-8'
  catch e
    if e.errno != process.ENOENT
      puts "I was unable to read that file."
      throw e

    samplefile = path.join(path.dirname(fs.realpathSync(__filename)), '../../config.json.sample')
    sample = fs.readFileSync samplefile, 'utf-8'
    try
      fs.writeFileSync process.argv[2], sample, 'utf-8'
    catch e2
      puts "Oh snap! I want to create a sample configuration, but can't."
      throw e2
    puts "I created a sample configuration for you."
    puts "Please edit the file, then run the same command again."
    return

  try
    config = JSON.parse content
  catch e
    puts "I don't understand the contents of that file."
    throw e

  server = createBoloAppServer config
  server.listen config.web.port
  puts "Bolo server listening on port #{config.web.port}."

  if config.irc
    for link, options of config.irc
      createBoloIrcClient(server, options)

  return
