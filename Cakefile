# A basic Cakefile which compiles CoffeeScript sources for the server,
# and packages them for the client in a single JavaScript bundle.

fs      = require 'fs'
url     = require 'url'
{exec}  = require 'child_process'
villain = require 'villain/build/cake'


## Helpers

# Synchronous wget fetch helper.
fetch = (src) ->
  dest = 'vendor/' + src.split('/').pop()

  try
    fs.mkdirSync 'vendor', 0777
  catch e
    throw e unless e.errno == process.EEXIST

  try
    fs.statSync dest
    return dest
  catch e
    throw e unless e.errno == process.ENOENT

  puts "    fetch : #{dest}"
  exec "wget -q -O \"#{dest}\" \"#{src}\"", (error) ->
    throw error if error?
  # FIXME: Undocumented node.js function.
  process.loop()
  dest


## Tasks

task 'vendor:jqueryui', 'Fetch jQuery and jQuery UI', ->
  fetch 'http://jquery-ui.googlecode.com/files/jquery-ui-1.8.5.zip'
  fetch 'http://jquery-ui.googlecode.com/files/jquery-ui-themes-1.8.5.zip'

# A task that recreates the `src/` directory structure under `lib/`, and
# compiles any CoffeeScript in the process.
task 'build:modules', 'Compile all Bolo modules', ->
  villain.compileDirectory 'src', 'lib'

# A task that takes the modules from `build:modules`, and packages them
# as a JavaScript bundle for shipping to the browser client.
task 'build:client:bundle', 'Compile the Bolo client bundle', ->
  invoke 'build:modules'

  villain.simpleBundle 'public/bolo-bundle.js',
    'bolo/client': './lib/client/index.js'

task 'build:client:manifest', 'Create the manifest file', ->
  dirtytag = Math.round(Math.random() * 10000)
  exec "git describe --always --dirty=-#{dirtytag}", (error, stdout) ->
    throw error if error
    rev = stdout.trim()

    images = "img/#{file}" for file in fs.readdirSync 'public/img/'
    images = images.join("\n")

    sounds = "snd/#{file}" for file in fs.readdirSync 'public/snd/'
    sounds = sounds.join("\n")

    fs.writeFileSync 'public/bolo.manifest',
      """
        CACHE MANIFEST
        # Version #{rev}
        bolo.html
        http://code.jquery.com/jquery-1.4.2.min.js
        bolo-bundle.js
        bolo.css
        http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png
        #{images}
        #{sounds}
      """
    puts " manifest : public/bolo.manifest"

# The conventional default target.
task 'build', 'Compile Bolo', ->
  invoke 'build:client:bundle'
  invoke 'build:client:manifest'
