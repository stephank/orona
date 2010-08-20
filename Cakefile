###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# Portions of this are based on: (both are MIT-licensed)
# - CoffeeScript's command.coffee, © 2010 Jeremy Ashkenas
# - Yabble's yabbler.js, © 2010 James Brantly

# FIXME: watch functionality, as in 'coffee -w ...'
# FIXME: minify client bundle
# FIXME: include jquery and yabble in client bundle

{puts}       = require 'sys'
fs           = require 'fs'
path         = require 'path'
{spawn}      = require 'child_process'
CoffeeScript = require 'coffee-script'


# Iterate (and read) the source files in the 'src' directory.
iterateSources = (directory, cb) ->
  fileNames = fs.readdirSync directory
  for fileName in fileNames
    filePath = path.join directory, fileName
    fileStat = fs.statSync filePath
    if fileStat.isDirectory()
      # Traverse into subdirectories.
      iterateSources filePath, cb
    else if path.extname(fileName) == '.coffee'
      # Or simply yield the file if it's a source file.
      code = fs.readFileSync filePath, 'utf-8'
      cb filePath, code
  undefined

# Build the lib/ output path for a file underneath src/.
buildOutputPath = (fileName) ->
  parts = fileName.split('/')
  parts[0] = 'lib'
  basename = parts.pop().replace(/\.coffee$/, '.js')

  # Create the parent directories.
  partial = ''
  for part in parts
    partial += "#{part}/"
    try
      fs.mkdirSync partial, 0777
    catch e
      false # No problem.

  parts.push(basename)
  parts.join('/')

# Build the bolo/ module path for a file underneath src/.
buildModulePath = (fileName) ->
  parts = fileName.split('/')
  parts[0] = 'bolo'
  parts.push parts.pop().replace(/\.coffee$/, '')
  parts.join('/')

# Wrap some JavaScript that came from some file into a module transport definition.
wrapModule = (code, fileName) ->
  moduleName = buildModulePath fileName
  dependencies = "'#{dep}'" for dep in determineDependencies(moduleName, code)

  """
    require.define({'#{moduleName}': function(require, exports, module) {
    #{code}
    }}, [#{dependencies.join(', ')}]);
  """

# Determine the module dependencies of a piece of JavaScript.
determineDependencies = (baseModule, code) ->
  dependencies = []

  # Walk through all the require() calls in the code.
  re = /(?:^|[^\w\$_.])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\s*\)/g
  while match = re.exec(code)
    # Find the actual full name of the reference module.
    dependency = resolveModuleId baseModule, eval(match[1])
    # Collect it.
    dependencies.push(dependency) unless dependency in dependencies

  dependencies

# Determine the full name of a module, that was required from some module in our package.
resolveModuleId = (baseModule, requirePath) ->
  # If it's not a relative path, just return it as is.
  return requirePath unless requirePath.charAt(0) == '.'

  # Get the base module directory we're going to start our search with.
  retval = baseModule.split('/')
  retval.pop()  # Pop the actual module name of baseModule.

  # Walk the require-path.
  for part in requirePath.split('/')
    switch part
      when '.'  then continue
      when '..' then retval.pop()
      else           retval.push(part)

  # Return it as a string.
  return retval.join('/')


# Task definitions.

task 'build:client', 'Compile the Bolo client-side module bundle', ->
  output = fs.openSync 'public/bolo-bundle.js', 'w'
  iterateSources 'src', (fileName, code) ->
    js = CoffeeScript.compile code, { fileName, noWrap: yes }
    wrappedJs = wrapModule js, fileName
    fs.writeSync output, wrappedJs
    puts "Compiled #{fileName}"
  fs.closeSync output
  puts "Done."

task 'build:server', 'Compile the Bolo server-side modules', ->
  iterateSources 'src', (fileName, code) ->
    js = CoffeeScript.compile code, { fileName }
    output = buildOutputPath fileName
    fs.writeFileSync output, js
    puts "Compiled #{fileName}"
  puts "Done."

task 'build', 'Compile the Bolo client and server.', ->
  invoke 'build:server'
  invoke 'build:client'

task 'run', 'Compile the Bolo client and server, then run the server', ->
  invoke 'build'
  spawn 'bin/bolo-server', [], customFds: [process.stdout, process.stdout -1]
