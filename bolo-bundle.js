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
      var _a, _b, _c, cwd, part;
      if (p.charAt(0) !== '.') {
        return require(p);
      }
      cwd = path.split('/');
      if (!(directory)) {
        cwd.pop();
      }
      _b = p.split('/');
      for (_a = 0, _c = _b.length; _a < _c; _a++) {
        part = _b[_a];
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
})();
require.module('bolo/client', true, function(module, exports, require) {
var ClientContext, EverardIsland, Offscreen2dRenderer, PI, PIXEL_SIZE_WORLD, Simulation, TICK_LENGTH_MS, TILE_SIZE_PIXEL, _a, _b, _c, _d, cos, decodeBase64, draw, drawOverlay, drawTank, game, gameTimer, handleKeydown, handleKeyup, handleMessage, handleServerCommand, heartbeatTimer, hud, init, initHud, lastTick, map, net, netctx, renderer, round, sin, start, stop, tilemap, timerCallback, unpack, updateHud, ws;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
_a = Math;
round = _a.round;
cos = _a.cos;
sin = _a.sin;
PI = _a.PI;
Simulation = require('..');
net = require('../net');
map = require('../map');
_b = require('../struct');
unpack = _b.unpack;
_c = require('../constants');
TILE_SIZE_PIXEL = _c.TILE_SIZE_PIXEL;
PIXEL_SIZE_WORLD = _c.PIXEL_SIZE_WORLD;
TICK_LENGTH_MS = _c.TICK_LENGTH_MS;
ClientContext = require('./net');
_d = require('./util');
decodeBase64 = _d.decodeBase64;
Offscreen2dRenderer = require('./renderer/offscreen_2d');
EverardIsland = require('./everard');
tilemap = null;
hud = null;
game = null;
netctx = null;
renderer = null;
ws = null;
init = function() {
  var gameMap;
  if (!(typeof tilemap !== "undefined" && tilemap !== null)) {
    tilemap = new Image();
    $(tilemap).load(init);
    tilemap.src = 'img/tiles2x.png';
    return null;
  }
  hud = $('<div/>').appendTo('body');
  $(document).keydown(handleKeydown).keyup(handleKeyup);
  if (location.hostname.split('.')[1] === 'github') {
    gameMap = map.load(decodeBase64(EverardIsland));
    game = new Simulation(gameMap);
    renderer = new Offscreen2dRenderer(tilemap, game.map);
    game.map.setView(renderer);
    game.player = game.addTank();
    initHud();
    return start();
  } else {
    ws = new WebSocket("ws://" + (location.host) + "/demo");
    return (ws.onmessage = function(event) {
      gameMap = map.load(decodeBase64(event.data));
      game = new Simulation(gameMap);
      renderer = new Offscreen2dRenderer(tilemap, game.map);
      game.map.setView(renderer);
      netctx = new ClientContext(game);
      initHud();
      return (ws.onmessage = handleMessage);
    });
  }
};
handleKeydown = function(e) {
  var _e, _f;
  if (typeof ws !== "undefined" && ws !== null) {
    if ((_e = e.which) === 32) {
      ws.send(net.START_SHOOTING);
    } else if (_e === 37) {
      ws.send(net.START_TURNING_CCW);
    } else if (_e === 38) {
      ws.send(net.START_ACCELERATING);
    } else if (_e === 39) {
      ws.send(net.START_TURNING_CW);
    } else if (_e === 40) {
      ws.send(net.START_BRAKING);
    } else {
      return null;
    }
  } else if (typeof game !== "undefined" && game !== null) {
    if ((_f = e.which) === 32) {
      game.player.shooting = true;
    } else if (_f === 37) {
      game.player.turningCounterClockwise = true;
    } else if (_f === 38) {
      game.player.accelerating = true;
    } else if (_f === 39) {
      game.player.turningClockwise = true;
    } else if (_f === 40) {
      game.player.braking = true;
    }
  } else {
    return null;
  }
  return e.preventDefault();
};
handleKeyup = function(e) {
  var _e, _f;
  if (typeof ws !== "undefined" && ws !== null) {
    if ((_e = e.which) === 32) {
      ws.send(net.STOP_SHOOTING);
    } else if (_e === 37) {
      ws.send(net.STOP_TURNING_CCW);
    } else if (_e === 38) {
      ws.send(net.STOP_ACCELERATING);
    } else if (_e === 39) {
      ws.send(net.STOP_TURNING_CW);
    } else if (_e === 40) {
      ws.send(net.STOP_BRAKING);
    } else {
      return null;
    }
  } else if (typeof game !== "undefined" && game !== null) {
    if ((_f = e.which) === 32) {
      game.player.shooting = false;
    } else if (_f === 37) {
      game.player.turningCounterClockwise = false;
    } else if (_f === 38) {
      game.player.accelerating = false;
    } else if (_f === 39) {
      game.player.turningClockwise = false;
    } else if (_f === 40) {
      game.player.braking = false;
    } else {
      return null;
    }
  } else {
    return null;
  }
  return e.preventDefault();
};
handleMessage = function(e) {
  netctx.authoritative = true;
  return net.inContext(netctx, function() {
    var _e, ate, command, data, length, pos;
    data = decodeBase64(e.data);
    pos = 0;
    length = data.length;
    _e = [];
    while (pos < length) {
      command = data[pos++];
      ate = handleServerCommand(command, data, pos);
      if (ate === -1) {
        return null;
      }
      pos += ate;
    }
    return _e;
  });
};
handleServerCommand = function(command, data, offset) {
  var _e, _f, _g, _h, ascii, bytes, code, mine, obj, obj_idx, tank_idx, type, x, y;
  if (command === net.WELCOME_MESSAGE) {
    tank_idx = unpack('I', data, offset)[0];
    game.player = game.objects[tank_idx];
    start();
    return 4;
  } else if (command === net.CREATE_MESSAGE) {
    type = net.getTypeFromCode(data[offset]);
    obj = game.spawn(type.fromNetwork);
    return 1 + obj.deserialize(data, offset + 1);
  } else if (command === net.DESTROY_MESSAGE) {
    obj_idx = unpack('I', data, offset)[0];
    obj = game.objects[obj_idx];
    game.destroy(obj);
    return 4;
  } else if (command === net.MAPCHANGE_MESSAGE) {
    _e = unpack('BBBBf', data, offset);
    x = _e[0];
    y = _e[1];
    code = _e[2];
    mine = _e[3];
    ascii = String.fromCharCode(code);
    game.map.cells[y][x].setType(ascii, mine);
    return 5;
  } else if (command === net.UPDATE_MESSAGE) {
    bytes = 0;
    _g = game.objects;
    for (_f = 0, _h = _g.length; _f < _h; _f++) {
      obj = _g[_f];
      bytes += obj.deserialize(data, offset + bytes);
    }
    return bytes;
  } else {
    stop();
    ws.close();
    ws = null;
    return -1;
  }
};
gameTimer = null;
lastTick = null;
heartbeatTimer = 0;
start = function() {
  if (typeof gameTimer !== "undefined" && gameTimer !== null) {
    return null;
  }
  if (netctx !== null) {
    netctx.authoritative = false;
    net.inContext(netctx, function() {
      return game.tick();
    });
  } else {
    game.tick();
  }
  lastTick = Date.now();
  return (gameTimer = window.setInterval(timerCallback, TICK_LENGTH_MS));
};
stop = function() {
  if (!(typeof gameTimer !== "undefined" && gameTimer !== null)) {
    return null;
  }
  window.clearInterval(gameTimer);
  gameTimer = null;
  return (lastTick = null);
};
timerCallback = function() {
  var now;
  now = Date.now();
  while (now - lastTick >= TICK_LENGTH_MS) {
    if (netctx !== null) {
      netctx.authoritative = false;
      net.inContext(netctx, function() {
        return game.tick();
      });
    } else {
      game.tick();
    }
    lastTick += TICK_LENGTH_MS;
    if (ws !== null && ++heartbeatTimer === 10) {
      heartbeatTimer = 0;
      ws.send('');
    }
  }
  return draw();
};
draw = function() {
  renderer.centerOnObject(game.player, function(left, top, width, height) {
    var _e, _f, _g, obj;
    renderer.drawMap(left, top, width, height);
    _f = game.objects;
    for (_e = 0, _g = _f.length; _e < _g; _e++) {
      obj = _f[_e];
      drawTank(obj);
    }
    return drawOverlay();
  });
  return updateHud();
};
drawTank = function(tank) {
  var tile, x, y;
  tile = tank.getTile();
  x = round(tank.x / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXEL / 2;
  y = round(tank.y / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXEL / 2;
  return renderer.drawTile(tile[0], tile[1], x, y);
};
drawOverlay = function() {
  var distance, rad, x, y;
  distance = 7 * TILE_SIZE_PIXEL;
  rad = (256 - game.player.direction) * 2 * PI / 256;
  x = round(game.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance) - TILE_SIZE_PIXEL / 2;
  y = round(game.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance) - TILE_SIZE_PIXEL / 2;
  return renderer.drawTile(17, 4, x, y);
};
initHud = function() {
  var _e, _f, _g, _h, _i, _j, base, container, pill;
  hud.html('');
  container = $('<div/>', {
    id: 'pillStatus'
  }).appendTo(hud);
  $('<div/>', {
    "class": 'deco'
  }).appendTo(container);
  _f = game.map.pills;
  for (_e = 0, _g = _f.length; _e < _g; _e++) {
    pill = _f[_e];
    $('<div/>', {
      "class": 'pill'
    }).appendTo(container).data('pill', pill);
  }
  container = $('<div/>', {
    id: 'baseStatus'
  }).appendTo(hud);
  $('<div/>', {
    "class": 'deco'
  }).appendTo(container);
  _i = game.map.bases;
  for (_h = 0, _j = _i.length; _h < _j; _h++) {
    base = _i[_h];
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
    }).appendTo(hud);
    $('<a href="http://github.com/stephank/orona"></a>').css({
      'position': 'absolute',
      'top': '0px',
      'right': '0px'
    }).html('<img src="http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub">').appendTo(hud);
  }
  return updateHud();
};
updateHud = function() {
  $('#pillStatus .pill').each(__bind(function(i, node) {
    return $(node).attr('status', 'neutral');
  }, this));
  return $('#baseStatus .base').each(__bind(function(i, node) {
    return $(node).attr('status', 'neutral');
  }, this));
};
exports.init = init;
exports.start = start;
exports.stop = stop;
});
require.module('bolo', true, function(module, exports, require) {
var Simulation, Tank, net;
var __slice = Array.prototype.slice, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
Tank = require('./tank');
net = require('./net');
Simulation = function(_a) {
  this.map = _a;
  this.objects = [];
  this.tanks = [];
  return this;
};
Simulation.prototype.tick = function() {
  var _a, _b, _c, obj;
  _b = this.objects;
  for (_a = 0, _c = _b.length; _a < _c; _a++) {
    obj = _b[_a];
    obj.update();
  }
  return null;
};
Simulation.prototype.spawn = function(type) {
  var args, obj;
  args = __slice.call(arguments, 1);
  obj = (function() {
    var ctor = function(){};
    __extends(ctor, type);
    return type.apply(new ctor, [this].concat(args));
  }).call(this);
  obj.idx = this.objects.length;
  this.objects.push(obj);
  net.created(obj);
  return obj;
};
Simulation.prototype.destroy = function(obj) {
  var _a, _b, i;
  this.objects.splice(obj.idx, 1);
  _a = obj.idx; _b = this.objects.length;
  for (i = _a; (_a <= _b ? i < _b : i > _b); (_a <= _b ? i += 1 : i -= 1)) {
    this.objects[i].idx--;
  }
  net.destroyed(obj);
  return obj;
};
Simulation.prototype.addTank = function() {
  var tank;
  tank = this.spawn(Tank, this.map.getRandomStart());
  tank.tank_idx = this.tanks.length;
  this.tanks.push(tank);
  return tank;
};
Simulation.prototype.removeTank = function(tank) {
  this.tanks.splice(tank.tank_idx, 1);
  return this.destroy(tank);
};
module.exports = Simulation;
});
require.module('bolo/tank', false, function(module, exports, require) {
var PI, TILE_SIZE_WORLD, Tank, _a, _b, _c, ceil, cos, max, min, net, pack, round, sin, unpack;
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
_a = Math;
round = _a.round;
ceil = _a.ceil;
min = _a.min;
max = _a.max;
sin = _a.sin;
cos = _a.cos;
PI = _a.PI;
_b = require('./constants');
TILE_SIZE_WORLD = _b.TILE_SIZE_WORLD;
net = require('./net');
_c = require('./struct');
pack = _c.pack;
unpack = _c.unpack;
Tank = function(_d, startingPos) {
  this.game = _d;
  this.x = (startingPos.x + 0.5) * TILE_SIZE_WORLD;
  this.y = (startingPos.y + 0.5) * TILE_SIZE_WORLD;
  this.direction = startingPos.direction * 16;
  this.cell = this.game.map.cells[startingPos.y][startingPos.x];
  this.speed = 0.00;
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
  this.onBoat = true;
  return this;
};
Tank.prototype.constructFromNetwork = function(_d) {
  this.game = _d;
  return this;
};
Tank.prototype.serialize = function() {
  var speed;
  speed = round(this.speed * 4);
  return pack('HHBBBBBBBBffffff', this.x, this.y, this.direction, speed, this.turnSpeedup, this.shells, this.mines, this.armour, this.trees, this.reload, this.accelerating, this.braking, this.turningClockwise, this.turningCounterClockwise, this.shooting, this.onBoat);
};
Tank.prototype.deserialize = function(data, offset) {
  var _d, speed;
  _d = unpack('HHBBBBBBBBffffff', data, offset);
  this.x = _d[0];
  this.y = _d[1];
  this.direction = _d[2];
  speed = _d[3];
  this.turnSpeedup = _d[4];
  this.shells = _d[5];
  this.mines = _d[6];
  this.armour = _d[7];
  this.trees = _d[8];
  this.reload = _d[9];
  this.accelerating = _d[10];
  this.braking = _d[11];
  this.turningClockwise = _d[12];
  this.turningCounterClockwise = _d[13];
  this.shooting = _d[14];
  this.onBoat = _d[15];
  this.speed = speed / 4;
  this.cell = this.game.map.cellAtWorld(this.x, this.y);
  return 13;
};
Tank.prototype.getDirection16th = function() {
  return round((this.direction - 1) / 16) % 16;
};
Tank.prototype.getTile = function() {
  var tx, ty;
  tx = this.getDirection16th();
  ty = 12;
  if (this.onBoat) {
    ty += 1;
  }
  return [tx, ty];
};
Tank.prototype.update = function() {
  this.shootOrReload();
  this.turn();
  this.accelerate();
  if (this.speed > 0) {
    return this.move();
  }
};
Tank.prototype.shootOrReload = function() {
  if (this.reload > 0) {
    this.reload--;
  }
  if (!(this.shooting && this.reload === 0 && this.shells > 0)) {
    return null;
  }
  this.reload = 13;
  return this.shells--;
};
Tank.prototype.turn = function() {
  var acceleration, maxTurn;
  maxTurn = this.cell.getTankTurn(this.onBoat);
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
  if (this.direction >= 256) {
    return this.direction %= 256;
  }
};
Tank.prototype.accelerate = function() {
  var acceleration, maxSpeed;
  maxSpeed = this.cell.getTankSpeed(this.onBoat);
  if (this.speed > maxSpeed) {
    acceleration = -0.25;
  } else if (this.accelerating === this.braking) {
    acceleration = 0.00;
  } else if (this.accelerating) {
    acceleration = 0.25;
  } else {
    acceleration = -0.25;
  }
  if (acceleration > 0.00 && this.speed < maxSpeed) {
    return (this.speed = min(maxSpeed, this.speed + acceleration));
  } else if (acceleration < 0.00 && this.speed > 0.00) {
    return (this.speed = max(0.00, this.speed + acceleration));
  }
};
Tank.prototype.move = function() {
  var aheadx, aheady, dx, dy, newx, newy, oldcell, rad, slowDown;
  rad = (256 - this.getDirection16th() * 16) * 2 * PI / 256;
  newx = this.x + (dx = round(cos(rad) * ceil(this.speed)));
  newy = this.y + (dy = round(sin(rad) * ceil(this.speed)));
  slowDown = true;
  if (dx !== 0) {
    aheadx = dx > 0 ? newx + 64 : newx - 64;
    aheadx = this.game.map.cellAtWorld(aheadx, newy);
    if (aheadx.getTankSpeed(this.onBoat) !== 0) {
      slowDown = false;
      if (!(this.onBoat && !aheadx.isType(' ', '^') && this.speed < 16)) {
        this.x = newx;
      }
    }
  }
  if (dy !== 0) {
    aheady = dy > 0 ? newy + 64 : newy - 64;
    aheady = this.game.map.cellAtWorld(newx, aheady);
    if (aheady.getTankSpeed(this.onBoat) !== 0) {
      slowDown = false;
      if (!(this.onBoat && !aheady.isType(' ', '^') && this.speed < 16)) {
        this.y = newy;
      }
    }
  }
  if (slowDown) {
    this.speed = max(0.00, this.speed - 1);
  }
  oldcell = this.cell;
  this.cell = this.game.map.cellAtWorld(this.x, this.y);
  if (this.onBoat) {
    if (!(this.cell.isType(' ', '^'))) {
      return this.leaveBoat(oldcell);
    }
  } else {
    if (this.cell.isType('b')) {
      return this.enterBoat();
    }
  }
};
Tank.prototype.leaveBoat = function(oldcell) {
  if (this.cell.isType('b')) {
    return this.cell.setType(' ', false, 0);
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
net.registerType('T', Tank);
module.exports = Tank;
});
require.module('bolo/constants', false, function(module, exports, require) {
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
exports.TILE_SIZE_WORLD = 256;
exports.TILE_SIZE_PIXEL = 32;
exports.PIXEL_SIZE_WORLD = 8;
exports.MAP_SIZE_TILES = 256;
exports.TICK_LENGTH_MS = 20;
});
require.module('bolo/net', false, function(module, exports, require) {
var Context, WorldObject, activeContext, getTypeFromCode, inContext, registerType, types;
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
WorldObject = function() {};
WorldObject.prototype.constructFromNetwork = function(game) {};
WorldObject.prototype.serialize = function() {};
WorldObject.prototype.deserialize = function(data, offset) {};
Context = function(game) {
  return this;
};
Context.prototype.activated = function() {};
Context.prototype.created = function(obj) {};
Context.prototype.destroyed = function(obj) {};
Context.prototype.mapChanged = function(cell, oldType, hadMine) {};
activeContext = null;
inContext = function(ctx, cb) {
  var retval;
  activeContext = ctx;
  ctx.activated();
  retval = cb();
  activeContext = null;
  return retval;
};
types = {};
registerType = function(character, type) {
  var code;
  code = character.charCodeAt(0);
  type.prototype._net_identifier = code;
  type.fromNetwork = type.prototype.constructFromNetwork;
  type.fromNetwork.prototype = type.prototype;
  return (types[code] = type);
};
getTypeFromCode = function(code) {
  return types[code];
};
exports.inContext = inContext;
exports.registerType = registerType;
exports.getTypeFromCode = getTypeFromCode;
exports.created = function(obj) {
  return (typeof activeContext === "undefined" || activeContext === null) ? undefined : activeContext.created(obj);
};
exports.destroyed = function(obj) {
  return (typeof activeContext === "undefined" || activeContext === null) ? undefined : activeContext.destroyed(obj);
};
exports.mapChanged = function(cell, oldType, hadMine) {
  return (typeof activeContext === "undefined" || activeContext === null) ? undefined : activeContext.mapChanged(cell, oldType, hadMine);
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
var fromUint16, fromUint32, fromUint8, pack, toUint16, toUint32, toUint8, unpack;
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
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
pack = function(fmt) {
  var _a, _b, arg, bitIndex, bits, bitsIndex, c, data, flushBitFields, i;
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
  _a = fmt;
  for (i = 0, _b = _a.length; i < _b; i++) {
    c = _a[i];
    arg = arguments[i + 1];
    if (c === 'f') {
      if (bits === null) {
        bits = 1;
        bitsIndex = 1;
      } else {
        bits |= 1 << bitsIndex;
        bitsIndex++;
        if (bitsIndex === 8) {
          flushBitFields();
        }
      }
    } else {
      flushBitFields();
      data = data.concat((function() {
        if (c === 'B') {
          return toUint8(arg);
        } else if (c === 'H') {
          return toUint16(arg);
        } else if (c === 'I') {
          return toUint32(arg);
        } else {
          throw new Error("Unknown format character " + (c));
        }
      })());
    }
  }
  flushBitFields();
  return data;
};
unpack = function(fmt, data, offset) {
  var _a, _b, _c, bit, bitIndex, bytes, c, i, value, values;
  offset || (offset = 0);
  values = [];
  bitIndex = 0;
  _a = fmt;
  for (i = 0, _b = _a.length; i < _b; i++) {
    c = _a[i];
    if (c === 'f') {
      bit = (1 << bitIndex) & data[offset];
      values.push(bit > 0);
      bitIndex++;
      if (bitIndex === 8) {
        offset++;
        bitIndex = 0;
      }
    } else {
      if (bitIndex === 8) {
        offset++;
        bitIndex = 0;
      }
      _c = (function() {
        if (c === 'B') {
          return [fromUint8(data, offset), 1];
        } else if (c === 'H') {
          return [fromUint16(data, offset), 2];
        } else if (c === 'I') {
          return [fromUint32(data, offset), 4];
        } else {
          throw new Error("Unknown format character " + (c));
        }
      })();
      value = _c[0];
      bytes = _c[1];
      values.push(value);
      offset += bytes;
    }
  }
  return values;
};
exports.pack = pack;
exports.unpack = unpack;
});
require.module('bolo/map', false, function(module, exports, require) {
var MAP_SIZE_TILES, Map, MapCell, MapView, NUM_TO_TERRAIN, TERRAIN_TYPES, TILE_SIZE_PIXEL, TILE_SIZE_WORLD, _a, _b, createTerrainMap, floor, load, min, net, random, round;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __slice = Array.prototype.slice;
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
_a = Math;
round = _a.round;
random = _a.random;
floor = _a.floor;
min = _a.min;
_b = require('./constants');
TILE_SIZE_WORLD = _b.TILE_SIZE_WORLD;
TILE_SIZE_PIXEL = _b.TILE_SIZE_PIXEL;
MAP_SIZE_TILES = _b.MAP_SIZE_TILES;
net = require('./net');
NUM_TO_TERRAIN = [
  {
    ascii: '|',
    tankSpeed: 0,
    tankTurn: 0.00,
    manSpeed: 0,
    description: 'building'
  }, {
    ascii: ' ',
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 0,
    description: 'river'
  }, {
    ascii: '~',
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4,
    description: 'swamp'
  }, {
    ascii: '%',
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4,
    description: 'crater'
  }, {
    ascii: '=',
    tankSpeed: 16,
    tankTurn: 1.00,
    manSpeed: 16,
    description: 'road'
  }, {
    ascii: '#',
    tankSpeed: 6,
    tankTurn: 0.50,
    manSpeed: 8,
    description: 'forest'
  }, {
    ascii: ':',
    tankSpeed: 3,
    tankTurn: 0.25,
    manSpeed: 4,
    description: 'rubble'
  }, {
    ascii: '.',
    tankSpeed: 12,
    tankTurn: 1.00,
    manSpeed: 16,
    description: 'grass'
  }, {
    ascii: '}',
    tankSpeed: 0,
    tankTurn: 0.00,
    manSpeed: 0,
    description: 'shot building'
  }, {
    ascii: 'b',
    tankSpeed: 16,
    tankTurn: 1.00,
    manSpeed: 16,
    description: 'river with boat'
  }, {
    ascii: '^',
    tankSpeed: 3,
    tankTurn: 0.50,
    manSpeed: 0,
    description: 'deep sea'
  }
];
TERRAIN_TYPES = {};
createTerrainMap = function() {
  var _c, _d, _e, _f, type;
  _c = []; _e = NUM_TO_TERRAIN;
  for (_d = 0, _f = _e.length; _d < _f; _d++) {
    type = _e[_d];
    _c.push(TERRAIN_TYPES[type.ascii] = type);
  }
  return _c;
};
createTerrainMap();
MapCell = function(_c, _d, _e) {
  this.y = _e;
  this.x = _d;
  this.map = _c;
  this.type = TERRAIN_TYPES['^'];
  this.mine = false;
  this.idx = this.y * MAP_SIZE_TILES + this.x;
  return this;
};
MapCell.prototype.getTankSpeed = function(onBoat) {
  if ((this.pill == null ? undefined : this.pill.armour) > 0) {
    return 0;
  }
  if (onBoat && this.isType('^', ' ')) {
    return 16;
  }
  return this.type.tankSpeed;
};
MapCell.prototype.getTankTurn = function(onBoat) {
  if ((this.pill == null ? undefined : this.pill.armour) > 0) {
    return 0.00;
  }
  if (onBoat && this.isType('^', ' ')) {
    return 1.00;
  }
  return this.type.tankTurn;
};
MapCell.prototype.getManSpeed = function(onBoat) {
  if ((this.pill == null ? undefined : this.pill.armour) > 0) {
    return 0;
  }
  if (onBoat && this.isType('^', ' ')) {
    return 16;
  }
  return this.type.manSpeed;
};
MapCell.prototype.neigh = function(dx, dy) {
  return this.map.cellAtTile(this.x + dx, this.y + dy);
};
MapCell.prototype.isType = function() {
  var _c, i, type;
  _c = arguments.length;
  for (i = 0; (0 <= _c ? i <= _c : i >= _c); (0 <= _c ? i += 1 : i -= 1)) {
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
  num = NUM_TO_TERRAIN.indexOf(this.type);
  if (this.mine) {
    num += 8;
  }
  return num;
};
MapCell.prototype.setType = function(newType, mine, retileRadius) {
  var _c, _d, hadMine, oldType;
  mine || (mine = false);
  retileRadius || (retileRadius = 1);
  oldType = this.type;
  hadMine = this.mine;
  this.mine = mine;
  if (typeof (newType) === 'string') {
    this.type = TERRAIN_TYPES[newType];
    if (newType.length !== 1 || !(typeof (_c = this.type) !== "undefined" && _c !== null)) {
      throw ("Invalid terrain type: " + (newType));
    }
  } else if (typeof (newType) === 'number') {
    if (newType >= 10) {
      newType -= 8;
      this.mine = true;
    } else {
      this.mine = false;
    }
    this.type = NUM_TO_TERRAIN[newType];
    if (!(typeof (_d = this.type) !== "undefined" && _d !== null)) {
      throw ("Invalid terrain type: " + (newType));
    }
  } else {
    this.type = newType;
  }
  net.mapChanged(this, oldType, hadMine);
  if (!(retileRadius < 0)) {
    return this.map.retile(this.x - retileRadius, this.y - retileRadius, this.x + retileRadius, this.y + retileRadius);
  }
};
MapCell.prototype.setTile = function(tx, ty) {
  return this.map.view.onRetile(this, tx, ty);
};
MapCell.prototype.retile = function() {
  var _c, _d, _e;
  if (typeof (_c = this.pill) !== "undefined" && _c !== null) {
    return this.setTile(this.pill.armour, 4);
  } else if (typeof (_d = this.base) !== "undefined" && _d !== null) {
    return this.setTile(16, 4);
  } else {
    if ((_e = this.type.ascii) === '^') {
      return this.retileDeepSea();
    } else if (_e === '|') {
      return this.retileBuilding();
    } else if (_e === ' ') {
      return this.retileRiver();
    } else if (_e === '~') {
      return this.setTile(7, 1);
    } else if (_e === '%') {
      return this.setTile(5, 1);
    } else if (_e === '=') {
      return this.retileRoad();
    } else if (_e === '#') {
      return this.retileForest();
    } else if (_e === ':') {
      return this.setTile(4, 1);
    } else if (_e === '.') {
      return this.setTile(2, 1);
    } else if (_e === '}') {
      return this.setTile(8, 1);
    } else if (_e === 'b') {
      return this.retileBoat();
    }
  }
};
MapCell.prototype.retileDeepSea = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('^')) {
      return 'd';
    }
    if (n.isType(' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this);
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  if (aboveLeft !== 'd' && above !== 'd' && left !== 'd' && right === 'd' && below === 'd') {
    return this.setTile(10, 3);
  } else if (aboveRight !== 'd' && above !== 'd' && right !== 'd' && left === 'd' && below === 'd') {
    return this.setTile(11, 3);
  } else if (belowRight !== 'd' && below !== 'd' && right !== 'd' && left === 'd' && above === 'd') {
    return this.setTile(13, 3);
  } else if (belowLeft !== 'd' && below !== 'd' && left !== 'd' && right === 'd' && above === 'd') {
    return this.setTile(12, 3);
  } else if (left === 'w' && right === 'd') {
    return this.setTile(14, 3);
  } else if (below === 'w' && above === 'd') {
    return this.setTile(15, 3);
  } else if (above === 'w' && below === 'd') {
    return this.setTile(16, 3);
  } else if (right === 'w' && left === 'd') {
    return this.setTile(17, 3);
  } else {
    return this.setTile(0, 0);
  }
};
MapCell.prototype.retileBuilding = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('|', '}')) {
      return 'b';
    }
    return 'o';
  }, this);
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(17, 1);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b') {
    return this.setTile(30, 1);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft === 'b') {
    return this.setTile(22, 2);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft === 'b' && belowRight !== 'b' && belowLeft !== 'b') {
    return this.setTile(23, 2);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight !== 'b' && aboveLeft !== 'b' && belowRight === 'b' && belowLeft !== 'b') {
    return this.setTile(24, 2);
  } else if (right === 'b' && above === 'b' && below === 'b' && left === 'b' && aboveRight === 'b' && aboveLeft !== 'b' && belowRight !== 'b' && belowLeft !== 'b') {
    return this.setTile(25, 2);
  } else if (aboveLeft === 'b' && above === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(16, 2);
  } else if (above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(17, 2);
  } else if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && belowLeft === 'b' && below === 'b') {
    return this.setTile(18, 2);
  } else if (aboveLeft === 'b' && above === 'b' && aboveRight === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(19, 2);
  } else if (left === 'b' && right === 'b' && above === 'b' && below === 'b' && aboveRight === 'b' && belowLeft === 'b' && aboveLeft !== 'b' && belowRight !== 'b') {
    return this.setTile(20, 2);
  } else if (left === 'b' && right === 'b' && above === 'b' && below === 'b' && belowRight === 'b' && aboveLeft === 'b' && aboveRight !== 'b' && belowLeft !== 'b') {
    return this.setTile(21, 2);
  } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowRight === 'b' && aboveRight === 'b') {
    return this.setTile(8, 2);
  } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && aboveLeft === 'b') {
    return this.setTile(9, 2);
  } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight === 'b') {
    return this.setTile(10, 2);
  } else if (above === 'b' && left === 'b' && right === 'b' && below === 'b' && aboveLeft === 'b' && aboveRight === 'b') {
    return this.setTile(11, 2);
  } else if (above === 'b' && below === 'b' && left === 'b' && right !== 'b' && belowLeft === 'b' && aboveLeft !== 'b') {
    return this.setTile(12, 2);
  } else if (above === 'b' && below === 'b' && right === 'b' && belowRight === 'b' && left !== 'b' && aboveRight !== 'b') {
    return this.setTile(13, 2);
  } else if (above === 'b' && below === 'b' && right === 'b' && aboveRight === 'b' && belowRight !== 'b') {
    return this.setTile(14, 2);
  } else if (above === 'b' && below === 'b' && left === 'b' && aboveLeft === 'b' && belowLeft !== 'b') {
    return this.setTile(15, 2);
  } else if (right === 'b' && above === 'b' && left === 'b' && below !== 'b' && aboveLeft !== 'b' && aboveRight !== 'b') {
    return this.setTile(26, 1);
  } else if (right === 'b' && below === 'b' && left === 'b' && belowLeft !== 'b' && belowRight !== 'b') {
    return this.setTile(27, 1);
  } else if (right === 'b' && above === 'b' && below === 'b' && aboveRight !== 'b' && belowRight !== 'b') {
    return this.setTile(28, 1);
  } else if (below === 'b' && above === 'b' && left === 'b' && aboveLeft !== 'b' && belowLeft !== 'b') {
    return this.setTile(29, 1);
  } else if (left === 'b' && right === 'b' && above === 'b' && aboveRight === 'b' && aboveLeft !== 'b') {
    return this.setTile(4, 2);
  } else if (left === 'b' && right === 'b' && above === 'b' && aboveLeft === 'b' && aboveRight !== 'b') {
    return this.setTile(5, 2);
  } else if (left === 'b' && right === 'b' && below === 'b' && belowLeft === 'b' && belowRight !== 'b') {
    return this.setTile(6, 2);
  } else if (left === 'b' && right === 'b' && below === 'b' && above !== 'b' && belowRight === 'b' && belowLeft !== 'b') {
    return this.setTile(7, 2);
  } else if (right === 'b' && above === 'b' && below === 'b') {
    return this.setTile(0, 2);
  } else if (left === 'b' && above === 'b' && below === 'b') {
    return this.setTile(1, 2);
  } else if (right === 'b' && left === 'b' && below === 'b') {
    return this.setTile(2, 2);
  } else if (right === 'b' && above === 'b' && left === 'b') {
    return this.setTile(3, 2);
  } else if (right === 'b' && below === 'b' && belowRight === 'b') {
    return this.setTile(18, 1);
  } else if (left === 'b' && below === 'b' && belowLeft === 'b') {
    return this.setTile(19, 1);
  } else if (right === 'b' && above === 'b' && aboveRight === 'b') {
    return this.setTile(20, 1);
  } else if (left === 'b' && above === 'b' && aboveLeft === 'b') {
    return this.setTile(21, 1);
  } else if (right === 'b' && below === 'b') {
    return this.setTile(22, 1);
  } else if (left === 'b' && below === 'b') {
    return this.setTile(23, 1);
  } else if (right === 'b' && above === 'b') {
    return this.setTile(24, 1);
  } else if (left === 'b' && above === 'b') {
    return this.setTile(25, 1);
  } else if (left === 'b' && right === 'b') {
    return this.setTile(11, 1);
  } else if (above === 'b' && below === 'b') {
    return this.setTile(12, 1);
  } else if (right === 'b') {
    return this.setTile(13, 1);
  } else if (left === 'b') {
    return this.setTile(14, 1);
  } else if (below === 'b') {
    return this.setTile(15, 1);
  } else if (above === 'b') {
    return this.setTile(16, 1);
  } else {
    return this.setTile(6, 1);
  }
};
MapCell.prototype.retileRiver = function() {
  var above, below, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('=')) {
      return 'r';
    }
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this);
  above = neighbourSignificance(0, -1);
  right = neighbourSignificance(1, 0);
  below = neighbourSignificance(0, 1);
  left = neighbourSignificance(-1, 0);
  if (above === 'l' && below === 'l' && right === 'l' && left === 'l') {
    return this.setTile(30, 2);
  } else if (above === 'l' && below === 'l' && right === 'w' && left === 'l') {
    return this.setTile(26, 2);
  } else if (above === 'l' && below === 'l' && right === 'l' && left === 'w') {
    return this.setTile(27, 2);
  } else if (above === 'l' && below === 'w' && right === 'l' && left === 'l') {
    return this.setTile(28, 2);
  } else if (above === 'w' && below === 'l' && right === 'l' && left === 'l') {
    return this.setTile(29, 2);
  } else if (above === 'l' && left === 'l') {
    return this.setTile(6, 3);
  } else if (above === 'l' && right === 'l') {
    return this.setTile(7, 3);
  } else if (below === 'l' && left === 'l') {
    return this.setTile(8, 3);
  } else if (below === 'l' && right === 'l') {
    return this.setTile(9, 3);
  } else if (below === 'l' && above === 'l' && below === 'l') {
    return this.setTile(0, 3);
  } else if (left === 'l' && right === 'l') {
    return this.setTile(1, 3);
  } else if (left === 'l') {
    return this.setTile(2, 3);
  } else if (below === 'l') {
    return this.setTile(3, 3);
  } else if (right === 'l') {
    return this.setTile(4, 3);
  } else if (above === 'l') {
    return this.setTile(5, 3);
  } else {
    return this.setTile(1, 0);
  }
};
MapCell.prototype.retileRoad = function() {
  var above, aboveLeft, aboveRight, below, belowLeft, belowRight, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('=')) {
      return 'r';
    }
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this);
  above = neighbourSignificance(0, -1);
  aboveRight = neighbourSignificance(1, -1);
  right = neighbourSignificance(1, 0);
  belowRight = neighbourSignificance(1, 1);
  below = neighbourSignificance(0, 1);
  belowLeft = neighbourSignificance(-1, 1);
  left = neighbourSignificance(-1, 0);
  aboveLeft = neighbourSignificance(-1, -1);
  if (aboveLeft !== 'r' && above === 'r' && aboveRight !== 'r' && left === 'r' && right === 'r' && belowLeft !== 'r' && below === 'r' && belowRight !== 'r') {
    return this.setTile(11, 0);
  } else if (above === 'r' && left === 'r' && right === 'r' && below === 'r') {
    return this.setTile(10, 0);
  } else if (left === 'w' && right === 'w' && above === 'w' && below === 'w') {
    return this.setTile(26, 0);
  } else if (right === 'r' && below === 'r' && left === 'w' && above === 'w') {
    return this.setTile(20, 0);
  } else if (left === 'r' && below === 'r' && right === 'w' && above === 'w') {
    return this.setTile(21, 0);
  } else if (above === 'r' && left === 'r' && below === 'w' && right === 'w') {
    return this.setTile(22, 0);
  } else if (right === 'r' && above === 'r' && left === 'w' && below === 'w') {
    return this.setTile(23, 0);
  } else if (above === 'w' && below === 'w') {
    return this.setTile(24, 0);
  } else if (left === 'w' && right === 'w') {
    return this.setTile(25, 0);
  } else if (above === 'w' && below === 'r') {
    return this.setTile(16, 0);
  } else if (right === 'w' && left === 'r') {
    return this.setTile(17, 0);
  } else if (below === 'w' && above === 'r') {
    return this.setTile(18, 0);
  } else if (left === 'w' && right === 'r') {
    return this.setTile(19, 0);
  } else if (right === 'r' && below === 'r' && above === 'r' && (aboveRight === 'r' || belowRight === 'r')) {
    return this.setTile(27, 0);
  } else if (left === 'r' && right === 'r' && below === 'r' && (belowLeft === 'r' || belowRight === 'r')) {
    return this.setTile(28, 0);
  } else if (left === 'r' && above === 'r' && below === 'r' && (belowLeft === 'r' || aboveLeft === 'r')) {
    return this.setTile(29, 0);
  } else if (left === 'r' && right === 'r' && above === 'r' && (aboveRight === 'r' || aboveLeft === 'r')) {
    return this.setTile(30, 0);
  } else if (left === 'r' && right === 'r' && below === 'r') {
    return this.setTile(12, 0);
  } else if (left === 'r' && above === 'r' && below === 'r') {
    return this.setTile(13, 0);
  } else if (left === 'r' && right === 'r' && above === 'r') {
    return this.setTile(14, 0);
  } else if (right === 'r' && above === 'r' && below === 'r') {
    return this.setTile(15, 0);
  } else if (below === 'r' && right === 'r' && belowRight === 'r') {
    return this.setTile(6, 0);
  } else if (below === 'r' && left === 'r' && belowLeft === 'r') {
    return this.setTile(7, 0);
  } else if (above === 'r' && left === 'r' && aboveLeft === 'r') {
    return this.setTile(8, 0);
  } else if (above === 'r' && right === 'r' && aboveRight === 'r') {
    return this.setTile(9, 0);
  } else if (below === 'r' && right === 'r') {
    return this.setTile(2, 0);
  } else if (below === 'r' && left === 'r') {
    return this.setTile(3, 0);
  } else if (above === 'r' && left === 'r') {
    return this.setTile(4, 0);
  } else if (above === 'r' && right === 'r') {
    return this.setTile(5, 0);
  } else if (right === 'r' || left === 'r') {
    return this.setTile(0, 1);
  } else if (above === 'r' || below === 'r') {
    return this.setTile(1, 1);
  } else {
    return this.setTile(10, 0);
  }
};
MapCell.prototype.retileForest = function() {
  var above, below, left, right;
  above = this.neigh(0, -1).isType('#');
  right = this.neigh(1, 0).isType('#');
  below = this.neigh(0, 1).isType('#');
  left = this.neigh(-1, 0).isType('#');
  if (!above && !left && right && below) {
    return this.setTile(9, 9);
  } else if (!above && left && !right && below) {
    return this.setTile(10, 9);
  } else if (above && left && !right && !below) {
    return this.setTile(11, 9);
  } else if (above && !left && right && !below) {
    return this.setTile(12, 9);
  } else if (above && !left && !right && !below) {
    return this.setTile(16, 9);
  } else if (!above && !left && !right && below) {
    return this.setTile(15, 9);
  } else if (!above && left && !right && !below) {
    return this.setTile(14, 9);
  } else if (!above && !left && right && !below) {
    return this.setTile(13, 9);
  } else if (!above && !left && !right && !below) {
    return this.setTile(8, 9);
  } else {
    return this.setTile(3, 1);
  }
};
MapCell.prototype.retileBoat = function() {
  var above, below, left, neighbourSignificance, right;
  neighbourSignificance = __bind(function(dx, dy) {
    var n;
    n = this.neigh(dx, dy);
    if (n.isType('^', ' ', 'b')) {
      return 'w';
    }
    return 'l';
  }, this);
  above = neighbourSignificance(0, -1);
  right = neighbourSignificance(1, 0);
  below = neighbourSignificance(0, 1);
  left = neighbourSignificance(-1, 0);
  if (above !== 'w' && left !== 'w') {
    return this.setTile(15, 6);
  } else if (above !== 'w' && right !== 'w') {
    return this.setTile(16, 6);
  } else if (below !== 'w' && right !== 'w') {
    return this.setTile(17, 6);
  } else if (below !== 'w' && left !== 'w') {
    return this.setTile(14, 6);
  } else if (left !== 'w') {
    return this.setTile(12, 6);
  } else if (right !== 'w') {
    return this.setTile(13, 6);
  } else if (below !== 'w') {
    return this.setTile(10, 6);
  } else {
    return this.setTile(11, 6);
  }
};
MapView = function() {};
MapView.prototype.onRetile = function(cell, tx, ty) {};
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
      row[x] = new MapCell(this, x, y);
    }
  }
  return this;
};
Map.prototype.setView = function(_c) {
  this.view = _c;
  return this.retile();
};
Map.prototype.getRandomStart = function() {
  return this.starts[round(random() * (this.starts.length - 1))];
};
Map.prototype.cellAtTile = function(x, y) {
  var cell;
  return (cell = this.cells[y] == null ? undefined : this.cells[y][x]) ? cell : new MapCell(this, x, y);
};
Map.prototype.cellAtPixel = function(x, y) {
  return this.cellAtTile(floor(x / TILE_SIZE_PIXEL), floor(y / TILE_SIZE_PIXEL));
};
Map.prototype.cellAtWorld = function(x, y) {
  return this.cellAtTile(floor(x / TILE_SIZE_WORLD), floor(y / TILE_SIZE_WORLD));
};
Map.prototype.each = function(cb, sx, sy, ex, ey) {
  var row, x, y;
  if (!((typeof sx !== "undefined" && sx !== null) && (sx >= 0))) {
    sx = 0;
  }
  if (!((typeof sy !== "undefined" && sy !== null) && (sy >= 0))) {
    sy = 0;
  }
  if (!((typeof ex !== "undefined" && ex !== null) && ex < MAP_SIZE_TILES)) {
    ex = MAP_SIZE_TILES - 1;
  }
  if (!((typeof ey !== "undefined" && ey !== null) && ey < MAP_SIZE_TILES)) {
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
Map.prototype.dump = function() {
  var _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, b, c, consecutiveCells, encodeNibbles, ensureRunSpace, ex, flushRun, flushSequence, p, retval, run, s, seq, sx, y;
  consecutiveCells = function(row, cb) {
    var _c, _d, cell, count, currentType, num, startx, x;
    currentType = null;
    startx = null;
    count = 0;
    _c = row;
    for (x = 0, _d = _c.length; x < _d; x++) {
      cell = _c[x];
      num = cell.getNumericType();
      if (currentType === num) {
        count++;
        continue;
      }
      if (typeof currentType !== "undefined" && currentType !== null) {
        cb(currentType, count, startx);
      }
      currentType = num;
      startx = x;
      count = 1;
    }
    if (typeof currentType !== "undefined" && currentType !== null) {
      cb(currentType, count, startx);
    }
    return null;
  };
  encodeNibbles = function(nibbles) {
    var _c, _d, i, nibble, octets, val;
    octets = [];
    val = null;
    _c = nibbles;
    for (i = 0, _d = _c.length; i < _d; i++) {
      nibble = _c[i];
      nibble = nibble & 0x0F;
      if (i % 2 === 0) {
        val = nibble << 4;
      } else {
        octets.push(val + nibble);
        val = null;
      }
    }
    if (typeof val !== "undefined" && val !== null) {
      octets.push(val);
    }
    return octets;
  };
  retval = (function() {
    _c = []; _e = 'BMAPBOLO';
    for (_d = 0, _f = _e.length; _d < _f; _d++) {
      c = _e[_d];
      _c.push(c.charCodeAt(0));
    }
    return _c;
  })();
  retval.push(1, this.pills.length, this.bases.length, this.starts.length);
  _h = this.pills;
  for (_g = 0, _i = _h.length; _g < _i; _g++) {
    p = _h[_g];
    retval.push(p.x, p.y, p.owner, p.armour, p.speed);
  }
  _k = this.bases;
  for (_j = 0, _l = _k.length; _j < _l; _j++) {
    b = _k[_j];
    retval.push(b.x, b.y, b.owner, b.armour, b.shells, b.mines);
  }
  _n = this.starts;
  for (_m = 0, _o = _n.length; _m < _o; _m++) {
    s = _n[_m];
    retval.push(s.x, s.y, s.direction);
  }
  run = (seq = (sx = (ex = (y = null))));
  flushRun = function() {
    var octets;
    if (!(typeof run !== "undefined" && run !== null)) {
      return null;
    }
    flushSequence();
    octets = encodeNibbles(run);
    retval.push(octets.length + 4, y, sx, ex);
    retval = retval.concat(octets);
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
    if (!(typeof seq !== "undefined" && seq !== null)) {
      return null;
    }
    localSeq = seq;
    seq = null;
    ensureRunSpace(localSeq.length + 1);
    run.push(localSeq.length - 1);
    run = run.concat(localSeq);
    return ex += localSeq.length;
  };
  _q = this.cells;
  for (_p = 0, _r = _q.length; _p < _r; _p++) {
    (function() {
      var row = _q[_p];
      y = row[0].y;
      run = (sx = (ex = (seq = null)));
      return consecutiveCells(row, function(type, count, x) {
        var _s, seqLen;
        if (type === -1) {
          flushRun();
          return null;
        }
        if (!(typeof run !== "undefined" && run !== null)) {
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
        _s = [];
        while (count > 0) {
          _s.push((function() {
            if (!(typeof seq !== "undefined" && seq !== null)) {
              seq = [];
            }
            seq.push(type);
            if (seq.length === 8) {
              flushSequence();
            }
            return count--;
          })());
        }
        return _s;
      });
    })();
  }
  flushRun();
  retval.push(4, 0xFF, 0xFF, 0xFF);
  return retval;
};
load = function(buffer) {
  var _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, base, c, dataLen, ex, extractAttributes, filePos, i, magic, numBases, numPills, numStarts, pill, readBytes, retval, run, runPos, seqLen, sx, takeNibble, type, version, x, y;
  filePos = 0;
  readBytes = function(num, msg) {
    var sub;
    sub = (function() {
      try {
        return buffer.slice(filePos, filePos + num);
      } catch (e) {
        throw msg;
      }
    })();
    filePos += num;
    return sub;
  };
  magic = readBytes(8, "Not a Bolo map.");
  _c = 'BMAPBOLO';
  for (i = 0, _d = _c.length; i < _d; i++) {
    c = _c[i];
    if (c.charCodeAt(0) !== magic[i]) {
      throw "Not a Bolo map.";
    }
  }
  _e = readBytes(4, "Incomplete header");
  version = _e[0];
  numPills = _e[1];
  numBases = _e[2];
  numStarts = _e[3];
  if (version !== 1) {
    throw ("Unsupported map version: " + (version));
  }
  retval = new Map();
  extractAttributes = function() {
    var _f, _g, data, index, name, names, obj;
    names = __slice.call(arguments, 0);
    obj = {};
    data = readBytes(names.length, "Incomplete header");
    _f = names;
    for (index = 0, _g = _f.length; index < _g; index++) {
      name = _f[index];
      obj[name] = data[index];
    }
    return obj;
  };
  retval.pills = (function() {
    _f = [];
    for (i = 1; (1 <= numPills ? i <= numPills : i >= numPills); (1 <= numPills ? i += 1 : i -= 1)) {
      _f.push(extractAttributes('x', 'y', 'owner', 'armour', 'speed'));
    }
    return _f;
  })();
  retval.bases = (function() {
    _g = [];
    for (i = 1; (1 <= numBases ? i <= numBases : i >= numBases); (1 <= numBases ? i += 1 : i -= 1)) {
      _g.push(extractAttributes('x', 'y', 'owner', 'armour', 'shells', 'mines'));
    }
    return _g;
  })();
  retval.starts = (function() {
    _h = [];
    for (i = 1; (1 <= numStarts ? i <= numStarts : i >= numStarts); (1 <= numStarts ? i += 1 : i -= 1)) {
      _h.push(extractAttributes('x', 'y', 'direction'));
    }
    return _h;
  })();
  while (true) {
    _i = readBytes(4, "Incomplete map data");
    dataLen = _i[0];
    y = _i[1];
    sx = _i[2];
    ex = _i[3];
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
        for (i = 1; (1 <= seqLen + 1 ? i <= seqLen + 1 : i >= seqLen + 1); (1 <= seqLen + 1 ? i += 1 : i -= 1)) {
          retval.cellAtTile(x++, y).setType(takeNibble(), undefined, -1);
        }
      } else {
        type = takeNibble();
        for (i = 1; (1 <= seqLen - 6 ? i <= seqLen - 6 : i >= seqLen - 6); (1 <= seqLen - 6 ? i += 1 : i -= 1)) {
          retval.cellAtTile(x++, y).setType(type, undefined, -1);
        }
      }
    }
  }
  _k = retval.pills;
  for (_j = 0, _l = _k.length; _j < _l; _j++) {
    pill = _k[_j];
    pill.cell = retval.cells[pill.y][pill.x];
    pill.cell.pill = pill;
  }
  _n = retval.bases;
  for (_m = 0, _o = _n.length; _m < _o; _m++) {
    base = _n[_m];
    base.cell = retval.cells[base.y][base.x];
    base.cell.base = base;
    base.cell.setType('=', false, -1);
  }
  return retval;
};
exports.TERRAIN_TYPES = TERRAIN_TYPES;
exports.MapCell = MapCell;
exports.MapView = MapView;
exports.Map = Map;
exports.load = load;
});
require.module('bolo/client/net', false, function(module, exports, require) {
var ClientContext;
var __hasProp = Object.prototype.hasOwnProperty;
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
ClientContext = function(_a) {
  this.game = _a;
  this.transientMapCells = {};
  this.transientDestructions = [];
  return this;
};
ClientContext.prototype.authoritative = false;
ClientContext.prototype.activated = function() {
  var _a, _b, _c, _d, _e, _f, _g, _h, cell, i, idx, obj;
  if (!(this.authoritative)) {
    return null;
  }
  _a = this.game.objects;
  for (i = 0, _b = _a.length; i < _b; i++) {
    obj = _a[i];
    if (obj._net_transient) {
      break;
    }
  }
  this.game.objects.splice(i, this.game.objects.length - i);
  _c = this.transientMapCells;
  for (idx in _c) {
    if (!__hasProp.call(_c, idx)) continue;
    cell = _c[idx];
    cell.setType(cell._net_oldType, cell._net_hadMine);
  }
  this.transientMapCells = {};
  if (!(this.transientDestructions.length > 0)) {
    return null;
  }
  _e = this.transientDestructions;
  for (_d = 0, _f = _e.length; _d < _f; _d++) {
    obj = _e[_d];
    this.game.objects.splice(obj.idx, 0, obj);
  }
  this.transientDestructions = [];
  _g = this.game.objects;
  for (i = 0, _h = _g.length; i < _h; i++) {
    obj = _g[i];
    obj.idx = i;
  }
  return null;
};
ClientContext.prototype.created = function(obj) {
  return (obj._net_transient = !this.authoritative);
};
ClientContext.prototype.mapChanged = function(cell, oldType, hadMine) {
  var _a;
  if (!(this.authoritative || (typeof (_a = this.transientMapCells[cell.idx]) !== "undefined" && _a !== null))) {
    cell._net_oldType = oldType;
    cell._net_hadMine = hadMine;
    this.transientMapCells[cell.idx] = cell;
  }
  return null;
};
ClientContext.prototype.destroyed = function(obj) {
  if (!(this.authoritative || obj._net_transient)) {
    this.transientDestructions.unshift(obj);
  }
  return null;
};
module.exports = ClientContext;
});
require.module('bolo/client/util', false, function(module, exports, require) {
var decodeBase64;
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
decodeBase64 = function(input) {
  var _a, _b, c, cc, i, output, outputIndex, outputLength, quad, quadIndex, tail;
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
  _a = input;
  for (i = 0, _b = _a.length; i < _b; i++) {
    c = _a[i];
    cc = c.charCodeAt(0);
    quadIndex = i % 4;
    if ((65 <= cc) && (cc <= 90)) {
      quad[quadIndex] = cc - 65;
    } else if ((97 <= cc) && (cc <= 122)) {
      quad[quadIndex] = cc - 71;
    } else if ((48 <= cc) && (cc <= 57)) {
      quad[quadIndex] = cc + 4;
    } else if (cc === 43) {
      quad[quadIndex] = 62;
    } else if (cc === 47) {
      quad[quadIndex] = 63;
    } else if (cc === 61) {
      quad[quadIndex] = -1;
    } else {
      throw new Error("Invalid base64 input character: " + (c));
    }
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
var CachedSegment, Common2dRenderer, MAP_SIZE_SEGMENTS, MAP_SIZE_TILES, Offscreen2dRenderer, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_TILES, TILE_SIZE_PIXEL, _a, _b, floor;
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
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
_a = Math;
floor = _a.floor;
_b = require('../../constants');
TILE_SIZE_PIXEL = _b.TILE_SIZE_PIXEL;
MAP_SIZE_TILES = _b.MAP_SIZE_TILES;
Common2dRenderer = require('./common_2d');
SEGMENT_SIZE_TILES = 16;
MAP_SIZE_SEGMENTS = MAP_SIZE_TILES / SEGMENT_SIZE_TILES;
SEGMENT_SIZE_PIXEL = SEGMENT_SIZE_TILES * TILE_SIZE_PIXEL;
CachedSegment = function(_c, x, y) {
  this.renderer = _c;
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
  if (ex < this.psx || ey < this.psy) {
    return false;
  } else if (sx > this.pex || sy > this.pey) {
    return false;
  } else {
    return true;
  }
};
CachedSegment.prototype.build = function() {
  this.canvas = $('<canvas/>')[0];
  this.canvas.width = (this.canvas.height = SEGMENT_SIZE_PIXEL);
  this.ctx = this.canvas.getContext('2d');
  this.ctx.translate(-this.psx, -this.psy);
  return this.renderer.map.each(__bind(function(cell) {
    return this.onRetile(cell, cell.tile[0], cell.tile[1]);
  }, this), this.sx, this.sy, this.ex, this.ey);
};
CachedSegment.prototype.clear = function() {
  return (this.canvas = (this.ctx = null));
};
CachedSegment.prototype.onRetile = function(cell, tx, ty) {
  if (!(this.canvas)) {
    return null;
  }
  return this.ctx.drawImage(this.renderer.tilemap, tx * TILE_SIZE_PIXEL, ty * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, cell.x * TILE_SIZE_PIXEL, cell.y * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
};
Offscreen2dRenderer = function(tilemap, map) {
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
  var _c, _d, _e, _f, _g, _h, alreadyBuiltOne, ex, ey, row, segment;
  ex = sx + w - 1;
  ey = sy + h - 1;
  alreadyBuiltOne = false;
  _d = this.cache;
  for (_c = 0, _e = _d.length; _c < _e; _c++) {
    row = _d[_c];
    _g = row;
    for (_f = 0, _h = _g.length; _f < _h; _f++) {
      segment = _g[_f];
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
var Common2dRenderer, PIXEL_SIZE_WORLD, TILE_SIZE_PIXEL, _a, _b, round;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
_a = Math;
round = _a.round;
_b = require('../../constants');
TILE_SIZE_PIXEL = _b.TILE_SIZE_PIXEL;
PIXEL_SIZE_WORLD = _b.PIXEL_SIZE_WORLD;
Common2dRenderer = function(_c, _d) {
  this.map = _d;
  this.tilemap = _c;
  this.canvas = $('<canvas/>');
  try {
    this.ctx = this.canvas[0].getContext('2d');
    this.ctx.drawImage;
  } catch (e) {
    throw ("Could not initialize 2D canvas: " + (e.message));
  }
  this.canvas.appendTo('body');
  this.handleResize();
  $(window).resize(__bind(function() {
    return this.handleResize();
  }, this));
  return this;
};
Common2dRenderer.prototype.handleResize = function() {
  this.canvas[0].width = window.innerWidth;
  this.canvas[0].height = window.innerHeight;
  return this.canvas.css({
    width: window.innerWidth + 'px',
    height: window.innerHeight + 'px'
  });
};
Common2dRenderer.prototype.drawTile = function(tx, ty, dx, dy) {
  return this.ctx.drawImage(this.tilemap, tx * TILE_SIZE_PIXEL, ty * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, dx, dy, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
};
Common2dRenderer.prototype.centerOnObject = function(obj, cb) {
  var _c, height, left, top, width;
  this.ctx.save();
  _c = this.canvas[0];
  width = _c.width;
  height = _c.height;
  left = round(obj.x / PIXEL_SIZE_WORLD - width / 2);
  top = round(obj.y / PIXEL_SIZE_WORLD - height / 2);
  this.ctx.translate(-left, -top);
  cb(left, top, width, height);
  return this.ctx.restore();
};
module.exports = Common2dRenderer;
});
require.module('bolo/client/everard', false, function(module, exports, require) {
/*
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
*/
module.exports = 'Qk1BUEJPTE8BEAsQW5H/D2Vjbv8PZV90/w9lVHX/D2VwbP8PZYFr/w9lq27/D2WueP8PZa58/w9l\nmpL/D2Veh/8PZWmJ/w9lcYn/D2Vsf/8PZWx4/w9lrYn/D2WBaP9aWlqvaf9aWlpWbv9aWlquev9a\nWlp5e/9aWlpsfP9aWlqLff9aWlpti/9aWlpVjf9aWlqlkv9aWlp+mP9aWlpMjABMfABcZA1sZAx8\nZAyMZAycZAysZAu4fAi4jAisnAWcnASMnAR8nARsnARcnAMQZk608fHx8fHx8fHx8fGRGGdNtaH0\ntNUB8PCQkgGSAeIB4vHh8pKRHWhNtZGU9YUE1QHnlOcAxIIB4gHiAfKygdKQkoEfaU21gZT1lQTV\nAde05wSSgYIB4pHCAfKC8ZEAhJKBIGpNtYGEhfSFBNUBx9TXBIeC8bKBooHiofICgQSBgoEja021\ngQSFhNUEhQTVAbf0xwSXEhwrGSAaIBwqGCAfKSFCsSBsTbWBBIUE5QSFBNWRl/TUl/KSsaIBkqGy\ngfKCBKKBIG1NtYEEhQSFpIUEhQT1AZf0xwT3t7LxAfIB8oIEooEjbk21gQSFBIWEFUhQSFBKUHpQ\nGn1NcE9/fCAfKioeIEooECBvTbWBBIUEtQSFBIUE9QG3tOcE9/eygZL3p5HCBKKBIXBNtYEEhQS1\nBIUEhQT1gbeU9wT394eSAaL3x5GiBKKBIHFNtYEEhdSFBIUE9RUffXIED355CHAff3lwGiBKKBAe\nck21gQT1hQSFBPUVH31wD09JQQeB9/eXsQSBgoEdc021gQT1hQSFBPUVH31yBA9+dAQHH399eAFA\nsRl0TbWB9KSFFH9QH35wT39wD09PS0AJKBAddU21gbUH9QTl8QGH4QTx8RFJH394eFlxBICSgSJ2\nTbWB9cUE1fGx0ATw8EBAEIcFlwCHhYcQeFl4WnFHooEgd021gfWFtLXx0QD0pAD0pDAQeVx4WXhR\ncKcAhwS3gSJ4TbXhtQTl8QLREE8IAkBNAEkDQBCHBYcldZeF96cEt4EleU21gbcBtQTl8eEgQPRA\nQEC0AJRAQBCHBYclBaeFl5XHBLWBJnpNtYG3AaUQSQtfHhkATwJASQBLBUBAELeVhwCHhceVhwSH\nlYEje021gbcBpQD09PSUAJQgQJQgQNRwQEAQX3p4W3JXWXtYECd8TbWBtwGlkBQLXxAtEQSwRAQE\nkASwdAQEBAEQhYeF9wW3JXXngSd9TbWBtwHVBMXx4SBAtCBAtAC0cEBAQBAJUHhZeVt5VHV1e1h4\nECp+TbWBtwHVBIXx8ZEwQEsATQBNB0BAEFcVeFlwWnBYcFl3V1dXVwWHgSd/TbWBtwGFsQSRp+EC\n0UBAQPSEAPRAQBCHpZeVB5UXWXNXV7WHgSeATbWBt6GgBKeV8dFwQEBATQBPBUBAEPcFpwWHBZd1\ndXV1cFh4ECSBTbWB96AEp5UH8aFAEECUANQgQNRAQECh15W3lUdXV7WHgSOCTbWB94CHBNUH8ZFC\nAQTwBJAkBLB0BAQBAHsffHJXXngQI4NNtYHwgIcElcfxAYIgEPSEAJQAtACUQEAQt+HnFXxZeBAf\nhE21gfCAhwTVhwGSsZIQHQBLAE0ATQEQ95fB97eBHIVNtYEAxwC3BKeVhwHyggCRAPQA9PSE98fx\n4R6GTbWBEHoAewF01YcB8oKQAfDw8AGHBPe3gPe3gR6HTbWBIHCnALc0V1t4HyogDx8fGBhwT3x4\nD3p4EByITbWBMHB6C3BNUHgfKyAfeg9+cE98eA95eRAeiU21gZD3IECXlRcfLCAYcAt8D3xxBPCA\nl7D3B5Efik21gQeAB4DHAPT09LSHAKcAhwD09MQwcHsPcHkQK4tNtYEHgAeAxyBAh4CXAaKQFAwk\nFwcKcApwCHAPeHBKCRBIEwQH0PcHkSaMTbWBB4AHgOQAh4CXAaKwwgGXEHwAew94eUEQkQSBAPQA\n94eBKo1NtYEHgAeAFH0IeAh4GSkPJhcHBw9/engCQQkQSBgBQMcQegh4WHgQK45NtYEHgAeAh/CA\nB4GSoPKBpwCHhccA15AHgCQQkQShFAxwCnAIeFh4ECmPTbWBhyBwh4CngIcAhwGioPISGnANegh6\nUXCXgCQQ4QSwB9CHhYeBKZBNtYGHMHB5AHgAeAhwCHAZKw8hIafwtwWHhZCHEE0aSAhwDHANeBAo\nkU21gYeQRwcHgASAhxB4GSsPISGnsPeFhwWAlwCk0QSAB/AXC3gQKpJNtYGnUHBweAB4CHIHGnsP\ncH8YH3hYcVCXAIShAqEUCXEEhwCnALeBKJNNtYEHoEcHB4AHgAeAFxp7D3hwHnwbeFhwCXgJShxJ\nCXkAeAt4ECaUTbWBB6BHBweAB4AnB4GnsJehpwH3p7G3gAeQBPGAFAp8C3kQIpVNtYGXAIcwcHgK\ncgcbewh8GXAffnoceAlNEgdKD3l5ECCWTbWRhwCnEHgAegFxt7CHwZcB9/cH8fGBEH9ATHoQHZdN\ntZGH8Aeggbewl6GnAfeHkfengPERDygrexAbmE21sfCXgAHHsKeBtwH34feHAPERDygpfRAQmU60\n8fHx8fHx8fHx8fGRBP///w=='.split('\n').join('');
});
