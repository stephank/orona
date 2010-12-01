# A basic Cakefile which compiles CoffeeScript sources for the server,
# and packages them for the client in a single JavaScript bundle.

fs     = require 'fs'
url    = require 'url'
path   = require 'path'
{puts} = require 'sys'
{exec} = require 'child_process'

villain     = require 'villain/build/cake'
villainMain = require 'villain'

if process.env.YUICSSMIN
  eval fs.readFileSync(process.env.YUICSSMIN, 'utf-8')


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

# Bundle a bunch of stylesheets and their imports. The options hash can contain:
#
#  * `files`: The base files to bundle.
#  * `path`: The directories to look in for `@import` dependencies.
#
# Note that because of the way this function looks for dependencies, this set-up doesn't deal well
# with imports into subdirectories. It also doesn't deal with media-specific imports, or some
# unconventional import syntax. But it's good enough for jQuery UI themes.
bundleStyles = (output, options) ->
  options.path ||= []
  options.files ||= []

  for inputFile in options.files
    puts "      css : #{inputFile}"
    css = fs.readFileSync inputFile, 'utf-8'
    pos = 0
    re = /@import\s+(?:url\()?("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\)?;/g
    while match = re.exec(css)
      output.write css.slice(pos, match.index)
      pos = match.index + match[0].length

      importPath = eval match[1]
      importFile = null
      for base in options.path
        importFile = "#{base}/#{importPath}"
        try
          fs.statSync importFile
          break
        catch e
          throw e unless e.errno == process.ENOENT
      throw new Error("Could not locate import: #{importPath}") if importFile == null
      bundleStyles output, files: [importFile], path: options.path

    output.write css.slice(pos)

createStyleCompressorStream = (wrappee) ->
  if process.env.YUICSSMIN
    css = ''
    return {
      write: (data) ->
        css += data
      end: ->
        puts "  compress : cssmin"
        wrappee.write YAHOO.compressor.cssmin(css), 'utf-8'
        wrappee.end()
    }
  else
    wrappee


## Tasks

task 'vendor:jquery-ui', 'Fetch jQuery and jQuery UI', ->
  unzip fetch "http://jquery-ui.googlecode.com/files/jquery-ui-#{JQUERYUI_VERSION}.zip"

task 'vendor:jquery-cookie', 'Fetch the jQuery cookie plugin', ->
  fetch 'http://plugins.jquery.com/files/jquery.cookie.js.txt'

# A task that recreates the `src/` directory structure under `lib/`, and
# compiles any CoffeeScript in the process.
task 'build:modules', 'Compile all Bolo modules', ->
  villain.compileDirectory 'src', 'lib'

# A task that takes the modules from `build:modules`, and packages them
# as a JavaScript bundle for shipping to the browser client.
task 'build:client:jsbundle', 'Compile the Bolo client JavaScript bundle', ->
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
        path.join('vendor', 'jquery.cookie.js.txt')
      ]
  output.end()

# A task that packages all stylesheets into a single compressed CSS file.
task 'build:client:cssbundle', 'Compile the Bolo client stylesheet bundle', ->
  output = createStyleCompressorStream fs.createWriteStream 'public/bolo-bundle.css'
  bundleStyles output,
    path: [
        'css'
        path.join(JQUERYUI_LIB, 'themes', 'base')
      ]
    files: [
        'css/bolo.css'
        path.join(JQUERYUI_LIB, 'themes', 'base', 'jquery.ui.all.css')
      ]
  output.end()

task 'build:client:manifest', 'Create the manifest file', ->
  dirtytag = Math.round(Math.random() * 10000)
  exec "git describe --always --dirty=-#{dirtytag}", (error, stdout) ->
    throw error if error
    rev = stdout.trim()

    images = ''
    for file in fs.readdirSync 'public/images/'
      images += "images/#{file}\n" unless file.match /\.gz$/

    sounds = ''
    for file in fs.readdirSync 'public/sounds/'
      sounds += "sounds/#{file}\n" unless file.match /\.gz$/

    fs.writeFileSync 'public/bolo.manifest',
      """
        CACHE MANIFEST
        # Version #{rev}

        bolo.html
        bolo-bundle.css
        bolo-bundle.js
        http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png

        #{images}
        #{sounds}
      """
    puts " manifest : public/bolo.manifest"

# The conventional default target.
task 'build', 'Compile Bolo', ->
  invoke 'vendor:jquery-ui'
  invoke 'vendor:jquery-cookie'
  invoke 'build:modules'
  invoke 'build:client:cssbundle'
  invoke 'build:client:jsbundle'
  invoke 'build:client:manifest'
