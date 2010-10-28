fs   = require 'fs'
path = require 'path'


class MapIndex
  constructor: (@mapPath, callback) ->
    @reindex callback

  reindex: (callback) ->
    @nameIndex = names = {}
    @fuzzyIndex = fuzzy = {}

    index = (file, callback) ->
      fs.stat file, (err, stats) ->
        if err
          console.log err.toString()
          return callback?()
        if stats.isDirectory()
          fs.readdir file, (err, subfiles) ->
            if err
              console.log err.toString()
              return callback?()
            counter = subfiles.length
            for subfile in subfiles
              index path.join(file, subfile), ->
                callback?() if --counter == 0
        else if m = /([^/]+?)\.map$/i.exec(file)
          descr = { name: m[1], path: file }
          names[descr.name] = fuzzy[descr.name.replace(/[\W_]+/g, '')] = descr
          callback?()
        else
          callback?()

    index @mapPath, callback
    return

  get: (name) ->
    @nameIndex[name]

  fuzzy: (s) ->
    input = s.replace(/[\W_]+/g, '')
    matcher = new RegExp input, 'i'
    results = []
    for fuzzed, descr of @fuzzyIndex
      if fuzzed == input
        return [descr]
      else if matcher.test(fuzzed)
        results.push descr
    results


## Exports
module.exports = MapIndex
