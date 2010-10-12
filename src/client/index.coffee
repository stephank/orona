BoloLocalWorld   = require './world/local'
BoloNetworkWorld = require './world/client'


## Exports

if location.search == '?local' or location.hostname.split('.')[1] == 'github'
  module.exports = BoloLocalWorld
else
  module.exports = BoloNetworkWorld
