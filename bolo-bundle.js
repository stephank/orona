(function() {
  var require;
  require = function(path) {
    var m;
    if (!(m = require.modules[path])) {
      throw ("Couldn't find module for: " + (path));
    }
    if (!(m.exports)) {
      m.exports = {};
      m.call(m.exports, m, m.exports, require.bind(path, m.directory));
    }
    return m.exports;
  };
  require.modules = {};
  require.bind = function(path, directory) {
    return function(p) {
      var _i, _len, _ref, cwd, part;
      if (p.charAt(0) !== '.') {
        return require(p);
      }
      cwd = path.split('/');
      if (!(directory)) {
        cwd.pop();
      }
      _ref = p.split('/');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        part = _ref[_i];
        if (part === '..') {
          cwd.pop();
        } else {
          if (part !== '.') {
            cwd.push(part);
          }
        }
      }
      return require(cwd.join('/'));
    };
  };
  require.module = function(path, directory, fn) {
    fn.directory = (function() {
      if (typeof (directory) === 'boolean') {
        return directory;
      } else {
        fn = directory;
        return false;
      }
    })();
    return (require.modules[path] = fn);
  };
  window.require = require;
}).call(this);
require.module('events', false, function(module, exports, require) {
// This is an extract from node.js, which is MIT-licensed.
// © 2009, 2010 Ryan Lienhart Dahl.
// Slightly adapted for a browser environment by Stéphan Kochen.

var EventEmitter = exports.EventEmitter = function() {};

var isArray = Array.isArray;

EventEmitter.prototype.emit = function (type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1];
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    if (arguments.length <= 3) {
      // fast case
      handler.call(this, arguments[1], arguments[2]);
    } else {
      // slower
      var args = Array.prototype.slice.call(arguments, 1);
      handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);


    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit("newListener", type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {
    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.removeListener = function (type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function (type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function (type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});
require.module('bolo/client', true, function(module, exports, require) {
var BaseGame, ClientContext, DefaultRenderer, EverardIsland, Loader, LocalGame, NetworkGame, SimMap, Simulation, TICK_LENGTH_MS, Tank, decodeBase64, game, init, net, unpack;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
Simulation = require('../simulation');
Tank = require('../objects/tank');
net = require('../net');
SimMap = require('../sim_map').SimMap;
unpack = require('../struct').unpack;
TICK_LENGTH_MS = require('../constants').TICK_LENGTH_MS;
ClientContext = require('./net');
Loader = require('./loader');
decodeBase64 = require('./util/base64').decodeBase64;
DefaultRenderer = require('./renderer/offscreen_2d');
EverardIsland = require('./everard');
BaseGame = function() {
  var loader;
  $(document).keydown((__bind(function(e) {
    var _ref;
    return (typeof (_ref = this.sim) !== "undefined" && _ref !== null) ? this.handleKeydown(e) : null;
  }, this)));
  $(document).keyup((__bind(function(e) {
    var _ref;
    return (typeof (_ref = this.sim) !== "undefined" && _ref !== null) ? this.handleKeyup(e) : null;
  }, this)));
  this.gameTimer = (this.lastTick = null);
  loader = new Loader();
  loader.onComplete = (__bind(function() {
    this.resources = loader.resources;
    return this.startup();
  }, this));
  loader.image('base');
  loader.image('styled');
  loader.image('overlay');
  loader.finish();
  return this;
};
BaseGame.prototype.commonInitialization = function(map) {
  this.sim = new Simulation(map);
  this.renderer = new DefaultRenderer(this.resources.images, this.sim);
  return this.sim.map.setView(this.renderer);
};
BaseGame.prototype.start = function() {
  var _ref;
  if (typeof (_ref = this.gameTimer) !== "undefined" && _ref !== null) {
    return null;
  }
  this.tick();
  this.lastTick = Date.now();
  return (this.gameTimer = window.setInterval((__bind(function() {
    return this.timerCallback();
  }, this)), TICK_LENGTH_MS));
};
BaseGame.prototype.stop = function() {
  var _ref;
  if (!(typeof (_ref = this.gameTimer) !== "undefined" && _ref !== null)) {
    return null;
  }
  window.clearInterval(this.gameTimer);
  return (this.gameTimer = (this.lastTick = null));
};
BaseGame.prototype.timerCallback = function() {
  var now;
  now = Date.now();
  while (now - this.lastTick >= TICK_LENGTH_MS) {
    this.tick();
    this.lastTick += TICK_LENGTH_MS;
  }
  return this.renderer.draw();
};
BaseGame.prototype.startup = function() {};
BaseGame.prototype.tick = function() {};
BaseGame.prototype.handleKeydown = function(e) {};
BaseGame.prototype.handleKeyup = function(e) {};
LocalGame = function() {
  return BaseGame.apply(this, arguments);
};
__extends(LocalGame, BaseGame);
LocalGame.prototype.startup = function() {
  var map;
  map = SimMap.load(decodeBase64(EverardIsland));
  this.commonInitialization(map);
  this.sim.player = this.sim.spawn(Tank);
  this.renderer.initHud();
  return this.start();
};
LocalGame.prototype.tick = function() {
  return this.sim.tick();
};
LocalGame.prototype.handleKeydown = function(e) {
  switch (e.which) {
    case 32:
      this.sim.player.shooting = true;
      break;
    case 37:
      this.sim.player.turningCounterClockwise = true;
      break;
    case 38:
      this.sim.player.accelerating = true;
      break;
    case 39:
      this.sim.player.turningClockwise = true;
      break;
    case 40:
      this.sim.player.braking = true;
      break;
  }
  return e.preventDefault();
};
LocalGame.prototype.handleKeyup = function(e) {
  switch (e.which) {
    case 32:
      this.sim.player.shooting = false;
      break;
    case 37:
      this.sim.player.turningCounterClockwise = false;
      break;
    case 38:
      this.sim.player.accelerating = false;
      break;
    case 39:
      this.sim.player.turningClockwise = false;
      break;
    case 40:
      this.sim.player.braking = false;
      break;
    default:
      return null;
  }
  return e.preventDefault();
};
NetworkGame = function() {
  this.heartbeatTimer = 0;
  NetworkGame.__super__.constructor.apply(this, arguments);
  return this;
};
__extends(NetworkGame, BaseGame);
NetworkGame.prototype.startup = function() {
  this.ws = new WebSocket("ws://" + (location.host) + "/demo");
  return $(this.ws).one('message', (__bind(function(e) {
    return this.receiveMap(e.originalEvent);
  }, this)));
};
NetworkGame.prototype.receiveMap = function(e) {
  var map;
  map = SimMap.load(decodeBase64(e.data));
  this.commonInitialization(map);
  this.netctx = new ClientContext(this.sim);
  return $(this.ws).bind('message', (__bind(function(e) {
    var _ref;
    return (typeof (_ref = this.ws) !== "undefined" && _ref !== null) ? this.handleMessage(e.originalEvent) : null;
  }, this)));
};
NetworkGame.prototype.receiveWelcome = function(tank) {
  this.sim.player = tank;
  this.sim.rebuildMapObjects();
  this.renderer.initHud();
  return this.start();
};
NetworkGame.prototype.tick = function() {
  this.netctx.authoritative = false;
  net.inContext(this.netctx, (__bind(function() {
    return this.sim.tick();
  }, this)));
  if (++this.heartbeatTimer === 10) {
    this.heartbeatTimer = 0;
    return this.ws.send('');
  }
};
NetworkGame.prototype.handleKeydown = function(e) {
  var _ref;
  if (!(typeof (_ref = this.ws) !== "undefined" && _ref !== null)) {
    return null;
  }
  switch (e.which) {
    case 32:
      this.ws.send(net.START_SHOOTING);
      break;
    case 37:
      this.ws.send(net.START_TURNING_CCW);
      break;
    case 38:
      this.ws.send(net.START_ACCELERATING);
      break;
    case 39:
      this.ws.send(net.START_TURNING_CW);
      break;
    case 40:
      this.ws.send(net.START_BRAKING);
      break;
    default:
      return null;
  }
  return e.preventDefault();
};
NetworkGame.prototype.handleKeyup = function(e) {
  var _ref;
  if (!(typeof (_ref = this.ws) !== "undefined" && _ref !== null)) {
    return null;
  }
  switch (e.which) {
    case 32:
      this.ws.send(net.STOP_SHOOTING);
      break;
    case 37:
      this.ws.send(net.STOP_TURNING_CCW);
      break;
    case 38:
      this.ws.send(net.STOP_ACCELERATING);
      break;
    case 39:
      this.ws.send(net.STOP_TURNING_CW);
      break;
    case 40:
      this.ws.send(net.STOP_BRAKING);
      break;
    default:
      return null;
  }
  return e.preventDefault();
};
NetworkGame.prototype.handleMessage = function(e) {
  this.netctx.authoritative = true;
  return net.inContext(this.netctx, (__bind(function() {
    var _result, ate, command, data, length, pos;
    data = decodeBase64(e.data);
    pos = 0;
    length = data.length;
    _result = [];
    while (pos < length) {
      command = data[pos++];
      ate = this.handleServerCommand(command, data, pos);
      if (ate === -1) {
        console.log("Message was:", data);
        return null;
      }
      pos += ate;
    }
    return _result;
  }, this)));
};
NetworkGame.prototype.handleServerCommand = function(command, data, offset) {
  var _ref, _ref2, ascii, bytes, cell, code, life, mine, tank_idx, x, y;
  switch (command) {
    case net.WELCOME_MESSAGE:
      _ref = unpack('H', data, offset), _ref2 = _ref[0], tank_idx = _ref2[0], bytes = _ref[1];
      this.receiveWelcome(this.sim.objects[tank_idx]);
      return bytes;
    case net.CREATE_MESSAGE:
      return this.sim.netSpawn(data, offset);
    case net.DESTROY_MESSAGE:
      return this.sim.netDestroy(data, offset);
    case net.MAPCHANGE_MESSAGE:
      _ref = unpack('BBBBf', data, offset), _ref2 = _ref[0], x = _ref2[0], y = _ref2[1], code = _ref2[2], life = _ref2[3], mine = _ref2[4], bytes = _ref[1];
      ascii = String.fromCharCode(code);
      cell = this.sim.map.cells[y][x];
      cell.setType(ascii, mine);
      cell.life = life;
      return bytes;
    case net.UPDATE_MESSAGE:
      return this.sim.netTick(data, offset);
    default:
      console.log("Bad command '" + (command) + "' from server, and offset " + (offset - 1));
      this.stop();
      this.ws.close();
      this.ws = null;
      return -1;
  }
};
game = null;
init = function() {
  return location.hostname.split('.')[1] === 'github' ? (game = new LocalGame()) : (game = new NetworkGame());
};
exports.init = init;
exports.start = function() {
  return game.start();
};
exports.stop = function() {
  return game.stop();
};
});
require.module('bolo/simulation', false, function(module, exports, require) {
var Simulation, WorldObject, net, unpack;
var __slice = Array.prototype.slice, __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
net = require('./net');
unpack = require('./struct').unpack;
WorldObject = require('./world_object');
require('./objects/sim_pillbox');
require('./objects/sim_base');
require('./objects/tank');
require('./objects/explosion');
require('./objects/shell');
require('./objects/fireball');
Simulation = function(_arg) {
  this.map = _arg;
  this.objects = [];
  this.tanks = [];
  this.spawnMapObjects();
  return this;
};
Simulation.prototype.spawn = function(type) {
  var args, obj;
  args = __slice.call(arguments, 1);
  obj = new type(this);
  obj.emit.apply(obj, ['spawn'].concat(args));
  obj.emit('anySpawn');
  this.insert(obj);
  net.created(obj);
  return obj;
};
Simulation.prototype.update = function(obj) {
  obj.update();
  obj.emit('update');
  return obj.emit('anyUpdate');
};
Simulation.prototype.destroy = function(obj) {
  obj.emit('destroy');
  if (net.isAuthority() || obj.transient) {
    obj.emit('finalize');
  }
  this.remove(obj);
  net.destroyed(obj);
  return obj;
};
Simulation.prototype.tick = function() {
  var _i, _len, _ref, obj;
  _ref = this.objects.slice(0);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    obj = _ref[_i];
    this.update(obj);
  }
  return null;
};
Simulation.prototype.netSpawn = function(data, offset) {
  var _ref, bytes, changes, obj, type;
  type = WorldObject.getType(data[offset]);
  obj = this.insert(new type(this));
  _ref = obj.deserialize(true, data, offset + 1), bytes = _ref[0], changes = _ref[1];
  obj.emit('netSpawn');
  obj.emit('anySpawn');
  obj.emit('netSync');
  return bytes + 1;
};
Simulation.prototype.netUpdate = function(obj, data, offset) {
  var _ref, bytes, changes;
  _ref = obj.deserialize(false, data, offset), bytes = _ref[0], changes = _ref[1];
  obj.emit('netUpdate', changes);
  obj.emit('anyUpdate');
  obj.emit('netSync');
  return bytes;
};
Simulation.prototype.netDestroy = function(data, offset) {
  var _ref, _ref2, bytes, obj, obj_idx;
  _ref = unpack('H', data, offset), _ref2 = _ref[0], obj_idx = _ref2[0], bytes = _ref[1];
  obj = this.objects[obj_idx];
  obj.emit('finalize');
  this.remove(obj);
  return bytes;
};
Simulation.prototype.netTick = function(data, offset) {
  var _i, _len, _ref, bytes, obj;
  bytes = 0;
  _ref = this.objects;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    obj = _ref[_i];
    bytes += this.netUpdate(obj, data, offset + bytes);
  }
  return bytes;
};
Simulation.prototype.insert = function(obj) {
  var _len, _ref, i, other;
  _ref = this.objects;
  for (i = 0, _len = _ref.length; i < _len; i++) {
    other = _ref[i];
    if (obj.updatePriority > other.updatePriority) {
      break;
    }
  }
  this.objects.splice(i, 0, obj);
  _ref = this.objects.length;
  for (i = i; (i <= _ref ? i < _ref : i > _ref); (i <= _ref ? i += 1 : i -= 1)) {
    this.objects[i].idx = i;
  }
  return obj;
};
Simulation.prototype.remove = function(obj) {
  var _ref, _ref2, i;
  this.objects.splice(obj.idx, 1);
  _ref = obj.idx; _ref2 = this.objects.length;
  for (i = _ref; (_ref <= _ref2 ? i < _ref2 : i > _ref2); (_ref <= _ref2 ? i += 1 : i -= 1)) {
    this.objects[i].idx = i;
  }
  return obj;
};
Simulation.prototype.buildSerializer = function(object, packer) {
  return function(specifier, attribute, options) {
    var _ref, value;
    options || (options = {});
    value = object[attribute];
    if (typeof (_ref = options.tx) !== "undefined" && _ref !== null) {
      value = options.tx(value);
    }
    switch (specifier) {
      case 'O':
        packer('H', value ? value.$.idx : 65535);
        break;
      case 'T':
        packer('B', value ? value.$.tank_idx : 255);
        break;
      default:
        packer(specifier, value);
    }
    return null;
  };
};
Simulation.prototype.buildDeserializer = function(object, unpacker) {
  var gen;
  gen = (__bind(function(specifier, attribute, options) {
    var _ref, oldValue, other, value;
    options || (options = {});
    switch (specifier) {
      case 'O':
        other = this.objects[unpacker('H')];
        if ((oldValue = object[attribute] == null ? undefined : object[attribute].$) !== other) {
          gen.changes[attribute] = oldValue;
          object.ref(attribute, other);
        }
        break;
      case 'T':
        other = this.tanks[unpacker('B')];
        if ((oldValue = object[attribute] == null ? undefined : object[attribute].$) !== other) {
          gen.changes[attribute] = oldValue;
          object.ref(attribute, other);
        }
        break;
      default:
        value = unpacker(specifier);
        if (typeof (_ref = options.rx) !== "undefined" && _ref !== null) {
          value = options.rx(value);
        }
        if ((oldValue = object[attribute]) !== value) {
          gen.changes[attribute] = oldValue;
          object[attribute] = value;
        }
    }
    return null;
  }, this));
  gen.changes = {};
  return gen;
};
Simulation.prototype.addTank = function(tank) {
  tank.tank_idx = this.tanks.length;
  this.tanks.push(tank);
  return this.resolveMapObjectOwners();
};
Simulation.prototype.removeTank = function(tank) {
  var _ref, _ref2, i;
  this.tanks.splice(tank.tank_idx, 1);
  _ref = tank.tank_idx; _ref2 = this.tanks.length;
  for (i = _ref; (_ref <= _ref2 ? i < _ref2 : i > _ref2); (_ref <= _ref2 ? i += 1 : i -= 1)) {
    this.tanks[i].tank_idx = i;
  }
  return this.resolveMapObjectOwners();
};
Simulation.prototype.getAllMapObjects = function() {
  return this.map.pills.concat(this.map.bases);
};
Simulation.prototype.spawnMapObjects = function() {
  var _i, _len, _ref, obj;
  _ref = this.getAllMapObjects();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    obj = _ref[_i];
    obj.sim = this;
    this.insert(obj);
    obj.emit('spawn');
    obj.emit('anySpawn');
  }
  return null;
};
Simulation.prototype.resolveMapObjectOwners = function() {
  var _i, _len, _ref, obj;
  if (!(net.isAuthority())) {
    return null;
  }
  _ref = this.getAllMapObjects();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    obj = _ref[_i];
    obj.ref('owner', this.tanks[obj.owner_idx]);
    obj.cell.retile();
  }
  return null;
};
Simulation.prototype.rebuildMapObjects = function() {
  var _i, _len, _ref, obj;
  this.map.pills = [];
  this.map.bases = [];
  _ref = this.objects;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    obj = _ref[_i];
    switch (obj.charId) {
      case 'p':
        this.map.pills.push(obj);
        break;
      case 'b':
        this.map.bases.push(obj);
        break;
      default:
        continue;
    }
    obj.cell.retile();
  }
  return null;
};
module.exports = Simulation;
});
require.module('bolo/net', false, function(module, exports, require) {
var Context, activeContext, inContext;
Context = function(sim) {
  return this;
};
Context.prototype.authority = null;
Context.prototype.activated = function() {};
Context.prototype.created = function(obj) {};
Context.prototype.destroyed = function(obj) {};
Context.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {};
activeContext = null;
inContext = function(ctx, cb) {
  var retval;
  activeContext = ctx;
  ctx.activated();
  retval = cb();
  activeContext = null;
  return retval;
};
exports.inContext = inContext;
exports.isAuthority = function() {
  return (activeContext != null) ? activeContext.authority : true;
};
exports.created = function(obj) {
  return activeContext == null ? undefined : activeContext.created(obj);
};
exports.destroyed = function(obj) {
  return activeContext == null ? undefined : activeContext.destroyed(obj);
};
exports.mapChanged = function(cell, oldType, hadMine) {
  return activeContext == null ? undefined : activeContext.mapChanged(cell, oldType, hadMine);
};
exports.WELCOME_MESSAGE = 'W'.charCodeAt(0);
exports.CREATE_MESSAGE = 'C'.charCodeAt(0);
exports.DESTROY_MESSAGE = 'D'.charCodeAt(0);
exports.MAPCHANGE_MESSAGE = 'M'.charCodeAt(0);
exports.UPDATE_MESSAGE = 'U'.charCodeAt(0);
exports.START_TURNING_CCW = 'L';
exports.STOP_TURNING_CCW = 'l';
exports.START_TURNING_CW = 'R';
exports.STOP_TURNING_CW = 'r';
exports.START_ACCELERATING = 'A';
exports.STOP_ACCELERATING = 'a';
exports.START_BRAKING = 'B';
exports.STOP_BRAKING = 'b';
exports.START_SHOOTING = 'S';
exports.STOP_SHOOTING = 's';
});
require.module('bolo/struct', false, function(module, exports, require) {
var buildPacker, buildUnpacker, fromUint16, fromUint32, fromUint8, pack, toUint16, toUint32, toUint8, unpack;
toUint8 = function(n) {
  return [n & 0xFF];
};
toUint16 = function(n) {
  return [(n & 0xFF00) >> 8, n & 0x00FF];
};
toUint32 = function(n) {
  return [(n & 0xFF000000) >> 24, (n & 0x00FF0000) >> 16, (n & 0x0000FF00) >> 8, n & 0x000000FF];
};
fromUint8 = function(d, o) {
  return d[o];
};
fromUint16 = function(d, o) {
  return (d[o] << 8) + d[o + 1];
};
fromUint32 = function(d, o) {
  return (d[o] << 24) + (d[o + 1] << 16) + (d[o + 2] << 8) + d[o + 3];
};
buildPacker = function() {
  var bitIndex, bits, data, flushBitFields, retval;
  data = [];
  bits = null;
  bitIndex = 0;
  flushBitFields = function() {
    if (bits === null) {
      return null;
    }
    data.push(bits);
    return (bits = null);
  };
  retval = function(type, value) {
    if (type === 'f') {
      if (bits === null) {
        bits = !!value ? 1 : 0;
        return (bitIndex = 1);
      } else {
        if (!!value) {
          bits |= 1 << bitIndex;
        }
        bitIndex++;
        return bitIndex === 8 ? flushBitFields() : null;
      }
    } else {
      flushBitFields();
      return (data = data.concat((function() {
        switch (type) {
          case 'B':
            return toUint8(value);
          case 'H':
            return toUint16(value);
          case 'I':
            return toUint32(value);
          default:
            throw new Error("Unknown format character " + (type));
        }
      })()));
    }
  };
  retval.finish = function() {
    flushBitFields();
    return data;
  };
  return retval;
};
buildUnpacker = function(data, offset) {
  var bitIndex, idx, retval;
  offset || (offset = 0);
  idx = offset;
  bitIndex = 0;
  retval = function(type) {
    var _ref, bit, bytes, value;
    if (type === 'f') {
      bit = (1 << bitIndex) & data[idx];
      value = bit > 0;
      bitIndex++;
      if (bitIndex === 8) {
        idx++;
        bitIndex = 0;
      }
    } else {
      if (bitIndex !== 0) {
        idx++;
        bitIndex = 0;
      }
      _ref = (function() {
        switch (type) {
          case 'B':
            return [fromUint8(data, idx), 1];
          case 'H':
            return [fromUint16(data, idx), 2];
          case 'I':
            return [fromUint32(data, idx), 4];
          default:
            throw new Error("Unknown format character " + (type));
        }
      })(), value = _ref[0], bytes = _ref[1];
      idx += bytes;
    }
    return value;
  };
  retval.finish = function() {
    if (bitIndex !== 0) {
      idx++;
    }
    return idx - offset;
  };
  return retval;
};
pack = function(fmt) {
  var _len, _ref, i, packer, type, value;
  packer = buildPacker();
  _ref = fmt;
  for (i = 0, _len = _ref.length; i < _len; i++) {
    type = _ref[i];
    value = arguments[i + 1];
    packer(type, value);
  }
  return packer.finish();
};
unpack = function(fmt, data, offset) {
  var _i, _len, _ref, _result, type, unpacker, values;
  unpacker = buildUnpacker(data, offset);
  values = (function() {
    _result = []; _ref = fmt;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      type = _ref[_i];
      _result.push(unpacker(type));
    }
    return _result;
  })();
  return [values, unpacker.finish()];
};
exports.buildPacker = buildPacker;
exports.buildUnpacker = buildUnpacker;
exports.pack = pack;
exports.unpack = unpack;
});
require.module('bolo/world_object', false, function(module, exports, require) {
var EventEmitter, WorldObject, _ref, buildPacker, buildUnpacker, types;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
EventEmitter = require('events').EventEmitter;
_ref = require('./struct'), buildUnpacker = _ref.buildUnpacker, buildPacker = _ref.buildPacker;
types = {};
WorldObject = function(_arg) {
  this.sim = _arg;
  return this;
};
__extends(WorldObject, EventEmitter);
WorldObject.prototype.sim = null;
WorldObject.prototype.charId = null;
WorldObject.prototype.updatePriority = 0;
WorldObject.prototype.transient = false;
WorldObject.prototype.styled = null;
WorldObject.prototype.x = null;
WorldObject.prototype.y = null;
WorldObject.prototype.serialize = function(isCreate) {
  var packer, serializer;
  packer = buildPacker();
  serializer = this.sim.buildSerializer(this, packer);
  this.serialization(isCreate, serializer);
  return packer.finish();
};
WorldObject.prototype.deserialize = function(isCreate, data, offset) {
  var deserializer, unpacker;
  unpacker = buildUnpacker(data, offset);
  deserializer = this.sim.buildDeserializer(this, unpacker);
  this.serialization(isCreate, deserializer);
  return [unpacker.finish(), deserializer.changes];
};
WorldObject.prototype.ref = function(attribute, other) {
  var r;
  if ((this[attribute] == null ? undefined : this[attribute].$) === other) {
    return this[attribute];
  }
  this[attribute] == null ? undefined : this[attribute].clear();
  if (!(other)) {
    return null;
  }
  this[attribute] = (r = {
    $: other,
    owner: this,
    attribute: attribute
  });
  r.events = {};
  r.on = function(event, listener) {
    other.on(event, listener);
    (r.events[event] || (r.events[event] = [])).push(listener);
    return r;
  };
  r.clear = function() {
    var _i, _len, _ref2, _ref3, event, listener, listeners;
    _ref2 = r.events;
    for (event in _ref2) {
      if (!__hasProp.call(_ref2, event)) continue;
      listeners = _ref2[event];
      _ref3 = listeners;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        listener = _ref3[_i];
        other.removeListener(event, listener);
      }
    }
    r.owner.removeListener('finalize', r.clear);
    return (r.owner[r.attribute] = null);
  };
  r.on('finalize', r.clear);
  r.owner.on('finalize', r.clear);
  return r;
};
WorldObject.prototype.serialization = function(isCreate, p) {};
WorldObject.prototype.update = function() {};
WorldObject.prototype.getTile = function() {};
WorldObject.events = ['spawn', 'update', 'destroy', 'netSpawn', 'netUpdate', 'anySpawn', 'anyUpdate', 'netSync', 'finalize'];
WorldObject.getType = function(c) {
  if (typeof (c) !== 'string') {
    c = String.fromCharCode(c);
  }
  return types[c];
};
WorldObject.register = function() {
  types[this.prototype.charId] = this;
  return (this.prototype.charCodeId = this.prototype.charId.charCodeAt(0));
};
WorldObject.extended = function(child) {
  return (child.register = this.register);
};
module.exports = WorldObject;
});
require.module('bolo/objects/sim_pillbox', false, function(module, exports, require) {
var SimPillbox, WorldObject, max;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
max = Math.max;
WorldObject = require('../world_object');
SimPillbox = function(map, _arg, _arg2, _arg3, _arg4, _arg5) {
  this.speed = _arg5;
  this.armour = _arg4;
  this.owner_idx = _arg3;
  this.y = _arg2;
  this.x = _arg;
  if (arguments.length === 1) {
    SimPillbox.__super__.constructor.apply(this, arguments);
  } else {
    SimPillbox.__super__.constructor.call(this, null);
  }
  this.on('anySpawn', (__bind(function() {
    return this.updateCell();
  }, this)));
  this.on('netUpdate', (__bind(function(changes) {
    if (changes.hasOwnProperty('x') || changes.hasOwnProperty('y')) {
      this.updateCell();
    }
    if (changes.hasOwnProperty('owner')) {
      this.owner_idx = this.owner ? this.owner.$.tank_idx : 255;
      return this.cell == null ? undefined : this.cell.retile();
    }
  }, this)));
  return this;
};
__extends(SimPillbox, WorldObject);
SimPillbox.prototype.charId = 'p';
SimPillbox.prototype.updateCell = function() {
  var _ref;
  if (this.cell) {
    delete this.cell.pill;
    this.cell.retile();
  }
  if ((typeof (_ref = this.x) !== "undefined" && _ref !== null) && (typeof (_ref = this.y) !== "undefined" && _ref !== null)) {
    this.cell = this.sim.map.cellAtTile(this.x, this.y);
    this.cell.pill = this;
    return this.cell.retile();
  } else {
    return (this.cell = null);
  }
};
SimPillbox.prototype.serialization = function(isCreate, p) {
  p('B', 'x');
  p('B', 'y');
  p('T', 'owner');
  p('B', 'armour');
  return p('B', 'speed');
};
SimPillbox.prototype.update = function() {
  if (this.armour === 0) {
    return null;
  }
};
SimPillbox.prototype.takeShellHit = function(shell) {
  this.armour = max(0, this.armour - 1);
  return this.cell.retile();
};
SimPillbox.prototype.takeExplosionHit = function() {
  this.armour = max(0, this.armour - 5);
  return this.cell.retile();
};
SimPillbox.register();
module.exports = SimPillbox;
});
require.module('bolo/objects/sim_base', false, function(module, exports, require) {
var SimBase, WorldObject, _ref, max, min;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
_ref = Math, min = _ref.min, max = _ref.max;
WorldObject = require('../world_object');
SimBase = function(map, _arg, _arg2, _arg3, _arg4, _arg5, _arg6) {
  this.mines = _arg6;
  this.shells = _arg5;
  this.armour = _arg4;
  this.owner_idx = _arg3;
  this.y = _arg2;
  this.x = _arg;
  if (arguments.length === 1) {
    SimBase.__super__.constructor.apply(this, arguments);
  } else {
    SimBase.__super__.constructor.call(this, null);
    map.cellAtTile(this.x, this.y).setType('=', false, -1);
  }
  this.on('anySpawn', (__bind(function() {
    this.cell = this.sim.map.cellAtTile(this.x, this.y);
    return (this.cell.base = this);
  }, this)));
  this.on('netUpdate', (__bind(function(changes) {
    return changes.hasOwnProperty('owner') ? this.updateOwner() : null;
  }, this)));
  return this;
};
__extends(SimBase, WorldObject);
SimBase.prototype.charId = 'b';
SimBase.prototype.serialization = function(isCreate, p) {
  if (isCreate) {
    p('B', 'x');
    p('B', 'y');
  }
  p('T', 'owner');
  p('T', 'refueling');
  if (this.refueling) {
    p('B', 'refuelCounter');
  }
  p('B', 'armour');
  p('B', 'shells');
  return p('B', 'mines');
};
SimBase.prototype.takeShellHit = function(shell) {
  return (this.armour = max(0, this.armour - 5));
};
SimBase.prototype.update = function() {
  var amount;
  if (this.refueling && (this.refueling.$.cell !== this.cell || this.refueling.$.armour === 255)) {
    this.ref('refueling', null);
  }
  if (!(this.refueling)) {
    return this.findSubject();
  }
  if (!(--this.refuelCounter === 0)) {
    return null;
  }
  if (this.armour > 0 && this.refueling.$.armour < 40) {
    amount = min(5, this.armour, 40 - this.refueling.$.armour);
    this.refueling.$.armour += amount;
    this.armour -= amount;
    return (this.refuelCounter = 46);
  } else if (this.shells > 0 && this.refueling.$.shells < 40) {
    this.refueling.$.shells += 1;
    this.shells -= 1;
    return (this.refuelCounter = 7);
  } else if (this.mines > 0 && this.refueling.$.mines < 40) {
    this.refueling.$.mines += 1;
    this.mines -= 1;
    return (this.refuelCounter = 7);
  } else {
    return (this.refuelCounter = 1);
  }
};
SimBase.prototype.findSubject = function() {
  var _i, _j, _len, _len2, _ref2, _ref3, _result, canClaim, other, tank, tanks;
  tanks = (function() {
    _result = []; _ref2 = this.sim.tanks;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      tank = _ref2[_i];
      if (tank.armour !== 255 && tank.cell === this.cell) {
        _result.push(tank);
      }
    }
    return _result;
  }).call(this);
  _ref2 = tanks;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    var tank = _ref2[_i];
    if (this.owner == null ? undefined : this.owner.$.isAlly(tank)) {
      this.ref('refueling', tank);
      this.refuelCounter = 46;
      break;
    } else {
      canClaim = true;
      _ref3 = tanks;
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        other = _ref3[_j];
        if (other !== tank) {
          if (!(tank.isAlly(other))) {
            canClaim = false;
          }
        }
      }
      if (canClaim) {
        this.ref('owner', tank);
        this.updateOwner();
        this.owner.on('destroy', (__bind(function() {
          this.ref('owner', null);
          return this.updateOwner();
        }, this)));
        this.ref('refueling', tank);
        this.refuelCounter = 46;
        break;
      }
    }
  }
  return null;
};
SimBase.prototype.updateOwner = function() {
  this.owner_idx = this.owner ? this.owner.$.tank_idx : 255;
  return this.cell.retile();
};
SimBase.register();
module.exports = SimBase;
});
require.module('bolo/objects/tank', false, function(module, exports, require) {
var Explosion, Fireball, PI, Shell, TILE_SIZE_WORLD, Tank, WorldObject, _ref, ceil, cos, max, min, net, round, sin, sqrt;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
_ref = Math, round = _ref.round, ceil = _ref.ceil, min = _ref.min, sqrt = _ref.sqrt, max = _ref.max, sin = _ref.sin, cos = _ref.cos, PI = _ref.PI;
TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
WorldObject = require('../world_object');
net = require('../net');
Explosion = require('./explosion');
Shell = require('./shell');
Fireball = require('./fireball');
Tank = function() {
  Tank.__super__.constructor.apply(this, arguments);
  this.on('spawn', (__bind(function() {
    this.team = this.sim.tanks.length % 2;
    return this.reset();
  }, this)));
  this.on('anySpawn', (__bind(function() {
    this.updateCell();
    return this.sim.addTank(this);
  }, this)));
  this.on('finalize', (__bind(function() {
    return this.sim.removeTank(this);
  }, this)));
  this.on('netUpdate', (__bind(function(changes) {
    return changes.hasOwnProperty('x') || changes.hasOwnProperty('y') ? this.updateCell() : null;
  }, this)));
  return this;
};
__extends(Tank, WorldObject);
Tank.prototype.charId = 'T';
Tank.prototype.styled = true;
Tank.prototype.updateCell = function() {
  var _ref2;
  return (this.cell = (typeof (_ref2 = this.x) !== "undefined" && _ref2 !== null) && (typeof (_ref2 = this.y) !== "undefined" && _ref2 !== null) ? this.sim.map.cellAtWorld(this.x, this.y) : null);
};
Tank.prototype.reset = function() {
  var startingPos;
  startingPos = this.sim.map.getRandomStart();
  this.x = (startingPos.x + 0.5) * TILE_SIZE_WORLD;
  this.y = (startingPos.y + 0.5) * TILE_SIZE_WORLD;
  this.direction = startingPos.direction * 16;
  this.speed = 0.00;
  this.slideTicks = 0;
  this.slideDirection = 0;
  this.accelerating = false;
  this.braking = false;
  this.turningClockwise = false;
  this.turningCounterClockwise = false;
  this.turnSpeedup = 0;
  this.shells = 40;
  this.mines = 0;
  this.armour = 40;
  this.trees = 0;
  this.reload = 0;
  this.shooting = false;
  return (this.onBoat = true);
};
Tank.prototype.serialization = function(isCreate, p) {
  if (isCreate) {
    p('B', 'team');
  }
  p('B', 'armour');
  if (this.armour === 255) {
    p('O', 'fireball');
    this.x = (this.y = null);
    return null;
  } else {
    this.fireball == null ? undefined : this.fireball.clear();
  }
  p('H', 'x');
  p('H', 'y');
  p('B', 'direction');
  p('B', 'speed', {
    tx: function(v) {
      return v * 4;
    },
    rx: function(v) {
      return v / 4;
    }
  });
  p('B', 'slideTicks');
  p('B', 'slideDirection');
  p('B', 'turnSpeedup', {
    tx: function(v) {
      return v + 50;
    },
    rx: function(v) {
      return v - 50;
    }
  });
  p('B', 'shells');
  p('B', 'mines');
  p('B', 'trees');
  p('B', 'reload');
  p('f', 'accelerating');
  p('f', 'braking');
  p('f', 'turningClockwise');
  p('f', 'turningCounterClockwise');
  p('f', 'shooting');
  return p('f', 'onBoat');
};
Tank.prototype.getDirection16th = function() {
  return round((this.direction - 1) / 16) % 16;
};
Tank.prototype.getSlideDirection16th = function() {
  return round((this.slideDirection - 1) / 16) % 16;
};
Tank.prototype.getTile = function() {
  var tx, ty;
  tx = this.getDirection16th();
  ty = this.onBoat ? 1 : 0;
  return [tx, ty];
};
Tank.prototype.isAlly = function(other) {
  return other === this || (this.team !== 255 && other.team === this.team);
};
Tank.prototype.takeShellHit = function(shell) {
  var largeExplosion;
  this.armour -= 5;
  if (this.armour < 0) {
    largeExplosion = this.shell + this.mines > 20;
    this.ref('fireball', this.sim.spawn(Fireball, this.x, this.y, shell.direction, largeExplosion));
    return this.kill();
  }
  this.slideTicks = 8;
  this.slideDirection = shell.direction;
  if (this.onBoat) {
    this.onBoat = false;
    return (this.speed = 0);
  }
};
Tank.prototype.update = function() {
  if (this.death()) {
    return null;
  }
  this.shootOrReload();
  this.turn();
  this.accelerate();
  this.fixPosition();
  return this.move();
};
Tank.prototype.death = function() {
  if (this.armour !== 255) {
    return false;
  }
  if (net.isAuthority() && --this.respawnTimer === 0) {
    delete this.respawnTimer;
    this.reset();
    return false;
  }
  return true;
};
Tank.prototype.shootOrReload = function() {
  if (this.reload > 0) {
    this.reload--;
  }
  if (!(this.shooting && this.reload === 0 && this.shells > 0)) {
    return null;
  }
  this.reload = 13;
  this.shells--;
  return this.sim.spawn(Shell, this, {
    onWater: this.onBoat
  });
};
Tank.prototype.turn = function() {
  var acceleration, maxTurn;
  maxTurn = this.cell.getTankTurn(this);
  if (this.turningClockwise === this.turningCounterClockwise) {
    this.turnSpeedup = 0;
    return null;
  }
  if (this.turningCounterClockwise) {
    acceleration = maxTurn;
    if (this.turnSpeedup < 10) {
      acceleration /= 2;
    }
    if (this.turnSpeedup < 0) {
      this.turnSpeedup = 0;
    }
    this.turnSpeedup++;
  } else {
    acceleration = -maxTurn;
    if (this.turnSpeedup > -10) {
      acceleration /= 2;
    }
    if (this.turnSpeedup > 0) {
      this.turnSpeedup = 0;
    }
    this.turnSpeedup--;
  }
  this.direction += acceleration;
  while (this.direction < 0) {
    this.direction += 256;
  }
  return this.direction >= 256 ? this.direction %= 256 : null;
};
Tank.prototype.accelerate = function() {
  var acceleration, maxSpeed;
  maxSpeed = this.cell.getTankSpeed(this);
  if (this.speed > maxSpeed) {
    acceleration = -0.25;
  } else if (this.accelerating === this.braking) {
    acceleration = 0.00;
  } else if (this.accelerating) {
    acceleration = 0.25;
  } else {
    acceleration = -0.25;
  }
  return acceleration > 0.00 && this.speed < maxSpeed ? (this.speed = min(maxSpeed, this.speed + acceleration)) : (acceleration < 0.00 && this.speed > 0.00 ? (this.speed = max(0.00, this.speed + acceleration)) : null);
};
Tank.prototype.fixPosition = function() {
  var _i, _len, _ref2, _result, distance, dx, dy, halftile, other;
  if (this.cell.getTankSpeed(this) === 0) {
    halftile = TILE_SIZE_WORLD / 2;
    if (this.x % TILE_SIZE_WORLD >= halftile) {
      this.x++;
    } else {
      this.x--;
    }
    if (this.y % TILE_SIZE_WORLD >= halftile) {
      this.y++;
    } else {
      this.y--;
    }
    this.speed = max(0.00, this.speed - 1);
  }
  _result = []; _ref2 = this.sim.tanks;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    other = _ref2[_i];
    if (other !== this && other.armour !== 255) {
      dx = other.x - this.x;
      dy = other.y - this.y;
      distance = sqrt(dx * dx + dy * dy);
      if (distance > 255) {
        continue;
      }
      if (dx < 0) {
        this.x++;
      } else {
        this.x--;
      }
      if (dy < 0) {
        this.y++;
      } else {
        this.y--;
      }
    }
  }
  return _result;
};
Tank.prototype.move = function() {
  var ahead, dx, dy, newx, newy, oldcell, rad, slowDown;
  dx = (dy = 0);
  if (this.speed > 0) {
    rad = (256 - this.getDirection16th() * 16) * 2 * PI / 256;
    dx += round(cos(rad) * ceil(this.speed));
    dy += round(sin(rad) * ceil(this.speed));
  }
  if (this.slideTicks > 0) {
    rad = (256 - this.getSlideDirection16th() * 16) * 2 * PI / 256;
    dx += round(cos(rad) * 16);
    dy += round(sin(rad) * 16);
    this.slideTicks--;
  }
  newx = this.x + dx;
  newy = this.y + dy;
  slowDown = true;
  if (dx !== 0) {
    ahead = dx > 0 ? newx + 64 : newx - 64;
    ahead = this.sim.map.cellAtWorld(ahead, newy);
    if (ahead.getTankSpeed(this) !== 0) {
      slowDown = false;
      if (!(this.onBoat && !ahead.isType(' ', '^') && this.speed < 16)) {
        this.x = newx;
      }
    }
  }
  if (dy !== 0) {
    ahead = dy > 0 ? newy + 64 : newy - 64;
    ahead = this.sim.map.cellAtWorld(newx, ahead);
    if (ahead.getTankSpeed(this) !== 0) {
      slowDown = false;
      if (!(this.onBoat && !ahead.isType(' ', '^') && this.speed < 16)) {
        this.y = newy;
      }
    }
  }
  if (!(dx === 0 && dy === 0)) {
    if (slowDown) {
      this.speed = max(0.00, this.speed - 1);
    }
    oldcell = this.cell;
    this.updateCell();
    return oldcell !== this.cell ? this.checkNewCell(oldcell) : null;
  }
};
Tank.prototype.checkNewCell = function(oldcell) {
  if (this.onBoat) {
    return !(this.cell.isType(' ', '^')) ? this.leaveBoat(oldcell) : null;
  } else {
    if (this.cell.isType('^')) {
      return this.sink();
    }
    if (this.cell.isType('b')) {
      return this.enterBoat();
    }
  }
};
Tank.prototype.leaveBoat = function(oldcell) {
  if (this.cell.isType('b')) {
    this.cell.setType(' ', false, 0);
    return this.sim.spawn(Explosion, (this.cell.x + 0.5) * TILE_SIZE_WORLD, (this.cell.y + 0.5) * TILE_SIZE_WORLD);
  } else {
    if (oldcell.isType(' ')) {
      oldcell.setType('b', false, 0);
    }
    return (this.onBoat = false);
  }
};
Tank.prototype.enterBoat = function() {
  this.cell.setType(' ', false, 0);
  return (this.onBoat = true);
};
Tank.prototype.sink = function() {
  return this.kill();
};
Tank.prototype.kill = function() {
  this.x = (this.y = null);
  this.armour = 255;
  return (this.respawnTimer = 255);
};
Tank.register();
module.exports = Tank;
});
require.module('bolo/constants', false, function(module, exports, require) {
exports.TILE_SIZE_WORLD = 256;
exports.TILE_SIZE_PIXELS = 32;
exports.PIXEL_SIZE_WORLD = 8;
exports.MAP_SIZE_TILES = 256;
exports.TICK_LENGTH_MS = 20;
});
require.module('bolo/objects/explosion', false, function(module, exports, require) {
var Explosion, WorldObject, floor;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
floor = Math.floor;
WorldObject = require('../world_object');
Explosion = function() {
  Explosion.__super__.constructor.apply(this, arguments);
  this.on('spawn', (__bind(function(_arg, _arg2) {
    this.y = _arg2;
    this.x = _arg;
    return (this.lifespan = 23);
  }, this)));
  return this;
};
__extends(Explosion, WorldObject);
Explosion.prototype.charId = 'E';
Explosion.prototype.styled = false;
Explosion.prototype.serialization = function(isCreate, p) {
  if (isCreate) {
    p('H', 'x');
    p('H', 'y');
  }
  return p('B', 'lifespan');
};
Explosion.prototype.update = function() {
  return this.lifespan-- === 0 ? this.sim.destroy(this) : null;
};
Explosion.prototype.getTile = function() {
  switch (floor(this.lifespan / 3)) {
    case 7:
      return [20, 3];
    case 6:
      return [21, 3];
    case 5:
      return [20, 4];
    case 4:
      return [21, 4];
    case 3:
      return [20, 5];
    case 2:
      return [21, 5];
    case 1:
      return [18, 4];
    default:
      return [19, 4];
  }
};
Explosion.register();
module.exports = Explosion;
});
require.module('bolo/objects/shell', false, function(module, exports, require) {
var Destructable, Explosion, PI, Shell, TILE_SIZE_WORLD, WorldObject, _ref, cos, floor, round, sin, sqrt;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
_ref = Math, round = _ref.round, floor = _ref.floor, sqrt = _ref.sqrt, cos = _ref.cos, sin = _ref.sin, PI = _ref.PI;
WorldObject = require('../world_object');
TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
Explosion = require('./explosion');
Destructable = function() {};
Destructable.prototype.takeShellHit = function(shell) {};
Shell = function() {
  Shell.__super__.constructor.apply(this, arguments);
  this.on('spawn', (__bind(function(owner, options) {
    options || (options = {});
    this.ref('owner', owner);
    this.owner.on('destroy', (__bind(function() {
      return this.sim.destroy(this);
    }, this)));
    this.direction = options.direction || this.owner.$.direction;
    this.lifespan = options.lifespan || (7 * TILE_SIZE_WORLD / 32 - 2);
    this.onWater = options.onWater || false;
    this.x = this.owner.$.x;
    this.y = this.owner.$.y;
    return this.move();
  }, this)));
  this.on('netSync', (__bind(function() {
    return this.updateCell();
  }, this)));
  return this;
};
__extends(Shell, WorldObject);
Shell.prototype.charId = 'S';
Shell.prototype.updatePriority = 20;
Shell.prototype.styled = false;
Shell.prototype.serialization = function(isCreate, p) {
  if (isCreate) {
    p('B', 'direction');
    p('O', 'owner');
    p('f', 'onWater');
  }
  p('H', 'x');
  p('H', 'y');
  return p('B', 'lifespan');
};
Shell.prototype.updateCell = function() {
  return (this.cell = this.sim.map.cellAtWorld(this.x, this.y));
};
Shell.prototype.getDirection16th = function() {
  return round((this.direction - 1) / 16) % 16;
};
Shell.prototype.getTile = function() {
  var tx;
  tx = this.getDirection16th();
  return [tx, 4];
};
Shell.prototype.update = function() {
  var _ref2, collision, mode, sfx, victim, x, y;
  this.move();
  collision = this.collide();
  if (collision) {
    _ref2 = collision, mode = _ref2[0], victim = _ref2[1];
    sfx = victim.takeShellHit(this);
    if (mode === 'cell') {
      x = (this.cell.x + 0.5) * TILE_SIZE_WORLD;
      y = (this.cell.y + 0.5) * TILE_SIZE_WORLD;
    } else {
      _ref2 = this, x = _ref2.x, y = _ref2.y;
    }
    this.sim.spawn(Explosion, x, y);
    this.sim.destroy(this);
  }
  if (!(this.lifespan-- === 0)) {
    return null;
  }
  this.sim.destroy(this);
  return this.sim.spawn(Explosion, this.x, this.y);
};
Shell.prototype.move = function() {
  this.radians || (this.radians = ((256 - this.direction) * 2 * PI / 256));
  this.x += round(cos(this.radians) * 32);
  this.y += round(sin(this.radians) * 32);
  return this.updateCell();
};
Shell.prototype.collide = function() {
  var _i, _len, _ref2, base, distance, dx, dy, pill, tank, terrainCollision;
  if (pill = this.cell.pill) {
    if (pill.armour > 0) {
      return ['cell', pill];
    }
  }
  _ref2 = this.sim.tanks;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    tank = _ref2[_i];
    if (tank !== this.owner.$ && tank.armour !== 255) {
      dx = tank.x - this.x;
      dy = tank.y - this.y;
      distance = sqrt(dx * dx + dy * dy);
      if (distance <= 127) {
        return ['tank', tank];
      }
    }
  }
  if (base = this.cell.base) {
    if (this.onWater || (base.armour > 4 && (typeof (_ref2 = (typeof base === "undefined" || base === null) ? undefined : base.owner) !== "undefined" && _ref2 !== null) && !base.owner.$.isAlly(this.owner.$))) {
      return ['cell', base];
    }
  }
  terrainCollision = this.onWater ? !this.cell.isType('^', ' ', '%') : this.cell.isType('|', '}', '#', 'b');
  if (terrainCollision) {
    return ['cell', this.cell];
  }
};
Shell.register();
module.exports = Shell;
});
require.module('bolo/objects/fireball', false, function(module, exports, require) {
var Explosion, Fireball, PI, TILE_SIZE_WORLD, WorldObject, _ref, cos, round, sin;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
_ref = Math, round = _ref.round, cos = _ref.cos, sin = _ref.sin, PI = _ref.PI;
TILE_SIZE_WORLD = require('../constants').TILE_SIZE_WORLD;
WorldObject = require('../world_object');
Explosion = require('./explosion');
Fireball = function() {
  Fireball.__super__.constructor.apply(this, arguments);
  this.on('spawn', (__bind(function(_arg, _arg2, _arg3, _arg4) {
    this.largeExplosion = _arg4;
    this.direction = _arg3;
    this.y = _arg2;
    this.x = _arg;
    return (this.lifespan = 80);
  }, this)));
  return this;
};
__extends(Fireball, WorldObject);
Fireball.prototype.charId = 'F';
Fireball.prototype.styled = null;
Fireball.prototype.serialization = function(isCreate, p) {
  if (isCreate) {
    p('B', 'direction');
    p('f', 'largeExplosion');
  }
  p('H', 'x');
  p('H', 'y');
  return p('B', 'lifespan');
};
Fireball.prototype.getDirection16th = function() {
  return round((this.direction - 1) / 16) % 16;
};
Fireball.prototype.update = function() {
  if (this.lifespan-- % 2 === 0) {
    if (this.wreck()) {
      return null;
    }
    this.move();
  }
  if (this.lifespan === 0) {
    this.explode();
    return this.sim.destroy(this);
  }
};
Fireball.prototype.wreck = function() {
  var cell;
  this.sim.spawn(Explosion, this.x, this.y);
  cell = this.sim.map.cellAtWorld(this.x, this.y);
  if (cell.isType('^')) {
    this.sim.destroy(this);
    return true;
  } else if (cell.isType('b')) {
    cell.setType(' ');
  } else if (cell.isType('#')) {
    cell.setType('.');
  }
  return false;
};
Fireball.prototype.move = function() {
  var _ref2, ahead, dx, dy, newx, newy, radians;
  if (!(typeof (_ref2 = this.dx) !== "undefined" && _ref2 !== null)) {
    radians = (256 - this.direction) * 2 * PI / 256;
    this.dx = round(cos(radians) * 48);
    this.dy = round(sin(radians) * 48);
  }
  _ref2 = this, dx = _ref2.dx, dy = _ref2.dy;
  newx = this.x + dx;
  newy = this.y + dy;
  if (dx !== 0) {
    ahead = dx > 0 ? newx + 24 : newx - 24;
    ahead = this.sim.map.cellAtWorld(ahead, newy);
    if (!(ahead.isObstacle())) {
      this.x = newx;
    }
  }
  if (dy !== 0) {
    ahead = dy > 0 ? newy + 24 : newy - 24;
    ahead = this.sim.map.cellAtWorld(newx, ahead);
    return !(ahead.isObstacle()) ? (this.y = newy) : null;
  }
};
Fireball.prototype.explode = function() {
  var _i, _len, _ref2, _ref3, c, cell, dx, dy, x, y;
  cell = this.sim.map.cellAtWorld(this.x, this.y);
  if (this.largeExplosion) {
    dx = this.dx > 0 ? 1 : -1;
    dy = this.dy > 0 ? 1 : -1;
    _ref2 = [cell.neigh(dx, 0), cell.neigh(0, dy), cell.neigh(dx, dy)];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      c = _ref2[_i];
      _ref3 = c.getWorldCoordinates(), x = _ref3[0], y = _ref3[1];
      this.sim.spawn(Explosion, x, y);
      c.takeExplosionHit();
    }
  }
  _ref2 = cell.getWorldCoordinates(), x = _ref2[0], y = _ref2[1];
  this.sim.spawn(Explosion, x, y);
  return cell.takeExplosionHit();
};
Fireball.register();
module.exports = Fireball;
});
require.module('bolo/sim_map', false, function(module, exports, require) {
var Map, SimBase, SimMap, SimMapCell, SimMapObject, SimPillbox, TERRAIN_TYPES, TERRAIN_TYPE_ATTRIBUTES, TILE_SIZE_PIXELS, TILE_SIZE_WORLD, WorldObject, _ref, extendTerrainMap, floor, net, random, round;
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
_ref = Math, round = _ref.round, random = _ref.random, floor = _ref.floor;
_ref = require('./constants'), TILE_SIZE_WORLD = _ref.TILE_SIZE_WORLD, TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS;
_ref = require('./map'), Map = _ref.Map, TERRAIN_TYPES = _ref.TERRAIN_TYPES;
net = require('./net');
WorldObject = require('./world_object');
SimPillbox = require('./objects/sim_pillbox');
SimBase = require('./objects/sim_base');
TERRAIN_TYPE_ATTRIBUTES = {
  '|': {
    tankSpeed: 0,
    tankTurn: 0.00,
    manSpeed: 0
  },
  ' ': {
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 0
  },
  '~': {
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4
  },
  '%': {
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4
  },
  '=': {
    tankSpeed: 16,
    tankTurn: 1.00,
    manSpeed: 16
  },
  '#': {
    tankSpeed: 6,
    tankTurn: 0.50,
    manSpeed: 8
  },
  ':': {
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4
  },
  '.': {
    tankSpeed: 12,
    tankTurn: 1.00,
    manSpeed: 16
  },
  '}': {
    tankSpeed: 0,
    tankTurn: 0.00,
    manSpeed: 0
  },
  'b': {
    tankSpeed: 16,
    tankTurn: 1.00,
    manSpeed: 16
  },
  '^': {
    tankSpeed: 3,
    tankTurn: 0.50,
    manSpeed: 0
  }
};
extendTerrainMap = function() {
  var _ref2, _ref3, _result, _result2, ascii, attributes, key, type, value;
  _result = []; _ref2 = TERRAIN_TYPE_ATTRIBUTES;
  for (ascii in _ref2) {
    if (!__hasProp.call(_ref2, ascii)) continue;
    attributes = _ref2[ascii];
    _result.push((function() {
      type = TERRAIN_TYPES[ascii];
      _result2 = []; _ref3 = attributes;
      for (key in _ref3) {
        if (!__hasProp.call(_ref3, key)) continue;
        value = _ref3[key];
        _result2.push(type[key] = value);
      }
      return _result2;
    })());
  }
  return _result;
};
extendTerrainMap();
SimMapCell = function(map, x, y) {
  SimMapCell.__super__.constructor.apply(this, arguments);
  this.life = 0;
  return this;
};
__extends(SimMapCell, Map.prototype.CellClass);
SimMapCell.prototype.isObstacle = function() {
  return (this.pill == null ? undefined : this.pill.armour) > 0 || this.type.tankSpeed === 0;
};
SimMapCell.prototype.getTankSpeed = function(tank) {
  if ((this.pill == null ? undefined : this.pill.armour) > 0) {
    return 0;
  }
  if (this.base == null ? undefined : this.base.owner) {
    if (!(this.base.owner.$.isAlly(tank) || (this.base.armour <= 9))) {
      return 0;
    }
  }
  if (tank.onBoat && this.isType('^', ' ')) {
    return 16;
  }
  return this.type.tankSpeed;
};
SimMapCell.prototype.getTankTurn = function(tank) {
  if ((this.pill == null ? undefined : this.pill.armour) > 0) {
    return 0.00;
  }
  if (this.base == null ? undefined : this.base.owner) {
    if (!(this.base.owner.$.isAlly(tank) || (this.base.armour <= 9))) {
      return 0.00;
    }
  }
  if (tank.onBoat && this.isType('^', ' ')) {
    return 1.00;
  }
  return this.type.tankTurn;
};
SimMapCell.prototype.getManSpeed = function(man) {
  var _ref2, tank;
  tank = man.tank;
  if ((this.pill == null ? undefined : this.pill.armour) > 0) {
    return 0;
  }
  if (typeof (_ref2 = this.base == null ? undefined : this.base.owner) !== "undefined" && _ref2 !== null) {
    if (!(this.base.owner === tank || tank.isAlly(this.base.owner) || (this.base.armour <= 9))) {
      return 0;
    }
  }
  if (man.onBoat && this.isType('^', ' ')) {
    return 16;
  }
  return this.type.manSpeed;
};
SimMapCell.prototype.getPixelCoordinates = function() {
  return [(this.x + 0.5) * TILE_SIZE_PIXELS, (this.y + 0.5) * TILE_SIZE_PIXELS];
};
SimMapCell.prototype.getWorldCoordinates = function() {
  return [(this.x + 0.5) * TILE_SIZE_WORLD, (this.y + 0.5) * TILE_SIZE_WORLD];
};
SimMapCell.prototype.setType = function(newType, mine, retileRadius) {
  var _ref2, hadMine, oldLife, oldType;
  _ref2 = [this.type, this.mine, this.life], oldType = _ref2[0], hadMine = _ref2[1], oldLife = _ref2[2];
  SimMapCell.__super__.setType.apply(this, arguments);
  this.life = (function() {
    switch (this.type.ascii) {
      case '.':
        return 5;
      case '}':
        return 5;
      case ':':
        return 5;
      case '~':
        return 4;
      default:
        return 0;
    }
  }).call(this);
  return net.mapChanged(this, oldType, hadMine, oldLife);
};
SimMapCell.prototype.takeShellHit = function(shell) {
  var neigh, nextType, sfx;
  sfx = 'shot_building';
  if (this.isType('.', '}', ':', '~')) {
    if (--this.life === 0) {
      nextType = (function() {
        switch (this.type.ascii) {
          case '.':
            return '~';
          case '}':
            return ':';
          case ':':
            return ' ';
          case '~':
            return ' ';
        }
      }).call(this);
      this.setType(nextType);
    } else {
      net.mapChanged(this, this.type, this.mine);
    }
  } else if (this.isType('#')) {
    this.setType('.');
    sfx = 'shot_tree';
  } else if (this.isType('=')) {
    neigh = (shell.direction >= 224) || shell.direction < 32 ? this.neigh(1, 0) : ((shell.direction >= 32) && shell.direction < 96 ? this.neigh(0, -1) : ((shell.direction >= 96) && shell.direction < 160 ? this.neigh(-1, 0) : this.neigh(0, 1)));
    if (neigh.isType(' ', '^')) {
      this.setType(' ');
    }
  } else {
    nextType = (function() {
      switch (this.type.ascii) {
        case '|':
          return '}';
        case 'b':
          return ' ';
      }
    }).call(this);
    this.setType(nextType);
  }
  return sfx;
};
SimMapCell.prototype.takeExplosionHit = function() {
  var _ref2;
  return (typeof (_ref2 = this.pill) !== "undefined" && _ref2 !== null) ? this.pill.takeExplosionHit() : (this.isType('b') ? this.setType(' ') : (!(this.isType(' ', '^', 'b')) ? this.setType('%') : null));
};
SimMapObject = function() {};
SimMapObject.prototype.postMapObjectInitialize = function(sim) {};
SimMap = function() {
  return Map.apply(this, arguments);
};
__extends(SimMap, Map);
SimMap.prototype.CellClass = SimMapCell;
SimMap.prototype.PillboxClass = SimPillbox;
SimMap.prototype.BaseClass = SimBase;
SimMap.prototype.cellAtPixel = function(x, y) {
  return this.cellAtTile(floor(x / TILE_SIZE_PIXELS), floor(y / TILE_SIZE_PIXELS));
};
SimMap.prototype.cellAtWorld = function(x, y) {
  return this.cellAtTile(floor(x / TILE_SIZE_WORLD), floor(y / TILE_SIZE_WORLD));
};
SimMap.prototype.getRandomStart = function() {
  return this.starts[round(random() * (this.starts.length - 1))];
};
exports.SimMapObject = SimMapObject;
exports.SimMap = SimMap;
});
require.module('bolo/map', false, function(module, exports, require) {
var Base, MAP_SIZE_TILES, Map, MapCell, MapView, Pillbox, Start, TERRAIN_TYPES, _ref, createTerrainMap, floor, min;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
_ref = Math, floor = _ref.floor, min = _ref.min;
MAP_SIZE_TILES = require('./constants').MAP_SIZE_TILES;
TERRAIN_TYPES = [
  {
    ascii: '|',
    description: 'building'
  }, {
    ascii: ' ',
    description: 'river'
  }, {
    ascii: '~',
    description: 'swamp'
  }, {
    ascii: '%',
    description: 'crater'
  }, {
    ascii: '=',
    description: 'road'
  }, {
    ascii: '#',
    description: 'forest'
  }, {
    ascii: ':',
    description: 'rubble'
  }, {
    ascii: '.',
    description: 'grass'
  }, {
    ascii: '}',
    description: 'shot building'
  }, {
    ascii: 'b',
    description: 'river with boat'
  }, {
    ascii: '^',
    description: 'deep sea'
  }
];
createTerrainMap = function() {
  var _i, _len, _ref2, _result, type;
  _result = []; _ref2 = TERRAIN_TYPES;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    type = _ref2[_i];
    _result.push(TERRAIN_TYPES[type.ascii] = type);
  }
  return _result;
};
createTerrainMap();
MapCell = function(_arg, _arg2, _arg3) {
  this.y = _arg3;
  this.x = _arg2;
  this.map = _arg;
  this.type = TERRAIN_TYPES['^'];
  this.mine = false;
  this.idx = this.y * MAP_SIZE_TILES + this.x;
  return this;
};
MapCell.prototype.neigh = function(dx, dy) {
  return this.map.cellAtTile(this.x + dx, this.y + dy);
};
MapCell.prototype.isType = function() {
  var _ref2, i, type;
  _ref2 = arguments.length;
  for (i = 0; (0 <= _ref2 ? i <= _ref2 : i >= _ref2); (0 <= _ref2 ? i += 1 : i -= 1)) {
    type = arguments[i];
    if (this.type === type || this.type.ascii === type) {
      return true;
    }
  }
  return false;
};
MapCell.prototype.getNumericType = function() {
  var num;
  if (this.type.ascii === '^') {
    return -1;
  }
  num = TERRAIN_TYPES.indexOf(this.type);
  if (this.mine) {
    num += 8;
  }
  return num;
};
MapCell.prototype.setType = function(newType, mine, retileRadius) {
  var _ref2, hadMine, oldType;
  mine || (mine = false);
  retileRadius || (retileRadius = 1);
  oldType = this.type;
  hadMine = this.mine;
  this.mine = mine;
  if (typeof (newType) === 'string') {
    this.type = TERRAIN_TYPES[newType];
    if (newType.length !== 1 || !(typeof (_ref2 = this.type) !== "undefined" && _ref2 !== null)) {
      throw ("Invalid terrain type: " + (newType));
    }
  } else if (typeof (newType) === 'number') {
    if (newType >= 10) {
      newType -= 8;
      this.mine = true;
    } else {
      this.mine = false;
    }
    this.type = TERRAIN_TYPES[newType];
    if (!(typeof (_ref2 = this.type) !== "undefined" && _ref2 !== null)) {
      throw ("Invalid terrain type: " + (newType));
    }
  } else {
    this.type = newType;
  }
  return !(retileRadius < 0) ? this.map.retile(this.x - retileRadius, this.y - retileRadius, this.x + retileRadius, this.y + retileRadius) : null;
};
MapCell.prototype.setTile = function(tx, ty) {
  return this.map.view.onRetile(this, tx, ty);
};
MapCell.prototype.retile = function() {
  var _ref2;
  if (typeof (_ref2 = this.pill) !== "undefined" && _ref2 !== null) {
    return this.setTile(this.pill.armour, 2);
  } else if (typeof (_ref2 = this.base) !== "undefined" && _ref2 !== null) {
    return this.setTile(16, 0);
  } else {
    switch (this.type.ascii) {
      case '^':
        return this.retileDeepSea();
      case '|':
        return this.retileBuilding();
      case ' ':
        return this.retileRiver();
      case '~':
        return this.setTile(7, 1);
      case '%':
        return this.setTile(5, 1);
      case '=':
        return this.retileRoad();
      case '#':
        return this.retileForest();
      case ':':
        return this.setTile(4, 1);
      case '.':
        return this.setTile(2, 1);
      case '}':
        return this.setTile(8, 1);
      case 'b':
        return this.retileBoat();
    }
  }
};
MapCell.prototype.retileDeepSea = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = (__bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('^')) {
      return 'd';
    }
    if (n.isType(' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this));
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  return aboveLeft !== 'd' && above !== 'd' && left !== 'd' && right === 'd' && below === 'd' ? this.setTile(10, 3) : (aboveRight !== 'd' && above !== 'd' && right !== 'd' && left === 'd' && below === 'd' ? this.setTile(11, 3) : (belowRight !== 'd' && below !== 'd' && right !== 'd' && left === 'd' && above === 'd' ? this.setTile(13, 3) : (belowLeft !== 'd' && below !== 'd' && left !== 'd' && right === 'd' && above === 'd' ? this.setTile(12, 3) : (left === 'w' && right === 'd' ? this.setTile(14, 3) : (below === 'w' && above === 'd' ? this.setTile(15, 3) : (above === 'w' && below === 'd' ? this.setTile(16, 3) : (right === 'w' && left === 'd' ? this.setTile(17, 3) : this.setTile(0, 0))))))));
};
MapCell.prototype.retileBuilding = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = (__bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('|', '}')) {
      return 'b';
    }
    return 'o';
  }, this));
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  return aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(17, 1) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b' ? this.setTile(30, 1) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft === 'b' ? this.setTile(22, 2) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft === 'b' && belowRight !== 'b' && belowLeft !== 'b' ? this.setTile(23, 2) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight === 'b' && belowLeft !== 'b' ? this.setTile(24, 2) : (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight === 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b' ? this.setTile(25, 2) : (aboveLeft === 'b' && above === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(16, 2) : (above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(17, 2) : (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' ? this.setTile(18, 2) : (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(19, 2) : (left === 'b' && right === 'b' && above === 'b' && below === 'b' && aboveRight === 'b' && belowLeft === 'b' && aboveLeft !== 'b' && belowRight !== 'b' ? this.setTile(20, 2) : (left === 'b' && right === 'b' && above === 'b' && below === 'b' && belowRight === 'b' && aboveLeft === 'b' && aboveRight !== 'b' && belowLeft !== 'b' ? this.setTile(21, 2) : (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b' && aboveRight === 'b' ? this.setTile(8, 2) : (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && aboveLeft === 'b' ? this.setTile(9, 2) : (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight === 'b' ? this.setTile(10, 2) : (above === 'b' && left === 'b' && right === 'b' && below === 'b' && aboveLeft === 'b' && aboveRight === 'b' ? this.setTile(11, 2) : (above === 'b' && below === 'b' && left === 'b' && right !== 'b' && belowLeft === 'b' && aboveLeft !== 'b' ? this.setTile(12, 2) : (above === 'b' && below === 'b' && right === 'b' && belowRight === 'b' && left !== 'b' && aboveRight !== 'b' ? this.setTile(13, 2) : (above === 'b' && below === 'b' && right === 'b' && aboveRight === 'b' && belowRight !== 'b' ? this.setTile(14, 2) : (above === 'b' && below === 'b' && left === 'b' && aboveLeft === 'b' && belowLeft !== 'b' ? this.setTile(15, 2) : (right === 'b' && above === 'b' && left === 'b' && below !== 'b' && aboveLeft !== 'b' && aboveRight !== 'b' ? this.setTile(26, 1) : (right === 'b' && below === 'b' && left === 'b' && belowLeft !== 'b' && belowRight !== 'b' ? this.setTile(27, 1) : (right === 'b' && above === 'b' && below === 'b' && aboveRight !== 'b' && belowRight !== 'b' ? this.setTile(28, 1) : (below === 'b' && above === 'b' && left === 'b' && aboveLeft !== 'b' && belowLeft !== 'b' ? this.setTile(29, 1) : (left === 'b' && right === 'b' && above === 'b' && aboveRight === 'b' && aboveLeft !== 'b' ? this.setTile(4, 2) : (left === 'b' && right === 'b' && above === 'b' && aboveLeft === 'b' && aboveRight !== 'b' ? this.setTile(5, 2) : (left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight !== 'b' ? this.setTile(6, 2) : (left === 'b' && right === 'b' && below === 'b' && above !== 'b' && belowRight === 'b' && belowLeft !== 'b' ? this.setTile(7, 2) : (right === 'b' && above === 'b' && below === 'b' ? this.setTile(0, 2) : (left === 'b' && above === 'b' && below === 'b' ? this.setTile(1, 2) : (right === 'b' && left === 'b' && below === 'b' ? this.setTile(2, 2) : (right === 'b' && above === 'b' && left === 'b' ? this.setTile(3, 2) : (right === 'b' && below === 'b' && belowRight === 'b' ? this.setTile(18, 1) : (left === 'b' && below === 'b' && belowLeft === 'b' ? this.setTile(19, 1) : (right === 'b' && above === 'b' && aboveRight === 'b' ? this.setTile(20, 1) : (left === 'b' && above === 'b' && aboveLeft === 'b' ? this.setTile(21, 1) : (right === 'b' && below === 'b' ? this.setTile(22, 1) : (left === 'b' && below === 'b' ? this.setTile(23, 1) : (right === 'b' && above === 'b' ? this.setTile(24, 1) : (left === 'b' && above === 'b' ? this.setTile(25, 1) : (left === 'b' && right === 'b' ? this.setTile(11, 1) : (above === 'b' && below === 'b' ? this.setTile(12, 1) : (right === 'b' ? this.setTile(13, 1) : (left === 'b' ? this.setTile(14, 1) : (below === 'b' ? this.setTile(15, 1) : (above === 'b' ? this.setTile(16, 1) : this.setTile(6, 1))))))))))))))))))))))))))))))))))))))))))))));
};
MapCell.prototype.retileRiver = function() {
  var above, below, left, neighbourSignificance, right;
  neighbourSignificance = (__bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('=')) {
      return 'r';
    }
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this));
  above = neighbourSignificance(0, -1);
  right = neighbourSignificance(1, 0);
  below = neighbourSignificance(0, 1);
  left = neighbourSignificance(-1, 0);
  return above === 'l' && below === 'l' && right === 'l' && left === 'l' ? this.setTile(30, 2) : (above === 'l' && below === 'l' && right === 'w' && left === 'l' ? this.setTile(26, 2) : (above === 'l' && below === 'l' && right === 'l' && left === 'w' ? this.setTile(27, 2) : (above === 'l' && below === 'w' && right === 'l' && left === 'l' ? this.setTile(28, 2) : (above === 'w' && below === 'l' && right === 'l' && left === 'l' ? this.setTile(29, 2) : (above === 'l' && left === 'l' ? this.setTile(6, 3) : (above === 'l' && right === 'l' ? this.setTile(7, 3) : (below === 'l' && left === 'l' ? this.setTile(8, 3) : (below === 'l' && right === 'l' ? this.setTile(9, 3) : (below === 'l' && above === 'l' && below === 'l' ? this.setTile(0, 3) : (left === 'l' && right === 'l' ? this.setTile(1, 3) : (left === 'l' ? this.setTile(2, 3) : (below === 'l' ? this.setTile(3, 3) : (right === 'l' ? this.setTile(4, 3) : (above === 'l' ? this.setTile(5, 3) : this.setTile(1, 0)))))))))))))));
};
MapCell.prototype.retileRoad = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = (__bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('=')) {
      return 'r';
    }
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this));
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  return aboveLeft !== 'r' && above === 'r' && aboveRight !== 'r' && left === 'r' && right === 'r' && belowLeft !== 'r' && below === 'r' && belowRight !== 'r' ? this.setTile(11, 0) : (above === 'r' && left === 'r' && right === 'r' && below === 'r' ? this.setTile(10, 0) : (left === 'w' && right === 'w' && above === 'w' && below === 'w' ? this.setTile(26, 0) : (right === 'r' && below === 'r' && left === 'w' && above === 'w' ? this.setTile(20, 0) : (left === 'r' && below === 'r' && right === 'w' && above === 'w' ? this.setTile(21, 0) : (above === 'r' && left === 'r' && below === 'w' && right === 'w' ? this.setTile(22, 0) : (right === 'r' && above === 'r' && left === 'w' && below === 'w' ? this.setTile(23, 0) : (above === 'w' && below === 'w' ? this.setTile(24, 0) : (left === 'w' && right === 'w' ? this.setTile(25, 0) : (above === 'w' && below === 'r' ? this.setTile(16, 0) : (right === 'w' && left === 'r' ? this.setTile(17, 0) : (below === 'w' && above === 'r' ? this.setTile(18, 0) : (left === 'w' && right === 'r' ? this.setTile(19, 0) : (right === 'r' && below === 'r' && above === 'r' && (aboveRight === 'r' || belowRight === 'r') ? this.setTile(27, 0) : (left === 'r' && right === 'r' && below === 'r' && (belowLeft === 'r' || belowRight === 'r') ? this.setTile(28, 0) : (left === 'r' && above === 'r' && below === 'r' && (belowLeft === 'r' || aboveLeft === 'r') ? this.setTile(29, 0) : (left === 'r' && right === 'r' && above === 'r' && (aboveRight === 'r' || aboveLeft === 'r') ? this.setTile(30, 0) : (left === 'r' && right === 'r' && below === 'r' ? this.setTile(12, 0) : (left === 'r' && above === 'r' && below === 'r' ? this.setTile(13, 0) : (left === 'r' && right === 'r' && above === 'r' ? this.setTile(14, 0) : (right === 'r' && above === 'r' && below === 'r' ? this.setTile(15, 0) : (below === 'r' && right === 'r' && belowRight === 'r' ? this.setTile(6, 0) : (below === 'r' && left === 'r' && belowLeft === 'r' ? this.setTile(7, 0) : (above === 'r' && left === 'r' && aboveLeft === 'r' ? this.setTile(8, 0) : (above === 'r' && right === 'r' && aboveRight === 'r' ? this.setTile(9, 0) : (below === 'r' && right === 'r' ? this.setTile(2, 0) : (below === 'r' && left === 'r' ? this.setTile(3, 0) : (above === 'r' && left === 'r' ? this.setTile(4, 0) : (above === 'r' && right === 'r' ? this.setTile(5, 0) : (right === 'r' || left === 'r' ? this.setTile(0, 1) : (above === 'r' || below === 'r' ? this.setTile(1, 1) : this.setTile(10, 0)))))))))))))))))))))))))))))));
};
MapCell.prototype.retileForest = function() {
  var above, below, left, right;
  above = this.neigh(0, -1).isType('#');
  right = this.neigh(1, 0).isType('#');
  below = this.neigh(0, 1).isType('#');
  left = this.neigh(-1, 0).isType('#');
  return !above && !left && right && below ? this.setTile(9, 9) : (!above && left && !right && below ? this.setTile(10, 9) : (above && left && !right && !below ? this.setTile(11, 9) : (above && !left && right && !below ? this.setTile(12, 9) : (above && !left && !right && !below ? this.setTile(16, 9) : (!above && !left && !right && below ? this.setTile(15, 9) : (!above && left && !right && !below ? this.setTile(14, 9) : (!above && !left && right && !below ? this.setTile(13, 9) : (!above && !left && !right && !below ? this.setTile(8, 9) : this.setTile(3, 1)))))))));
};
MapCell.prototype.retileBoat = function() {
  var above, below, left, neighbourSignificance, right;
  neighbourSignificance = (__bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this));
  above = neighbourSignificance(0, -1);
  right = neighbourSignificance(1, 0);
  below = neighbourSignificance(0, 1);
  left = neighbourSignificance(-1, 0);
  return above !== 'w' && left !== 'w' ? this.setTile(15, 6) : (above !== 'w' && right !== 'w' ? this.setTile(16, 6) : (below !== 'w' && right !== 'w' ? this.setTile(17, 6) : (below !== 'w' && left !== 'w' ? this.setTile(14, 6) : (left !== 'w' ? this.setTile(12, 6) : (right !== 'w' ? this.setTile(13, 6) : (below !== 'w' ? this.setTile(10, 6) : this.setTile(11, 6)))))));
};
MapView = function() {};
MapView.prototype.onRetile = function(cell, tx, ty) {};
Pillbox = function(map, _arg, _arg2, _arg3, _arg4, _arg5) {
  this.speed = _arg5;
  this.armour = _arg4;
  this.owner_idx = _arg3;
  this.y = _arg2;
  this.x = _arg;
  return this;
};
Base = function(map, _arg, _arg2, _arg3, _arg4, _arg5, _arg6) {
  this.mines = _arg6;
  this.shells = _arg5;
  this.armour = _arg4;
  this.owner_idx = _arg3;
  this.y = _arg2;
  this.x = _arg;
  return this;
};
Start = function(map, _arg, _arg2, _arg3) {
  this.direction = _arg3;
  this.y = _arg2;
  this.x = _arg;
  return this;
};
Map = function() {
  var row, x, y;
  this.view = new MapView();
  this.pills = [];
  this.bases = [];
  this.starts = [];
  this.cells = new Array(MAP_SIZE_TILES);
  for (y = 0; (0 <= MAP_SIZE_TILES ? y < MAP_SIZE_TILES : y > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? y += 1 : y -= 1)) {
    row = (this.cells[y] = new Array(MAP_SIZE_TILES));
    for (x = 0; (0 <= MAP_SIZE_TILES ? x < MAP_SIZE_TILES : x > MAP_SIZE_TILES); (0 <= MAP_SIZE_TILES ? x += 1 : x -= 1)) {
      row[x] = new this.CellClass(this, x, y);
    }
  }
  return this;
};
Map.prototype.CellClass = MapCell;
Map.prototype.PillboxClass = Pillbox;
Map.prototype.BaseClass = Base;
Map.prototype.StartClass = Start;
Map.prototype.setView = function(_arg) {
  this.view = _arg;
  return this.retile();
};
Map.prototype.cellAtTile = function(x, y) {
  var cell;
  return (cell = this.cells[y] == null ? undefined : this.cells[y][x]) ? cell : new this.CellClass(this, x, y, {
    isDummy: true
  });
};
Map.prototype.each = function(cb, sx, sy, ex, ey) {
  var row, x, y;
  if (!((sx != null) && (sx >= 0))) {
    sx = 0;
  }
  if (!((sy != null) && (sy >= 0))) {
    sy = 0;
  }
  if (!((ex != null) && ex < MAP_SIZE_TILES)) {
    ex = MAP_SIZE_TILES - 1;
  }
  if (!((ey != null) && ey < MAP_SIZE_TILES)) {
    ey = MAP_SIZE_TILES - 1;
  }
  for (y = sy; (sy <= ey ? y <= ey : y >= ey); (sy <= ey ? y += 1 : y -= 1)) {
    row = this.cells[y];
    for (x = sx; (sx <= ex ? x <= ex : x >= ex); (sx <= ex ? x += 1 : x -= 1)) {
      cb(row[x]);
    }
  }
  return this;
};
Map.prototype.clear = function(sx, sy, ex, ey) {
  return this.each(function(cell) {
    cell.type = TERRAIN_TYPES['^'];
    return (cell.mine = false);
  }, sx, sy, ex, ey);
};
Map.prototype.retile = function(sx, sy, ex, ey) {
  return this.each(function(cell) {
    return cell.retile();
  }, sx, sy, ex, ey);
};
Map.prototype.dump = function(options) {
  var _i, _len, _ref2, _result, b, bases, c, consecutiveCells, data, encodeNibbles, ensureRunSpace, ex, flushRun, flushSequence, p, pills, run, s, seq, starts, sx, y;
  options || (options = {});
  consecutiveCells = function(row, cb) {
    var _len, _ref2, cell, count, currentType, num, startx, x;
    currentType = null;
    startx = null;
    count = 0;
    _ref2 = row;
    for (x = 0, _len = _ref2.length; x < _len; x++) {
      cell = _ref2[x];
      num = cell.getNumericType();
      if (currentType === num) {
        count++;
        continue;
      }
      if (currentType != null) {
        cb(currentType, count, startx);
      }
      currentType = num;
      startx = x;
      count = 1;
    }
    if (currentType != null) {
      cb(currentType, count, startx);
    }
    return null;
  };
  encodeNibbles = function(nibbles) {
    var _len, _ref2, i, nibble, octets, val;
    octets = [];
    val = null;
    _ref2 = nibbles;
    for (i = 0, _len = _ref2.length; i < _len; i++) {
      nibble = _ref2[i];
      nibble = nibble & 0x0F;
      if (i % 2 === 0) {
        val = nibble << 4;
      } else {
        octets.push(val + nibble);
        val = null;
      }
    }
    if (val != null) {
      octets.push(val);
    }
    return octets;
  };
  pills = options.noPills ? [] : this.pills;
  bases = options.noBases ? [] : this.bases;
  starts = options.noStarts ? [] : this.starts;
  data = (function() {
    _result = []; _ref2 = 'BMAPBOLO';
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      c = _ref2[_i];
      _result.push(c.charCodeAt(0));
    }
    return _result;
  })();
  data.push(1, pills.length, bases.length, starts.length);
  _ref2 = pills;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    p = _ref2[_i];
    data.push(p.x, p.y, p.owner_idx, p.armour, p.speed);
  }
  _ref2 = bases;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    b = _ref2[_i];
    data.push(b.x, b.y, b.owner_idx, b.armour, b.shells, b.mines);
  }
  _ref2 = starts;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    s = _ref2[_i];
    data.push(s.x, s.y, s.direction);
  }
  run = (seq = (sx = (ex = (y = null))));
  flushRun = function() {
    var octets;
    if (!(run != null)) {
      return null;
    }
    flushSequence();
    octets = encodeNibbles(run);
    data.push(octets.length + 4, y, sx, ex);
    data = data.concat(octets);
    return (run = null);
  };
  ensureRunSpace = function(numNibbles) {
    if (!((255 - 4) * 2 - run.length < numNibbles)) {
      return null;
    }
    flushRun();
    run = [];
    return (sx = ex);
  };
  flushSequence = function() {
    var localSeq;
    if (!(seq != null)) {
      return null;
    }
    localSeq = seq;
    seq = null;
    ensureRunSpace(localSeq.length + 1);
    run.push(localSeq.length - 1);
    run = run.concat(localSeq);
    return ex += localSeq.length;
  };
  _ref2 = this.cells;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    (function() {
      var row = _ref2[_i];
      y = row[0].y;
      run = (sx = (ex = (seq = null)));
      return consecutiveCells(row, function(type, count, x) {
        var _result2, seqLen;
        if (type === -1) {
          flushRun();
          return null;
        }
        if (!(run != null)) {
          run = [];
          sx = (ex = x);
        }
        if (count > 2) {
          flushSequence();
          while (count > 2) {
            ensureRunSpace(2);
            seqLen = min(count, 9);
            run.push(seqLen + 6, type);
            ex += seqLen;
            count -= seqLen;
          }
        }
        _result2 = [];
        while (count > 0) {
          _result2.push((function() {
            if (!(seq != null)) {
              seq = [];
            }
            seq.push(type);
            if (seq.length === 8) {
              flushSequence();
            }
            return count--;
          })());
        }
        return _result2;
      });
    })();
  }
  flushRun();
  data.push(4, 0xFF, 0xFF, 0xFF);
  return data;
};
Map.load = function(buffer) {
  var _ctor, _i, _len, _ref2, _ref3, _result, _result2, args, basesData, c, dataLen, ex, filePos, i, magic, map, numBases, numPills, numStarts, pillsData, readBytes, run, runPos, seqLen, startsData, sx, takeNibble, type, version, x, y;
  filePos = 0;
  readBytes = function(num, msg) {
    var _i, _len, _ref2, _result, sub, x;
    sub = (function() {
      try {
        _result = []; _ref2 = buffer.slice(filePos, filePos + num);
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          x = _ref2[_i];
          _result.push(x);
        }
        return _result;
      } catch (e) {
        throw msg;
      }
    })();
    filePos += num;
    return sub;
  };
  magic = readBytes(8, "Not a Bolo map.");
  _ref2 = 'BMAPBOLO';
  for (i = 0, _len = _ref2.length; i < _len; i++) {
    c = _ref2[i];
    if (c.charCodeAt(0) !== magic[i]) {
      throw "Not a Bolo map.";
    }
  }
  _ref2 = readBytes(4, "Incomplete header"), version = _ref2[0], numPills = _ref2[1], numBases = _ref2[2], numStarts = _ref2[3];
  if (version !== 1) {
    throw ("Unsupported map version: " + (version));
  }
  map = new this();
  pillsData = (function() {
    _result = [];
    for (i = 0; (0 <= numPills ? i < numPills : i > numPills); (0 <= numPills ? i += 1 : i -= 1)) {
      _result.push(readBytes(5, "Incomplete pillbox data"));
    }
    return _result;
  })();
  basesData = (function() {
    _result = [];
    for (i = 0; (0 <= numBases ? i < numBases : i > numBases); (0 <= numBases ? i += 1 : i -= 1)) {
      _result.push(readBytes(6, "Incomplete base data"));
    }
    return _result;
  })();
  startsData = (function() {
    _result = [];
    for (i = 0; (0 <= numStarts ? i < numStarts : i > numStarts); (0 <= numStarts ? i += 1 : i -= 1)) {
      _result.push(readBytes(3, "Incomplete player start data"));
    }
    return _result;
  })();
  while (true) {
    _ref2 = readBytes(4, "Incomplete map data"), dataLen = _ref2[0], y = _ref2[1], sx = _ref2[2], ex = _ref2[3];
    dataLen -= 4;
    if (dataLen === 0 && y === 0xFF && sx === 0xFF && ex === 0xFF) {
      break;
    }
    run = readBytes(dataLen, "Incomplete map data");
    runPos = 0;
    takeNibble = function() {
      var index, nibble;
      index = floor(runPos);
      nibble = index === runPos ? (run[index] & 0xF0) >> 4 : (run[index] & 0x0F);
      runPos += 0.5;
      return nibble;
    };
    x = sx;
    while (x < ex) {
      seqLen = takeNibble();
      if (seqLen < 8) {
        _ref2 = seqLen + 1;
        for (i = 1; (1 <= _ref2 ? i <= _ref2 : i >= _ref2); (1 <= _ref2 ? i += 1 : i -= 1)) {
          map.cellAtTile(x++, y).setType(takeNibble(), undefined, -1);
        }
      } else {
        type = takeNibble();
        _ref2 = seqLen - 6;
        for (i = 1; (1 <= _ref2 ? i <= _ref2 : i >= _ref2); (1 <= _ref2 ? i += 1 : i -= 1)) {
          map.cellAtTile(x++, y).setType(type, undefined, -1);
        }
      }
    }
  }
  map.pills = (function() {
    _result = []; _ref2 = pillsData;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      args = _ref2[_i];
      _result.push((function() {
        var ctor = function(){};
        __extends(ctor, _ctor = map.PillboxClass);
        return typeof (_result2 = _ctor.apply(_ref3 = new ctor, [map].concat(args))) === "object" ? _result2 : _ref3;
      }).call(this));
    }
    return _result;
  })();
  map.bases = (function() {
    _result = []; _ref2 = basesData;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      args = _ref2[_i];
      _result.push((function() {
        var ctor = function(){};
        __extends(ctor, _ctor = map.BaseClass);
        return typeof (_result2 = _ctor.apply(_ref3 = new ctor, [map].concat(args))) === "object" ? _result2 : _ref3;
      }).call(this));
    }
    return _result;
  })();
  map.starts = (function() {
    _result = []; _ref2 = startsData;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      args = _ref2[_i];
      _result.push((function() {
        var ctor = function(){};
        __extends(ctor, _ctor = map.StartClass);
        return typeof (_result2 = _ctor.apply(_ref3 = new ctor, [map].concat(args))) === "object" ? _result2 : _ref3;
      }).call(this));
    }
    return _result;
  })();
  return map;
};
Map.extended = function(child) {
  return !(child.load) ? (child.load = this.load) : null;
};
exports.TERRAIN_TYPES = TERRAIN_TYPES;
exports.MapView = MapView;
exports.Map = Map;
});
require.module('bolo/client/net', false, function(module, exports, require) {
var ClientContext;
var __hasProp = Object.prototype.hasOwnProperty;
ClientContext = function(_arg) {
  this.sim = _arg;
  this.transientMapCells = {};
  this.transientChanges = [];
  return this;
};
ClientContext.prototype.authority = false;
ClientContext.prototype.authoritative = false;
ClientContext.prototype.activated = function() {
  var _i, _len, _ref, _ref2, cell, i, idx, obj, type;
  if (!(this.authoritative)) {
    return null;
  }
  _ref = this.transientMapCells;
  for (idx in _ref) {
    if (!__hasProp.call(_ref, idx)) continue;
    cell = _ref[idx];
    cell.setType(cell._net_oldType, cell._net_hadMine);
    cell.life = cell._net_oldLife;
  }
  this.transientMapCells = {};
  if (!(this.transientChanges.length > 0)) {
    return null;
  }
  _ref = this.transientChanges;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
_ref2 = _ref[_i], type = _ref2[0], idx = _ref2[1], obj = _ref2[2]
    switch (type) {
      case 'C':
        if (obj.transient && !obj._net_revived) {
          obj.emit('finalize');
        }
        this.sim.objects.splice(idx, 1);
        break;
      case 'D':
        obj._net_revived = true;
        this.sim.objects.splice(idx, 0, obj);
        break;
    }
  }
  this.transientChanges = [];
  _ref = this.sim.objects;
  for (i = 0, _len = _ref.length; i < _len; i++) {
    obj = _ref[i];
    obj.idx = i;
  }
  return null;
};
ClientContext.prototype.created = function(obj) {
  if (!(this.authoritative)) {
    this.transientChanges.unshift(['C', obj.idx, obj]);
    return (obj.transient = true);
  }
};
ClientContext.prototype.destroyed = function(obj) {
  if (!(this.authoritative)) {
    this.transientChanges.unshift(['D', obj.idx, obj]);
  }
  return null;
};
ClientContext.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {
  var _ref;
  if (!(this.authoritative || (typeof (_ref = this.transientMapCells[cell.idx]) !== "undefined" && _ref !== null))) {
    cell._net_oldType = oldType;
    cell._net_hadMine = hadMine;
    cell._net_oldLife = oldLife;
    this.transientMapCells[cell.idx] = cell;
  }
  return null;
};
module.exports = ClientContext;
});
require.module('bolo/client/loader', false, function(module, exports, require) {
var Loader;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty;
Loader = function() {
  this.resources = {
    images: {}
  };
  this.finished = false;
  return this;
};
Loader.prototype.image = function(name) {
  var img;
  this.resources.images[name] = (img = new Image());
  $(img).load((__bind(function() {
    return this._checkComplete();
  }, this)));
  $(img).error((__bind(function() {
    return this._handleError(img);
  }, this)));
  img.src = ("img/" + (name) + ".png");
  return img;
};
Loader.prototype.finish = function() {
  this.finished = true;
  return this._checkComplete();
};
Loader.prototype._checkComplete = function() {
  var _ref, _ref2, category, container, name, resource;
  if (!(this.finished)) {
    return null;
  }
  _ref = this.resources;
  for (category in _ref) {
    if (!__hasProp.call(_ref, category)) continue;
    container = _ref[category];
    _ref2 = container;
    for (name in _ref2) {
      if (!__hasProp.call(_ref2, name)) continue;
      resource = _ref2[name];
      if (!(resource.complete)) {
        return null;
      }
    }
  }
  this._stopEvents();
  return this.onComplete();
};
Loader.prototype._handleError = function(resource) {
  this._stopEvents();
  return this.onError(resource);
};
Loader.prototype._stopEvents = function() {
  this.image = function() {};
  this.finish = function() {};
  this._checkComplete = function() {};
  return (this._handleError = function() {});
};
Loader.prototype.onComplete = function() {};
Loader.prototype.onError = function() {};
module.exports = Loader;
});
require.module('bolo/client/util/base64', false, function(module, exports, require) {
var decodeBase64;
decodeBase64 = function(input) {
  var _len, _ref, c, cc, i, output, outputIndex, outputLength, quad, quadIndex, tail;
  if (!(input.length % 4 === 0)) {
    throw new Error("Invalid base64 input length, not properly padded?");
  }
  outputLength = input.length / 4 * 3;
  tail = input.substr(-2);
  if (tail[0] === '=') {
    outputLength--;
  }
  if (tail[1] === '=') {
    outputLength--;
  }
  output = new Array(outputLength);
  quad = new Array(4);
  outputIndex = 0;
  _ref = input;
  for (i = 0, _len = _ref.length; i < _len; i++) {
    c = _ref[i];
    cc = c.charCodeAt(0);
    quadIndex = i % 4;
    quad[quadIndex] = (function() {
      if ((65 <= cc) && (cc <= 90)) {
        return cc - 65;
      } else if ((97 <= cc) && (cc <= 122)) {
        return cc - 71;
      } else if ((48 <= cc) && (cc <= 57)) {
        return cc + 4;
      } else if (cc === 43) {
        return 62;
      } else if (cc === 47) {
        return 63;
      } else if (cc === 61) {
        return -1;
      } else {
        throw new Error("Invalid base64 input character: " + (c));
      }
    })();
    if (quadIndex !== 3) {
      continue;
    }
    output[outputIndex++] = ((quad[0] & 0x3F) << 2) + ((quad[1] & 0x30) >> 4);
    if (!(quad[2] === -1)) {
      output[outputIndex++] = ((quad[1] & 0x0F) << 4) + ((quad[2] & 0x3C) >> 2);
    }
    if (!(quad[3] === -1)) {
      output[outputIndex++] = ((quad[2] & 0x03) << 6) + (quad[3] & 0x3F);
    }
  }
  return output;
};
exports.decodeBase64 = decodeBase64;
});
require.module('bolo/client/renderer/offscreen_2d', false, function(module, exports, require) {
var CachedSegment, Common2dRenderer, MAP_SIZE_SEGMENTS, MAP_SIZE_TILES, Offscreen2dRenderer, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_TILES, TILE_SIZE_PIXELS, _ref, floor;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
floor = Math.floor;
_ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, MAP_SIZE_TILES = _ref.MAP_SIZE_TILES;
Common2dRenderer = require('./common_2d');
SEGMENT_SIZE_TILES = 16;
MAP_SIZE_SEGMENTS = MAP_SIZE_TILES / SEGMENT_SIZE_TILES;
SEGMENT_SIZE_PIXEL = SEGMENT_SIZE_TILES * TILE_SIZE_PIXELS;
CachedSegment = function(_arg, x, y) {
  this.renderer = _arg;
  this.sx = x * SEGMENT_SIZE_TILES;
  this.sy = y * SEGMENT_SIZE_TILES;
  this.ex = this.sx + SEGMENT_SIZE_TILES - 1;
  this.ey = this.sy + SEGMENT_SIZE_TILES - 1;
  this.psx = x * SEGMENT_SIZE_PIXEL;
  this.psy = y * SEGMENT_SIZE_PIXEL;
  this.pex = this.psx + SEGMENT_SIZE_PIXEL - 1;
  this.pey = this.psy + SEGMENT_SIZE_PIXEL - 1;
  this.canvas = null;
  return this;
};
CachedSegment.prototype.isInView = function(sx, sy, ex, ey) {
  return ex < this.psx || ey < this.psy ? false : (sx > this.pex || sy > this.pey ? false : true);
};
CachedSegment.prototype.build = function() {
  this.canvas = $('<canvas/>')[0];
  this.canvas.width = (this.canvas.height = SEGMENT_SIZE_PIXEL);
  this.ctx = this.canvas.getContext('2d');
  this.ctx.translate(-this.psx, -this.psy);
  return this.renderer.sim.map.each((__bind(function(cell) {
    return this.onRetile(cell, cell.tile[0], cell.tile[1]);
  }, this)), this.sx, this.sy, this.ex, this.ey);
};
CachedSegment.prototype.clear = function() {
  return (this.canvas = (this.ctx = null));
};
CachedSegment.prototype.onRetile = function(cell, tx, ty) {
  var obj;
  if (!(this.canvas)) {
    return null;
  }
  return (obj = cell.pill || cell.base) ? this.renderer.drawStyledTile(cell.tile[0], cell.tile[1], obj.owner == null ? undefined : obj.owner.$.team, cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, this.ctx) : this.renderer.drawTile(cell.tile[0], cell.tile[1], cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, this.ctx);
};
Offscreen2dRenderer = function(images, sim) {
  var row, x, y;
  Offscreen2dRenderer.__super__.constructor.apply(this, arguments);
  this.cache = new Array(MAP_SIZE_SEGMENTS);
  for (y = 0; (0 <= MAP_SIZE_SEGMENTS ? y < MAP_SIZE_SEGMENTS : y > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? y += 1 : y -= 1)) {
    row = (this.cache[y] = new Array(MAP_SIZE_SEGMENTS));
    for (x = 0; (0 <= MAP_SIZE_SEGMENTS ? x < MAP_SIZE_SEGMENTS : x > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? x += 1 : x -= 1)) {
      row[x] = new CachedSegment(this, x, y);
    }
  }
  return this;
};
__extends(Offscreen2dRenderer, Common2dRenderer);
Offscreen2dRenderer.prototype.onRetile = function(cell, tx, ty) {
  var segx, segy;
  cell.tile = [tx, ty];
  segx = floor(cell.x / SEGMENT_SIZE_TILES);
  segy = floor(cell.y / SEGMENT_SIZE_TILES);
  return this.cache[segy][segx].onRetile(cell, tx, ty);
};
Offscreen2dRenderer.prototype.drawMap = function(sx, sy, w, h) {
  var _i, _j, _len, _len2, _ref2, _ref3, alreadyBuiltOne, ex, ey, row, segment;
  ex = sx + w - 1;
  ey = sy + h - 1;
  alreadyBuiltOne = false;
  _ref2 = this.cache;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    row = _ref2[_i];
    _ref3 = row;
    for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
      segment = _ref3[_j];
      if (!segment.isInView(sx, sy, ex, ey)) {
        if (segment.canvas) {
          segment.clear();
        }
        continue;
      }
      if (!(segment.canvas)) {
        if (alreadyBuiltOne) {
          continue;
        }
        segment.build();
        alreadyBuiltOne = true;
      }
      this.ctx.drawImage(segment.canvas, 0, 0, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL, segment.psx, segment.psy, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL);
    }
  }
  return null;
};
module.exports = Offscreen2dRenderer;
});
require.module('bolo/client/renderer/common_2d', false, function(module, exports, require) {
var BaseRenderer, Common2dRenderer, PIXEL_SIZE_WORLD, TEAM_COLORS, TILE_SIZE_PIXELS, _ref, min, round;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
_ref = Math, min = _ref.min, round = _ref.round;
BaseRenderer = require('./base');
_ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD;
TEAM_COLORS = require('../../team_colors');
Common2dRenderer = function(images, sim) {
  var ctx, imageData, img, temp;
  Common2dRenderer.__super__.constructor.apply(this, arguments);
  this.canvas = $('<canvas/>');
  try {
    this.ctx = this.canvas[0].getContext('2d');
    this.ctx.drawImage;
  } catch (e) {
    throw ("Could not initialize 2D canvas: " + (e.message));
  }
  this.canvas.appendTo('body');
  img = this.images.overlay;
  temp = $('<canvas/>')[0];
  temp.width = img.width;
  temp.height = img.height;
  ctx = temp.getContext('2d');
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(img, 0, 0);
  imageData = ctx.getImageData(0, 0, img.width, img.height);
  this.overlay = imageData.data;
  this.prestyled = {};
  this.handleResize();
  $(window).resize((__bind(function() {
    return this.handleResize();
  }, this)));
  return this;
};
__extends(Common2dRenderer, BaseRenderer);
Common2dRenderer.prototype.handleResize = function() {
  this.canvas[0].width = window.innerWidth;
  this.canvas[0].height = window.innerHeight;
  this.canvas.css({
    width: window.innerWidth + 'px',
    height: window.innerHeight + 'px'
  });
  return $('body').css({
    width: window.innerWidth + 'px',
    height: window.innerHeight + 'px'
  });
};
Common2dRenderer.prototype.drawTile = function(tx, ty, dx, dy, ctx) {
  return (ctx || this.ctx).drawImage(this.images.base, tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, dx, dy, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS);
};
Common2dRenderer.prototype.createPrestyled = function(color) {
  var _ref2, base, ctx, data, factor, height, i, imageData, source, width, x, y;
  base = this.images.styled;
  _ref2 = base, width = _ref2.width, height = _ref2.height;
  source = $('<canvas/>')[0];
  source.width = width;
  source.height = height;
  ctx = source.getContext('2d');
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(base, 0, 0);
  imageData = ctx.getImageData(0, 0, width, height);
  data = imageData.data;
  for (x = 0; (0 <= width ? x < width : x > width); (0 <= width ? x += 1 : x -= 1)) {
    for (y = 0; (0 <= height ? y < height : y > height); (0 <= height ? y += 1 : y -= 1)) {
      i = 4 * (y * width + x);
      factor = this.overlay[i] / 255;
      data[i + 0] = round(factor * color.r + (1 - factor) * data[i + 0]);
      data[i + 1] = round(factor * color.g + (1 - factor) * data[i + 1]);
      data[i + 2] = round(factor * color.b + (1 - factor) * data[i + 2]);
      data[i + 3] = min(255, data[i + 3] + this.overlay[i]);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return source;
};
Common2dRenderer.prototype.drawStyledTile = function(tx, ty, style, dx, dy, ctx) {
  var color, source;
  if (!(source = this.prestyled[style])) {
    source = (color = TEAM_COLORS[style]) ? (this.prestyled[style] = this.createPrestyled(color)) : this.images.styled;
  }
  return (ctx || this.ctx).drawImage(source, tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, dx, dy, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS);
};
Common2dRenderer.prototype.centerOn = function(x, y, cb) {
  var _ref2, height, left, top, width;
  this.ctx.save();
  _ref2 = this.canvas[0], width = _ref2.width, height = _ref2.height;
  left = round(x / PIXEL_SIZE_WORLD - width / 2);
  top = round(y / PIXEL_SIZE_WORLD - height / 2);
  this.ctx.translate(-left, -top);
  cb(left, top, width, height);
  return this.ctx.restore();
};
module.exports = Common2dRenderer;
});
require.module('bolo/client/renderer/base', false, function(module, exports, require) {
var BaseRenderer, PI, PIXEL_SIZE_WORLD, TILE_SIZE_PIXELS, _ref, cos, round, sin;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
_ref = Math, round = _ref.round, cos = _ref.cos, sin = _ref.sin, PI = _ref.PI;
_ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD;
BaseRenderer = function(_arg, _arg2) {
  this.sim = _arg2;
  this.images = _arg;
  this.lastCenter = [0, 0];
  return this;
};
BaseRenderer.prototype.centerOn = function(x, y, cb) {};
BaseRenderer.prototype.drawTile = function(tx, ty, sdx, sdy) {};
BaseRenderer.prototype.drawStyledTile = function(tx, ty, style, sdx, sdy) {};
BaseRenderer.prototype.drawMap = function(sx, sy, w, h) {};
BaseRenderer.prototype.onRetile = function(cell, tx, ty) {};
BaseRenderer.prototype.draw = function() {
  var _ref2, x, y;
  _ref2 = this.sim.player, x = _ref2.x, y = _ref2.y;
  if (typeof (_ref2 = this.sim.player.fireball) !== "undefined" && _ref2 !== null) {
    _ref2 = this.sim.player.fireball.$, x = _ref2.x, y = _ref2.y;
  }
  if (!((x != null) && (y != null))) {
    _ref2 = this.lastCenter, x = _ref2[0], y = _ref2[1];
  } else {
    this.lastCenter = [x, y];
  }
  this.centerOn(x, y, (__bind(function(left, top, width, height) {
    var _i, _len, _ref3, _ref4, obj, ox, oy, tx, ty;
    this.drawMap(left, top, width, height);
    _ref3 = this.sim.objects;
    for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
      obj = _ref3[_i];
      if ((typeof (_ref4 = obj.styled) !== "undefined" && _ref4 !== null) && (typeof (_ref4 = obj.x) !== "undefined" && _ref4 !== null) && (typeof (_ref4 = obj.y) !== "undefined" && _ref4 !== null)) {
        _ref4 = obj.getTile(), tx = _ref4[0], ty = _ref4[1];
        ox = round(obj.x / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2;
        oy = round(obj.y / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2;
        switch (obj.styled) {
          case true:
            this.drawStyledTile(tx, ty, obj.team, ox, oy);
            break;
          case false:
            this.drawTile(tx, ty, ox, oy);
            break;
        }
      }
    }
    return this.drawOverlay();
  }, this)));
  return this.updateHud();
};
BaseRenderer.prototype.drawOverlay = function() {
  var distance, rad, x, y;
  distance = 7 * TILE_SIZE_PIXELS;
  rad = (256 - this.sim.player.direction) * 2 * PI / 256;
  x = round(this.sim.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance) - TILE_SIZE_PIXELS / 2;
  y = round(this.sim.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance) - TILE_SIZE_PIXELS / 2;
  return this.drawTile(17, 4, x, y);
};
BaseRenderer.prototype.initHud = function() {
  var _i, _len, _ref2, base, container, pill;
  this.hud = $('<div/>').appendTo('body');
  container = $('<div/>', {
    id: 'pillStatus'
  }).appendTo(this.hud);
  $('<div/>', {
    "class": 'deco'
  }).appendTo(container);
  _ref2 = this.sim.map.pills;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    pill = _ref2[_i];
    $('<div/>', {
      "class": 'pill'
    }).appendTo(container).data('pill', pill);
  }
  container = $('<div/>', {
    id: 'baseStatus'
  }).appendTo(this.hud);
  $('<div/>', {
    "class": 'deco'
  }).appendTo(container);
  _ref2 = this.sim.map.bases;
  for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
    base = _ref2[_i];
    $('<div/>', {
      "class": 'base'
    }).appendTo(container).data('base', base);
  }
  if (location.hostname.split('.')[1] === 'github') {
    $('<div/>').html('This is a work-in-progress; less than alpha quality!<br>\nTo see multiplayer in action, follow instructions on Github.').css({
      'position': 'absolute',
      'top': '8px',
      'left': '0px',
      'width': '100%',
      'text-align': 'center',
      'font-family': 'monospace',
      'font-size': '16px',
      'font-weight': 'bold',
      'color': 'white'
    }).appendTo(this.hud);
  }
  if (location.hostname.split('.')[1] === 'github' || location.hostname.substr(-6) === '.no.de') {
    $('<a href="http://github.com/stephank/orona"></a>').css({
      'position': 'absolute',
      'top': '0px',
      'right': '0px'
    }).html('<img src="http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub">').appendTo(this.hud);
  }
  return this.updateHud();
};
BaseRenderer.prototype.updateHud = function() {
  this.hud.find('#pillStatus .pill').each((__bind(function(i, node) {
    return $(node).attr('status', 'neutral');
  }, this)));
  return this.hud.find('#baseStatus .base').each((__bind(function(i, node) {
    return $(node).attr('status', 'neutral');
  }, this)));
};
module.exports = BaseRenderer;
});
require.module('bolo/team_colors', false, function(module, exports, require) {
var TEAM_COLORS;
TEAM_COLORS = [
  {
    r: 255,
    g: 0,
    b: 0,
    name: 'red'
  }, {
    r: 0,
    g: 0,
    b: 255,
    name: 'blue'
  }, {
    r: 0,
    g: 255,
    b: 0,
    name: 'green'
  }, {
    r: 0,
    g: 255,
    b: 255,
    name: 'cyan'
  }, {
    r: 255,
    g: 255,
    b: 0,
    name: 'yellow'
  }, {
    r: 255,
    g: 0,
    b: 255,
    name: 'magenta'
  }
];
module.exports = TEAM_COLORS;
});
require.module('bolo/client/everard', false, function(module, exports, require) {
module.exports = 'Qk1BUEJPTE8BEAsQW5H/D2Vjbv8PZV90/w9lVHX/D2VwbP8PZYFr/w9lq27/D2WueP8PZa58/w9l\nmpL/D2Veh/8PZWmJ/w9lcYn/D2Vsf/8PZWx4/w9lrYn/D2WBaP9aWlqvaf9aWlpWbv9aWlquev9a\nWlp5e/9aWlpsfP9aWlqLff9aWlpti/9aWlpVjf9aWlqlkv9aWlp+mP9aWlpMjABMfABcZA1sZAx8\nZAyMZAycZAysZAu4fAi4jAisnAWcnASMnAR8nARsnARcnAMQZk608fHx8fHx8fHx8fGRGGdNtaH0\ntNUB8PCQkgGSAeIB4vHh8pKRHWhNtZGU9YUE1QHnlOcAxIIB4gHiAfKygdKQkoEfaU21gZT1lQTV\nAde05wSSgYIB4pHCAfKC8ZEAhJKBIGpNtYGEhfSFBNUBx9TXBIeC8bKBooHiofICgQSBgoEja021\ngQSFhNUEhQTVAbf0xwSXEhwrGSAaIBwqGCAfKSFCsSBsTbWBBIUE5QSFBNWRl/TUl/KSsaIBkqGy\ngfKCBKKBIG1NtYEEhQSFpIUEhQT1AZf0xwT3t7LxAfIB8oIEooEjbk21gQSFBIWEFUhQSFBKUHpQ\nGn1NcE9/fCAfKioeIEooECBvTbWBBIUEtQSFBIUE9QG3tOcE9/eygZL3p5HCBKKBIXBNtYEEhQS1\nBIUEhQT1gbeU9wT394eSAaL3x5GiBKKBIHFNtYEEhdSFBIUE9RUffXIED355CHAff3lwGiBKKBAe\nck21gQT1hQSFBPUVH31wD09JQQeB9/eXsQSBgoEdc021gQT1hQSFBPUVH31yBA9+dAQHH399eAFA\nsRl0TbWB9KSFFH9QH35wT39wD09PS0AJKBAddU21gbUH9QTl8QGH4QTx8RFJH394eFlxBICSgSJ2\nTbWB9cUE1fGx0ATw8EBAEIcFlwCHhYcQeFl4WnFHooEgd021gfWFtLXx0QD0pAD0pDAQeVx4WXhR\ncKcAhwS3gSJ4TbXhtQTl8QLREE8IAkBNAEkDQBCHBYcldZeF96cEt4EleU21gbcBtQTl8eEgQPRA\nQEC0AJRAQBCHBYclBaeFl5XHBLWBJnpNtYG3AaUQSQtfHhkATwJASQBLBUBAELeVhwCHhceVhwSH\nlYEje021gbcBpQD09PSUAJQgQJQgQNRwQEAQX3p4W3JXWXtYECd8TbWBtwGlkBQLXxAtEQSwRAQE\nkASwdAQEBAEQhYeF9wW3JXXngSd9TbWBtwHVBMXx4SBAtCBAtAC0cEBAQBAJUHhZeVt5VHV1e1h4\nECp+TbWBtwHVBIXx8ZEwQEsATQBNB0BAEFcVeFlwWnBYcFl3V1dXVwWHgSd/TbWBtwGFsQSRp+EC\n0UBAQPSEAPRAQBCHpZeVB5UXWXNXV7WHgSeATbWBt6GgBKeV8dFwQEBATQBPBUBAEPcFpwWHBZd1\ndXV1cFh4ECSBTbWB96AEp5UH8aFAEECUANQgQNRAQECh15W3lUdXV7WHgSOCTbWB94CHBNUH8ZFC\nAQTwBJAkBLB0BAQBAHsffHJXXngQI4NNtYHwgIcElcfxAYIgEPSEAJQAtACUQEAQt+HnFXxZeBAf\nhE21gfCAhwTVhwGSsZIQHQBLAE0ATQEQ95fB97eBHIVNtYEAxwC3BKeVhwHyggCRAPQA9PSE98fx\n4R6GTbWBEHoAewF01YcB8oKQAfDw8AGHBPe3gPe3gR6HTbWBIHCnALc0V1t4HyogDx8fGBhwT3x4\nD3p4EByITbWBMHB6C3BNUHgfKyAfeg9+cE98eA95eRAeiU21gZD3IECXlRcfLCAYcAt8D3xxBPCA\nl7D3B5Efik21gQeAB4DHAPT09LSHAKcAhwD09MQwcHsPcHkQK4tNtYEHgAeAxyBAh4CXAaKQFAwk\nFwcKcApwCHAPeHBKCRBIEwQH0PcHkSaMTbWBB4AHgOQAh4CXAaKwwgGXEHwAew94eUEQkQSBAPQA\n94eBKo1NtYEHgAeAFH0IeAh4GSkPJhcHBw9/engCQQkQSBgBQMcQegh4WHgQK45NtYEHgAeAh/CA\nB4GSoPKBpwCHhccA15AHgCQQkQShFAxwCnAIeFh4ECmPTbWBhyBwh4CngIcAhwGioPISGnANegh6\nUXCXgCQQ4QSwB9CHhYeBKZBNtYGHMHB5AHgAeAhwCHAZKw8hIafwtwWHhZCHEE0aSAhwDHANeBAo\nkU21gYeQRwcHgASAhxB4GSsPISGnsPeFhwWAlwCk0QSAB/AXC3gQKpJNtYGnUHBweAB4CHIHGnsP\ncH8YH3hYcVCXAIShAqEUCXEEhwCnALeBKJNNtYEHoEcHB4AHgAeAFxp7D3hwHnwbeFhwCXgJShxJ\nCXkAeAt4ECaUTbWBB6BHBweAB4AnB4GnsJehpwH3p7G3gAeQBPGAFAp8C3kQIpVNtYGXAIcwcHgK\ncgcbewh8GXAffnoceAlNEgdKD3l5ECCWTbWRhwCnEHgAegFxt7CHwZcB9/cH8fGBEH9ATHoQHZdN\ntZGH8Aeggbewl6GnAfeHkfengPERDygrexAbmE21sfCXgAHHsKeBtwH34feHAPERDygpfRAQmU60\n8fHx8fHx8fHx8fGRBP///w=='.split('\n').join('');
});
