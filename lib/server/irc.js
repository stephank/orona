(function() {
  var BoloIrc, IRC, createBoloIrcClient, fs;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty;
  fs = require('fs');
  IRC = require('irc-js');
  BoloIrc = function() {
    function BoloIrc(options) {
      var _ref;
      this.didAddressMe = new RegExp("^" + options.nick + "[:, ]+(.+?)\\s*$", 'i');
      this.watchers = [];
      this.client = new IRC(options);
      if ((_ref = options.channels) != null ? _ref.length : void 0) {
        this.client.addListener('connected', __bind(function() {
          return this.client.join(options.channels.join(','));
        }, this));
      }
      this.client.addListener('privmsg', __bind(function(m) {
        var completeText, match, watcher, _i, _len, _ref;
        if ((m.channel = m.params[0]).charAt(0) !== '#') {
          return;
        }
        completeText = m.params[m.params.length - 1];
        if (!(match = this.didAddressMe.exec(completeText))) {
          return;
        }
        m.text = match[1];
        m.person.ident = "" + m.person.user + "@" + m.person.host;
        m.say = __bind(function(text) {
          return this.client.privmsg(m.channel, "" + m.person.nick + ": " + text, true);
        }, this);
        _ref = this.watchers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          watcher = _ref[_i];
          if (m.match_data = m.text.match(watcher.re)) {
            if (watcher.onlyAdmin && m.person.ident !== options.admin) {
              m.say("I can't let you do that.");
            } else {
              watcher.callback(m);
            }
            break;
          }
        }
        return;
      }, this));
      this.client.addListener('disconnected', __bind(function() {
        if (this.shuttingDown) {
          return;
        }
        return this.reconnectTimer = setTimeout(__bind(function() {
          this.reconnectTimer = null;
          return this.client.connect();
        }, this), 10000);
      }, this));
      this.client.connect();
    }
    BoloIrc.prototype.shutdown = function() {
      this.shuttingDown = true;
      return this.client.quit('Augh, they got me!');
    };
    BoloIrc.prototype.watch_for = function(re, callback) {
      return this.watchers.push({
        re: re,
        callback: callback
      });
    };
    BoloIrc.prototype.watch_for_admin = function(re, callback) {
      return this.watchers.push({
        re: re,
        callback: callback,
        onlyAdmin: true
      });
    };
    return BoloIrc;
  }();
  createBoloIrcClient = function(server, options) {
    var findHisGame, irc;
    irc = new BoloIrc(options);
    findHisGame = function(ident) {
      var game, gid, _ref;
      _ref = server.app.games;
      for (gid in _ref) {
        if (!__hasProp.call(_ref, gid)) continue;
        game = _ref[gid];
        if (game.owner === ident) {
          return game;
        }
      }
      return;
    };
    irc.watch_for(/^map\s+(.+?)$/, function(m) {
      var descr, matches, names, _i, _len, _results;
      if (findHisGame(m.person.ident)) {
        return m.say("You already have a game open.");
      }
      if (!server.app.haveOpenSlots()) {
        return m.say("All game slots are full at the moment.");
      }
      matches = server.app.maps.fuzzy(m.match_data[1]);
      if (matches.length === 1) {
        descr = matches[0];
        return fs.readFile(descr.path, function(err, data) {
          var game;
          if (err) {
            return m.say("Having some trouble loading that map, sorry.");
          }
          game = server.app.createGame(data);
          game.owner = m.person.ident;
          return m.say("Started game “" + descr.name + "” at: " + game.url);
        });
      } else if (matches.length === 0) {
        return m.say("I can't find any map like that.");
      } else if (matches.length > 4) {
        return m.say("You need to be a bit more specific than that.");
      } else {
        names = function() {
          _results = [];
          for (_i = 0, _len = matches.length; _i < _len; _i++) {
            descr = matches[_i];
            _results.push("“" + descr.name + "”");
          }
          return _results;
        }();
        return m.say("Did you mean one of these: " + (names.join(', ')));
      }
    });
    irc.watch_for(/^close$/, function(m) {
      var game;
      if (!(game = findHisGame(m.person.ident))) {
        return m.say("You don't have a game open.");
      }
      server.app.closeGame(game);
      return m.say("Your game was closed.");
    });
    irc.watch_for_admin(/^reindex$/, function(m) {
      return server.app.maps.reindex(function() {
        return m.say("Index rebuilt.");
      });
    });
    irc.watch_for_admin(/^reset demo$/, function(m) {
      return server.app.resetDemo(function(err) {
        return m.say(err != null ? err : 'Demo game reset.');
      });
    });
    irc.watch_for_admin(/^shutdown$/, function(m) {
      return server.app.shutdown();
    });
    return irc;
  };
  module.exports = createBoloIrcClient;
}).call(this);
