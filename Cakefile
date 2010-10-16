# A basic Cakefile which compiles CoffeeScript sources for the server,
# and packages them for the client in a single JavaScript bundle.

fs     = require 'fs'
url    = require 'url'
path   = require 'path'
{exec} = require 'child_process'

villain     = require 'villain/build/cake'
villainMain = require 'villain'


## Helpers

# Dependency versions we use.
JQUERY_VERSION   = '1.4.2'
JQUERYUI_VERSION = '1.8.5'

# Base paths to dependencies.
VILLAIN_LIB = villainMain.getLibraryPath()
JQUERYUI_LIB = path.join 'vendor', "jquery-ui-#{JQUERYUI_VERSION}"

# Create the path to a jQuery UI module.
uipath = (name) -> path.join JQUERYUI_LIB, 'ui', "jquery.ui.#{name}.js"

# Synchronous wget fetch helper. Also checks if target already exists.
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

# Synchronous unzip helper. Also checks if target already exists.
unzip = (zipfile) ->
  dir = path.dirname zipfile
  dest = zipfile.replace /\.zip$/, ''
  try
    fs.statSync dest
    return dest
  catch e
    throw e unless e.errno == process.ENOENT

  puts "    unzip : #{zipfile}"
  exec "unzip -d \"#{dir}\" -a \"#{zipfile}\"", (error) ->
    throw error if error?
  # FIXME: Undocumented node.js function.
  process.loop()
  dest


## Tasks

task 'vendor:jqueryui', 'Fetch jQuery and jQuery UI', ->
  unzip fetch "http://jquery-ui.googlecode.com/files/jquery-ui-#{JQUERYUI_VERSION}.zip"
  unzip fetch "http://jquery-ui.googlecode.com/files/jquery-ui-themes-#{JQUERYUI_VERSION}.zip"

# A task that recreates the `src/` directory structure under `lib/`, and
# compiles any CoffeeScript in the process.
task 'build:modules', 'Compile all Bolo modules', ->
  villain.compileDirectory 'src', 'lib'

# A task that takes the modules from `build:modules`, and packages them
# as a JavaScript bundle for shipping to the browser client.
task 'build:client:bundle', 'Compile the Bolo client bundle', ->
  invoke 'vendor:jqueryui'
  invoke 'build:modules'

  output = villain.createCompressorStream fs.createWriteStream 'public/bolo-bundle.js'
  villain.bundleSources output,
    env:
      'villain': VILLAIN_LIB
      'events': path.join(VILLAIN_LIB, 'util', 'events.js')
    modules:
      'bolo/client': './lib/client/index.js'
    additional: [
        path.join(VILLAIN_LIB, 'util', 'brequire.js')
        path.join(JQUERYUI_LIB, "jquery-#{JQUERY_VERSION}.js")
        uipath('core')
        uipath('widget')
        uipath('position')
        uipath('button')
        uipath('dialog')
        uipath('tabs')
        uipath('progressbar')
      ]
  output.end()

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
