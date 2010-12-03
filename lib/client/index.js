(function() {
  var BoloLocalWorld, BoloNetworkWorld;
  BoloLocalWorld = require('./world/local');
  BoloNetworkWorld = require('./world/client');
  if (location.search === '?local' || location.hostname.split('.')[1] === 'github') {
    module.exports = BoloLocalWorld;
  } else {
    module.exports = BoloNetworkWorld;
  }
}).call(this);
