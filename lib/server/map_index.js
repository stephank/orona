(function() {
  var MapIndex, fs, path;
  var __hasProp = Object.prototype.hasOwnProperty;
  fs = require('fs');
  path = require('path');
  MapIndex = function() {
    function MapIndex(mapPath, callback) {
      this.mapPath = mapPath;
      this.reindex(callback);
    }
    MapIndex.prototype.reindex = function(callback) {
      var fuzzy, index, names;
      this.nameIndex = names = {};
      this.fuzzyIndex = fuzzy = {};
      index = function(file, callback) {
        return fs.stat(file, function(err, stats) {
          var descr, m;
          if (err) {
            console.log(err.toString());
            return typeof callback === "function" ? callback() : void 0;
          }
          if (stats.isDirectory()) {
            return fs.readdir(file, function(err, subfiles) {
              var counter, _fn, _i, _len, _results;
              if (err) {
                console.log(err.toString());
                return typeof callback === "function" ? callback() : void 0;
              }
              counter = subfiles.length;
              _fn = function(subfile) {
                return _results.push(index(path.join(file, subfile), function() {
                  if (--counter === 0) {
                    return typeof callback === "function" ? callback() : void 0;
                  }
                }));
              };
              _results = [];
              for (_i = 0, _len = subfiles.length; _i < _len; _i++) {
                subfile = subfiles[_i];
                _fn(subfile);
              }
              return _results;
            });
          } else if (m = /([^/]+?)\.map$/i.exec(file)) {
            descr = {
              name: m[1],
              path: file
            };
            names[descr.name] = fuzzy[descr.name.replace(/[\W_]+/g, '')] = descr;
            return typeof callback === "function" ? callback() : void 0;
          } else {
            return typeof callback === "function" ? callback() : void 0;
          }
        });
      };
      index(this.mapPath, callback);
      return;
    };
    MapIndex.prototype.get = function(name) {
      return this.nameIndex[name];
    };
    MapIndex.prototype.fuzzy = function(s) {
      var descr, fuzzed, input, matcher, results, _ref;
      input = s.replace(/[\W_]+/g, '');
      matcher = new RegExp(input, 'i');
      results = [];
      _ref = this.fuzzyIndex;
      for (fuzzed in _ref) {
        if (!__hasProp.call(_ref, fuzzed)) continue;
        descr = _ref[fuzzed];
        if (fuzzed === input) {
          return [descr];
        } else if (matcher.test(fuzzed)) {
          results.push(descr);
        }
      }
      return results;
    };
    return MapIndex;
  }();
  module.exports = MapIndex;
}).call(this);
