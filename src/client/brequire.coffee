# Brequire - CommonJS support for the browser.
# This version is slightly modified, and rewritten in CoffeeScript.


require = (path) ->
  unless m = require.modules[path]
    throw "Couldn't find module for: #{path}"

  unless m.exports
    m.exports = {}
    m.call m.exports, m, m.exports, require.bind(path, m.directory)

  m.exports

require.modules = {}

require.bind = (path, directory) ->
  (p) ->
    return require(p) unless p.charAt(0) == '.'

    cwd = path.split('/')
    cwd.pop() unless directory

    for part in p.split('/')
      if part == '..' then cwd.pop()
      else unless part == '.' then cwd.push(part)

    require cwd.join('/')

require.module = (path, directory, fn) ->
  fn.directory =
    if typeof(directory) == 'boolean'
      directory
    else
      fn = directory
      no

  require.modules[path] = fn


# Exports.
window.require = require
