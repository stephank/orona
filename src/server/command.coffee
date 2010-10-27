{puts} = require 'sys'
createBoloAppServer = require './application'

PORT = 8124

exports.run = ->
  server = createBoloAppServer log: yes, gzip: yes
  server.listen PORT
  puts "Bolo server listening on port #{PORT}."
