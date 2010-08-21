// Brequire - CommonJS support for the browser
function require(path) {
  var module = require.modules[path];
  if(!module) {
    throw("couldn't find module for: " + path);
  }
  if(!module.exports) {
    module.exports = {};
    module.call(module.exports, module, module.exports, require.bind(path, module.directory));
  }
  return module.exports;
}

require.modules = {};

require.bind = function(path, directory) {
  return function(p) {
    if (p.charAt(0) != '.') return require(p);

    var cwd = path.split('/');
    if (!directory) cwd.pop();

    var parts = p.split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      var part = parts[i];
      if (part == '.') {}
      else if (part == '..') cwd.pop();
      else cwd.push(part)
    }
    return require(cwd.join('/'));
  };
};

require.module = function(path, directory, fn) {
  if (typeof(directory) === "boolean") {
    fn.directory = directory;
  }
  else {
    fn = directory;
    fn.directory = false;
  }
  require.modules[path] = fn;
};
