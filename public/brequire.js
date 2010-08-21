// Brequire - CommonJS support for the browser
function require(path) {
  console.debug(path);
  var module = require.modules[path];
  if(!module) {
    throw("couldn't find module for: " + path);
  }
  if(!module.exports) {
    module.exports = {};
    module.call(module.exports, module, module.exports, require.bind(path));
  }
  return module.exports;
}

require.modules = {};

require.bind = function(path) {
  var cwd = path.replace(/[^\/]*$/,"");
  return function(p) {
    p = (cwd + p).replace(/\/\.\//, "/").replace(/[^\/]*\/\.\./,"").replace(/\/\//,"/");
    return require(p);
  };
};

require.module = function(path, fn) {
  require.modules[path] = fn;
};
