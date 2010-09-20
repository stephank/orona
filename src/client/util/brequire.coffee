# Brequire - CommonJS support for the browser.
# This version is slightly modified, and rewritten in CoffeeScript.


# The require function loads the module on-demand, or returns the existing `exports` object in case
# the module is already loaded.
require = (path) ->
  unless m = require.modules[path]
    throw "Couldn't find module for: #{path}"

  unless m.exports
    m.exports = {}
    m.call m.exports, m, m.exports, require.bind(path, m.directory)

  m.exports

# Our index of modules.
require.modules = {}

# Helper used to create the `require` function used in the inner scope of the module. It takes
# care of making paths relative to the current module work as expected.
require.bind = (path, directory) ->
  (p) ->
    return require(p) unless p.charAt(0) == '.'

    cwd = path.split('/')
    cwd.pop() unless directory

    for part in p.split('/')
      if part == '..' then cwd.pop()
      else unless part == '.' then cwd.push(part)

    require cwd.join('/')

# The function used to define a module. Each module that is loaded into the browser should be
# wrapped with a call to this function.
require.module = (path, directory, fn) ->
  fn.directory =
    if typeof(directory) == 'boolean'
      directory
    else
      fn = directory
      no

  require.modules[path] = fn


#### Exports
window.require = require
