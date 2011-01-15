var createBoloAppServer = require('./lib/server/application'),
    createBoloIrcClient = require('./lib/server/irc');

var server = createBoloAppServer({
  "general": {
    "base": "http://orona.no.de",
    "maxgames": 5
  },
  "web": {
    "log": true,
    "gzip": true
  }
});
server.listen(80);

createBoloIrcClient(server, {
  "server": "irc.freenode.net",
  "encoding": "utf-8",
  "nick": "birnie",
  "channels": ["#orona"],
  "log": true,
  "user": {
    "username": "birnie",
    "realname": "Birnie West"
  }
});
