BoloLocalWorld   = require './world/local'
BoloNetworkWorld = require './world/client'


## Exports

if location.hostname.split('.')[1] == 'github'
  module.exports = BoloLocalWorld
else
  module.exports = BoloNetworkWorld
