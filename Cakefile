# Portions of this are based on: (both are MIT-licensed)
# - CoffeeScript's command.coffee, © 2010 Jeremy Ashkenas
# - Yabble's yabbler.js, © 2010 James Brantly

# FIXME: watch functionality, as in 'coffee -w ...'

{puts}       = require 'sys'
fs           = require 'fs'
path         = require 'path'
{spawn}      = require 'child_process'
CoffeeScript = require 'coffee-script'


# Determine the module dependencies of a piece of JavaScript.
determineDependencies = (module) ->
  retval = []

  # Walk through all the require() calls in the code.
  re = /(?:^|[^\w\$_.])require(?:\s+|\s*\(\s*)("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g
  while match = re.exec(module.code)
    requirePath = eval match[1]
    dep = { external: no }

    # An absolute path, assume it's an external dependency.
    unless requirePath.charAt(0) == '.'
      dep.name = requirePath
      dep.external = yes

    # Find the module name and file name of this dependency
    else
      # Get the base directory we're going to start our search with.
      fileParts = module.file.split('/')
      nameParts = module.name.split('/')
      nameParts.pop() unless fileParts.pop() == 'index.coffee'

      # Walk the require-path.
      for part in requirePath.split('/')
        switch part
          when '.'  then continue
          when '..' then nameParts.pop();      fileParts.pop()
          else           nameParts.push(part); fileParts.push(part)

      # Set the module attributes. For the filename, we need to check if the path
      # is pointing at a file or a directory. In the latter, we use the 'index'
      # module inside the directory.
      dep.name = nameParts.join('/')
      fileName =  fileParts.join('/')
      try
        fileStat = fs.statSync(fileName)
        dep.directory = true
      catch e
        dep.directory = false
      if dep.directory
        unless fileStat.isDirectory()
          throw new Error("Expected '#{fileName}' to be a directory.")
        dep.file = "#{fileName}/index.coffee"
      else
        # Assume there's a '.coffee' source file.
        dep.file = "#{fileName}.coffee"

    # Collect it.
    retval.push(dep)

  retval

# Iterate on the given module and its dependencies.
iterateDependencyTree = (module, depsSeen, cb) ->
  # On first invocation, we're given different parameters.
  if typeof(module) == 'string'
    [fileName, moduleName, cb] = arguments
    # The specified file is assumed to have the module identifier given by moduleName.
    # All the dependencies will be given module names relative to this.
    module = { name: moduleName, file: fileName, external: no }
    module.directory = (fileName.substr(-13) == '/index.coffee')
    depsSeen = []

  # Check to see if we've already iterated this module.
  for dep in depsSeen
    return if module.name == dep.name
  depsSeen.push module

  # Read the source code.
  module.code = fs.readFileSync module.file, 'utf-8'
  # Store the dependencies here, so the callback may use them.
  module.dependencies = determineDependencies(module)
  # Callback on the module.
  cb(module)
  # Recurse for dependencies, unless external.
  for dep in module.dependencies
    iterateDependencyTree(dep, depsSeen, cb) unless dep.external
  return

# Wrap some JavaScript that came from some file into a module transport definition.
wrapModule = (module, js) ->
  """
    require.module('#{module.name}', #{module.directory}, function(module, exports, require) {
    #{js}
    });
    
  """

# Build the lib/ output path for a file underneath src/.
buildOutputPath = (module) ->
  parts = module.file.split('/')
  parts[0] = 'lib'
  basename = parts.pop().replace(/\.coffee$/, '.js')

  # Create the parent directories.
  partial = ''
  for part in parts
    partial += "#{part}/"
    try
      fs.mkdirSync partial, 0777
    catch e
      false # Assume already exists.

  parts.push(basename)
  parts.join('/')


# Task definitions.

task 'build:client', 'Compile the Bolo client-side module bundle', ->
  puts "Building Bolo client JavaScript bundle..."
  output = fs.createWriteStream 'public/bolo-bundle.js'

  realOutput = output
  compressor =
    if closure = process.env.CLOSURE
      spawn 'java', ['-jar', closure]
    else if uglifyjs = process.env.UGLIFYJS
      spawn 'node', [uglifyjs]
    else
      null
  if compressor
    output = compressor.stdin
    compressor.stdout.on 'data', (buffer) -> realOutput.write buffer
    compressor.stderr.on 'data', (buffer) -> process.stdout.write buffer
    compressor.on 'exit', -> realOutput.end()

  brequireFile = 'src/client/util/brequire.coffee'
  brequireCode = fs.readFileSync brequireFile, 'utf-8'
  js = CoffeeScript.compile brequireCode, fileName: brequireFile
  output.write js
  puts "Compiled '#{brequireFile}'."

  eventsFile = 'src/client/util/events.js'
  eventsCode = fs.readFileSync eventsFile, 'utf-8'
  wrappedJs = wrapModule { name: 'events', directory: no }, eventsCode
  output.write wrappedJs
  puts "Compiled '#{eventsFile}'."

  iterateDependencyTree 'src/client/index.coffee', 'bolo/client', (module) ->
    js = CoffeeScript.compile module.code, fileName: module.file, noWrap: yes
    wrappedJs = wrapModule module, js
    output.write wrappedJs
    puts "Compiled '#{module.file}'."

  output.end()
  puts "Waiting for compressor to finish..." if compressor
  realOutput.on 'close', ->
    puts "Done."
    puts ""

task 'build:server', 'Compile the Bolo server-side modules', ->
  puts "Building Bolo server modules..."
  iterateDependencyTree 'src/server/index.coffee', 'bolo/server', (module) ->
    js = CoffeeScript.compile module.code, fileName: module.file
    output = buildOutputPath module
    fs.writeFileSync output, js
    puts "Compiled '#{module.file}'."
  puts "Done."
  puts ""

task 'build:sounds', 'Build encoded Bolo sound files', ->
  puts "Building encoded Bolo sound files..."

  totalProcesses = 0; completedProcesses = 0
  allStarted = no
  addSubprocess = (sub) ->
    totalProcesses++
    sub.stdout.on 'data', (buffer) -> process.stdout.write buffer
    sub.stderr.on 'data', (buffer) -> process.stdout.write buffer
    sub.on 'exit', -> completedProcesses++
  checkComplete = ->
    return unless allStarted and completedProcesses == totalProcesses
    puts "Done."
    puts ""
  finish = ->
    puts "Waiting for encoders to finish..."
    allStarted = yes
    checkComplete()

  for snd in fs.readdirSync('public/snd') when snd.substr(-4) == '.wav'
    fullname = "public/snd/#{snd}"
    basename = snd.substr(0, snd.length - 4)
    puts "Encoding '#{fullname}'."

    oggname = "public/snd/#{basename}.ogg"
    addSubprocess spawn('oggenc', ['-Q', '-o', oggname, fullname])

    mp3name = "public/snd/#{basename}.mp3"
    addSubprocess spawn('lame', ['--quiet', fullname, mp3name])
  finish()

task 'build', 'Compile the Bolo client and server.', ->
  invoke 'build:server'
  invoke 'build:client'
  invoke 'build:sounds'
