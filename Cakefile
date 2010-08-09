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
CoffeeScript = require 'coffee-script'

# The assumption for all modules we are compiling is that they live under this package.
PACKAGE_NAME = 'bolo'


# Iterate (and read) the source files in the 'src' directory.
iterateSources = (cb) ->
  fileNames = fs.readdirSync 'src'
  for fileName in fileNames
    continue unless path.extname(fileName) == '.coffee'
    code = fs.readFileSync path.join('src', fileName), 'utf-8'
    cb fileName, code
  undefined

# Wrap some JavaScript that came from some file into a module transport definition.
wrapModule = (code, fileName) ->
  moduleName = path.basename(fileName, path.extname(fileName))
  moduleId = resolveModuleId "./#{moduleName}"
  dependencies = "'#{dep}'" for dep in determineDependencies(code)

  """
    require.define({ '#{moduleId}': function(require, exports, module) {
    #{code}
    }}, [#{dependencies.join(', ')}]);
  """

# Determine the module dependencies of a piece of JavaScript.
determineDependencies = (code) ->
  dependencies = []
  re = /(?:^|[^\w\$_.])require\s*\(\s*("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\s*\)/g
  while match = re.exec(code)
    dependency = resolveModuleId eval(match[1])
    dependencies.push(dependency) unless dependency in dependencies
  dependencies

# Determine the full name of a module, that was required from some module in our package.
resolveModuleId = (path) ->
  return path unless path.charAt(0) == '.'
  retval = [PACKAGE_NAME]
  for part in path.split('/')
    switch part
      when '.'  then continue
      when '..' then retval.pop()
      else           retval.push(part)
  return retval.join('/')


task 'build:client', 'Compile the Bolo client-side module bundle', ->
  output = fs.openSync 'bolo-bundle.js', 'w'
  iterateSources (fileName, code) ->
    js = CoffeeScript.compile code, { fileName, noWrap: yes }
    wrappedJs = wrapModule js, fileName
    fs.writeSync output, wrappedJs
    puts "Compiled #{fileName}"
  fs.closeSync output
  puts "Done."

task 'build:server', 'Compile the Bolo server-side modules', ->
  iterateSources (fileName, code) ->
    js = CoffeeScript.compile code, { fileName }
    output = path.basename(fileName, path.extname(fileName)) + '.js'
    fs.writeFileSync path.join('lib', output), js
    puts "Compiled #{fileName}"
  puts "Done."
