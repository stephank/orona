(function() {
  var Application, BoloServerWorld, BoloWorldMixin, Loop, MapIndex, ServerWorld, TICK_LENGTH_MS, Tank, WebSocket, WorldMap, allObjects, connect, createBoloAppServer, fs, helpers, net, pack, path, random, redirector, round, url;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  random = Math.random, round = Math.round;
  fs = require('fs');
  url = require('url');
  path = require('path');
  connect = require('connect');
  Loop = require('villain/loop');
  ServerWorld = require('villain/world/net/server');
  pack = require('villain/struct').pack;
  WebSocket = require('./websocket');
  MapIndex = require('./map_index');
  helpers = require('../helpers');
  BoloWorldMixin = require('../world_mixin');
  allObjects = require('../objects/all');
  Tank = require('../objects/tank');
  WorldMap = require('../world_map');
  net = require('../net');
  TICK_LENGTH_MS = require('../constants').TICK_LENGTH_MS;
  BoloServerWorld = function() {
    function BoloServerWorld(map) {
      this.map = map;
      BoloServerWorld.__super__.constructor.apply(this, arguments);
      this.boloInit();
      this.clients = [];
      this.map.world = this;
      this.oddTick = false;
      this.spawnMapObjects();
    }
    __extends(BoloServerWorld, ServerWorld);
    BoloServerWorld.prototype.authority = true;
    BoloServerWorld.prototype.close = function() {
      var client, _i, _len, _ref, _results;
      _ref = this.clients;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        client = _ref[_i];
        _results.push(client.end());
      }
      return _results;
    };
    BoloServerWorld.prototype.tick = function() {
      BoloServerWorld.__super__.tick.apply(this, arguments);
      return this.sendPackets();
    };
    BoloServerWorld.prototype.soundEffect = function(sfx, x, y, owner) {
      var ownerIdx;
      ownerIdx = owner != null ? owner.idx : 65535;
      return this.changes.push(['soundEffect', sfx, x, y, ownerIdx]);
    };
    BoloServerWorld.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {
      var ascii;
      ascii = cell.type.ascii;
      return this.changes.push(['mapChange', cell.x, cell.y, ascii, cell.life, cell.mine]);
    };
    BoloServerWorld.prototype.onConnect = function(ws) {
      var messages, obj, packet, tank, _i, _j, _len, _len2, _ref, _ref2, _results;
      this.clients.push(ws);
      ws.setTimeout(10000);
      ws.heartbeatTimer = 0;
      ws.on('message', __bind(function(message) {
        return this.onMessage(ws, message);
      }, this));
      ws.on('end', __bind(function() {
        return this.onEnd(ws);
      }, this));
      ws.on('error', __bind(function(error) {
        return this.onError(ws, error);
      }, this));
      ws.on('timeout', __bind(function() {
        return this.onError(ws, new Error('Connection timed out'));
      }, this));
      packet = this.map.dump({
        noPills: true,
        noBases: true
      });
      packet = new Buffer(packet).toString('base64');
      ws.sendMessage(packet);
      packet = [];
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        packet = packet.concat([net.CREATE_MESSAGE, obj._net_type_idx]);
      }
      packet = packet.concat([net.UPDATE_MESSAGE], this.dumpTick(true));
      packet = new Buffer(packet).toString('base64');
      ws.sendMessage(packet);
      messages = function() {
        _ref2 = this.tanks;
        _results = [];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          tank = _ref2[_j];
          _results.push({
            command: 'nick',
            idx: tank.idx,
            nick: tank.name
          });
        }
        return _results;
      }.call(this);
      messages = JSON.stringify(messages);
      ws.sendMessage(messages);
      packet = new Buffer([net.SYNC_MESSAGE]).toString('base64');
      return ws.sendMessage(packet);
    };
    BoloServerWorld.prototype.onEnd = function(ws) {
      ws.end();
      return this.onDisconnect(ws);
    };
    BoloServerWorld.prototype.onError = function(ws, error) {
      console.log((error != null ? error.toString() : void 0) || 'Unknown error on client connection');
      ws.destroy();
      return this.onDisconnect(ws);
    };
    BoloServerWorld.prototype.onDisconnect = function(ws) {
      var idx;
      if (ws.tank) {
        this.destroy(ws.tank);
      }
      ws.tank = null;
      if ((idx = this.clients.indexOf(ws)) !== -1) {
        return this.clients.splice(idx, 1);
      }
    };
    BoloServerWorld.prototype.onMessage = function(ws, message) {
      if (message === '') {
        return ws.heartbeatTimer = 0;
      } else if (message.charAt(0) === '{') {
        return this.onJsonMessage(ws, message);
      } else {
        return this.onSimpleMessage(ws, message);
      }
    };
    BoloServerWorld.prototype.onSimpleMessage = function(ws, message) {
      var action, builder, command, sanitized, tank, trees, x, y, _ref;
      if (!(tank = ws.tank)) {
        return this.onError(ws, new Error("Received a game command from a spectator"));
      }
      command = message.charAt(0);
      switch (command) {
        case net.START_TURNING_CCW:
          return tank.turningCounterClockwise = true;
        case net.STOP_TURNING_CCW:
          return tank.turningCounterClockwise = false;
        case net.START_TURNING_CW:
          return tank.turningClockwise = true;
        case net.STOP_TURNING_CW:
          return tank.turningClockwise = false;
        case net.START_ACCELERATING:
          return tank.accelerating = true;
        case net.STOP_ACCELERATING:
          return tank.accelerating = false;
        case net.START_BRAKING:
          return tank.braking = true;
        case net.STOP_BRAKING:
          return tank.braking = false;
        case net.START_SHOOTING:
          return tank.shooting = true;
        case net.STOP_SHOOTING:
          return tank.shooting = false;
        case net.INC_RANGE:
          return tank.increaseRange();
        case net.DEC_RANGE:
          return tank.decreaseRange();
        case net.BUILD_ORDER:
          _ref = message.slice(2).split(','), action = _ref[0], trees = _ref[1], x = _ref[2], y = _ref[3];
          trees = parseInt(trees);
          x = parseInt(x);
          y = parseInt(y);
          builder = tank.builder.$;
          if (trees < 0 || !builder.states.actions.hasOwnProperty(action)) {
            return this.onError(ws, new Error("Received invalid build order"));
          } else {
            return builder.performOrder(action, trees, this.map.cellAtTile(x, y));
          }
          break;
        default:
          sanitized = command.replace(/\W+/, '');
          return this.onError(ws, new Error("Received an unknown command: " + sanitized));
      }
    };
    BoloServerWorld.prototype.onJsonMessage = function(ws, message) {
      var sanitized, tank;
      try {
        message = JSON.parse(message);
        if (typeof message.command !== 'string') {
          throw new Error("Received an invalid JSON message");
        }
      } catch (e) {
        return this.onError(ws, e);
      }
      if (message.command === 'join') {
        if (ws.tank) {
          this.onError(ws, new Error("Client tried to join twice."));
        } else {
          this.onJoinMessage(ws, message);
        }
        return;
      }
      if (!(tank = ws.tank)) {
        return this.onError(ws, new Error("Received a JSON message from a spectator"));
      }
      switch (message.command) {
        case 'msg':
          return this.onTextMessage(ws, tank, message);
        case 'teamMsg':
          return this.onTeamTextMessage(ws, tank, message);
        default:
          sanitized = message.command.slice(0, 10).replace(/\W+/, '');
          return this.onError(ws, new Error("Received an unknown JSON command: " + sanitized));
      }
    };
    BoloServerWorld.prototype.onJoinMessage = function(ws, message) {
      var packet;
      if (typeof message.nick !== 'string' || message.nick.length > 20) {
        this.onError(ws, new Error("Client specified invalid nickname."));
      }
      if (typeof message.team !== 'number' || !(message.team === 0 || message.team === 1)) {
        this.onError(ws, new Error("Client specified invalid team."));
      }
      ws.tank = this.spawn(Tank, message.team);
      packet = this.changesPacket(true);
      packet = new Buffer(packet).toString('base64');
      this.broadcast(packet);
      ws.tank.name = message.name;
      this.broadcast(JSON.stringify({
        command: 'nick',
        idx: ws.tank.idx,
        nick: message.nick
      }));
      packet = pack('BH', net.WELCOME_MESSAGE, ws.tank.idx);
      packet = new Buffer(packet).toString('base64');
      return ws.sendMessage(packet);
    };
    BoloServerWorld.prototype.onTextMessage = function(ws, tank, message) {
      if (typeof message.text !== 'string' || message.text.length > 140) {
        this.onError(ws, new Error("Client sent an invalid text message."));
      }
      return this.broadcast(JSON.stringify({
        command: 'msg',
        idx: tank.idx,
        text: message.text
      }));
    };
    BoloServerWorld.prototype.onTeamTextMessage = function(ws, tank, message) {
      var client, out, _i, _len, _ref, _results;
      if (typeof message.text !== 'string' || message.text.length > 140) {
        this.onError(ws, new Error("Client sent an invalid text message."));
      }
      if (tank.team === 255) {
        return;
      }
      out = JSON.stringify({
        command: 'teamMsg',
        idx: tank.idx,
        text: message.text
      });
      _ref = this.clients;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        client = _ref[_i];
        if (client.tank.team === tank.team) {
          _results.push(client.sendMessage(out));
        }
      }
      return _results;
    };
    BoloServerWorld.prototype.broadcast = function(message) {
      var client, _i, _len, _ref, _results;
      _ref = this.clients;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        client = _ref[_i];
        _results.push(client.sendMessage(message));
      }
      return _results;
    };
    BoloServerWorld.prototype.sendPackets = function() {
      var client, largePacket, smallPacket, _i, _len, _ref, _results;
      if (this.oddTick = !this.oddTick) {
        smallPacket = this.changesPacket(true);
        smallPacket = new Buffer(smallPacket).toString('base64');
        largePacket = smallPacket;
      } else {
        smallPacket = this.changesPacket(false);
        largePacket = smallPacket.concat(this.updatePacket());
        smallPacket = new Buffer(smallPacket).toString('base64');
        largePacket = new Buffer(largePacket).toString('base64');
      }
      _ref = this.clients;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        client = _ref[_i];
        _results.push(client.heartbeatTimer > 40 ? client.sendMessage(smallPacket) : (client.sendMessage(largePacket), client.heartbeatTimer++));
      }
      return _results;
    };
    BoloServerWorld.prototype.changesPacket = function(fullCreate) {
      var ascii, asciiCode, change, data, i, idx, life, mine, needUpdate, obj, other, ownerIdx, sfx, type, x, y, _i, _j, _len, _len2, _len3, _ref;
      if (this.changes.length <= 0) {
        return [];
      }
      data = [];
      needUpdate = [];
      _ref = this.changes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        change = _ref[_i];
        type = change.shift();
        switch (type) {
          case 'create':
            obj = change[0], idx = change[1];
            if (fullCreate) {
              needUpdate.push(obj);
            }
            data = data.concat([net.CREATE_MESSAGE], pack('B', obj._net_type_idx));
            break;
          case 'destroy':
            obj = change[0], idx = change[1];
            for (i = 0, _len2 = needUpdate.length; i < _len2; i++) {
              other = needUpdate[i];
              if (other === obj) {
                needUpdate.splice(i, 1);
                break;
              }
            }
            data = data.concat([net.DESTROY_MESSAGE], pack('H', idx));
            break;
          case 'mapChange':
            x = change[0], y = change[1], ascii = change[2], life = change[3], mine = change[4];
            asciiCode = ascii.charCodeAt(0);
            data = data.concat([net.MAPCHANGE_MESSAGE], pack('BBBBf', x, y, asciiCode, life, mine));
            break;
          case 'soundEffect':
            sfx = change[0], x = change[1], y = change[2], ownerIdx = change[3];
            data = data.concat([net.SOUNDEFFECT_MESSAGE], pack('BHHH', sfx, x, y, ownerIdx));
        }
      }
      for (_j = 0, _len3 = needUpdate.length; _j < _len3; _j++) {
        obj = needUpdate[_j];
        data = data.concat([net.TINY_UPDATE_MESSAGE], pack('H', obj.idx), this.dump(obj));
      }
      return data;
    };
    BoloServerWorld.prototype.updatePacket = function() {
      return [net.UPDATE_MESSAGE].concat(this.dumpTick());
    };
    return BoloServerWorld;
  }();
  helpers.extend(BoloServerWorld.prototype, BoloWorldMixin);
  allObjects.registerWithWorld(BoloServerWorld.prototype);
  Application = function() {
    function Application(httpServer, options) {
      var mapPath;
      this.httpServer = httpServer;
      this.options = options;
      this.games = {};
      this.ircClients = [];
      mapPath = path.join(path.dirname(fs.realpathSync(__filename)), '../../maps');
      this.maps = new MapIndex(mapPath, __bind(function() {
        return this.resetDemo(function(err) {
          if (err) {
            return console.log(err);
          }
        });
      }, this));
      this.loop = new Loop(this);
      this.loop.tickRate = TICK_LENGTH_MS;
    }
    Application.prototype.resetDemo = function(cb) {
      var everard;
      if (this.demo) {
        this.closeGame(this.demo);
      }
      if (!(everard = this.maps.get('Everard Island'))) {
        return typeof cb === "function" ? cb("Could not find Everard Island.") : void 0;
      }
      return fs.readFile(everard.path, __bind(function(err, data) {
        if (err) {
          return typeof cb === "function" ? cb("Unable to start demo game: " + (err.toString())) : void 0;
        }
        this.demo = this.createGame(data);
        return typeof cb === "function" ? cb() : void 0;
      }, this));
    };
    Application.prototype.haveOpenSlots = function() {
      return Object.getOwnPropertyNames(this.games).length < this.options.general.maxgames;
    };
    Application.prototype.createGameId = function() {
      var charset, gid, i, _results;
      charset = 'abcdefghijklmnopqrstuvwxyz';
      while (true) {
        gid = function() {
          _results = [];
          for (i = 1; i <= 20; i++) {
            _results.push(charset.charAt(round(random() * (charset.length - 1))));
          }
          return _results;
        }();
        gid = gid.join('');
        if (!this.games.hasOwnProperty(gid)) {
          break;
        }
      }
      return gid;
    };
    Application.prototype.createGame = function(mapData) {
      var game, gid, map;
      map = WorldMap.load(mapData);
      gid = this.createGameId();
      this.games[gid] = game = new BoloServerWorld(map);
      game.gid = gid;
      game.url = "" + this.options.general.base + "/match/" + gid;
      console.log("Created game '" + gid + "'");
      this.startLoop();
      return game;
    };
    Application.prototype.closeGame = function(game) {
      delete this.games[game.gid];
      this.possiblyStopLoop();
      game.close();
      return console.log("Closed game '" + game.gid + "'");
    };
    Application.prototype.registerIrcClient = function(irc) {
      return this.ircClients.push(irc);
    };
    Application.prototype.shutdown = function() {
      var client, game, gid, _i, _len, _ref, _ref2;
      _ref = this.ircClients;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        client = _ref[_i];
        client.shutdown();
      }
      _ref2 = this.games;
      for (gid in _ref2) {
        if (!__hasProp.call(_ref2, gid)) continue;
        game = _ref2[gid];
        game.close();
      }
      this.loop.stop();
      return this.httpServer.close();
    };
    Application.prototype.startLoop = function() {
      return this.loop.start();
    };
    Application.prototype.possiblyStopLoop = function() {
      if (!this.haveOpenSlots()) {
        return this.loop.stop();
      }
    };
    Application.prototype.tick = function() {
      var game, gid, _ref;
      _ref = this.games;
      for (gid in _ref) {
        if (!__hasProp.call(_ref, gid)) continue;
        game = _ref[gid];
        game.tick();
      }
      return;
    };
    Application.prototype.idle = function() {};
    Application.prototype.getSocketPathHandler = function(path) {
      var m;
      if (path === '/lobby') {
        return false;
      } else if (m = /^\/match\/([a-z]{20})$/.exec(path)) {
        if (this.games.hasOwnProperty(m[1])) {
          return __bind(function(ws) {
            return this.games[m[1]].onConnect(ws);
          }, this);
        } else {
          return false;
        }
      } else if (path === '/demo' && this.demo) {
        return __bind(function(ws) {
          return this.demo.onConnect(ws);
        }, this);
      } else {
        return false;
      }
    };
    Application.prototype.handleWebsocket = function(request, connection, initialData) {
      var handler, ws;
      if (request.method !== 'GET') {
        return connection.destroy();
      }
      path = url.parse(request.url).pathname;
      handler = this.getSocketPathHandler(path);
      if (handler === false) {
        return connection.destroy();
      }
      ws = new WebSocket(request, connection, initialData);
      return ws.on('connect', function() {
        return handler(ws);
      });
    };
    return Application;
  }();
  redirector = function(base) {
    return function(req, res, next) {
      var m, query, requrl;
      requrl = url.parse(req.url);
      if (requrl.pathname === '/') {
        query = '';
      } else if (m = /^\/match\/([a-z]{20})$/.exec(requrl.pathname)) {
        query = "?" + m[1];
      } else {
        return next();
      }
      res.writeHead(301, {
        'Location': "" + base + "/bolo.html" + query
      });
      return res.end();
    };
  };
  createBoloAppServer = function(options) {
    var server, webroot;
    options || (options = {});
    webroot = path.join(path.dirname(fs.realpathSync(__filename)), '../../public');
    server = connect.createServer();
    if (options.web.log) {
      server.use('/', connect.logger());
    }
    server.use('/', redirector(options.general.base));
    if (options.web.gzip) {
      server.use('/', connect.staticGzip({
        root: webroot,
        compress: ['text/html', 'text/cache-manifest', 'text/css', 'application/javascript', 'image/png', 'application/ogg']
      }));
    }
    server.use('/', connect.staticProvider(webroot));
    server.app = new Application(server, options);
    server.on('upgrade', function(request, connection, initialData) {
      return server.app.handleWebsocket(request, connection, initialData);
    });
    return server;
  };
  module.exports = createBoloAppServer;
}).call(this);
