(function() {
  var BoloClientWorld, ClientWorld, JOIN_DIALOG_TEMPLATE, WorldBase, WorldMap, WorldPillbox, allObjects, decodeBase64, helpers, net, unpack;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  ClientWorld = require('villain/world/net/client');
  WorldMap = require('../../world_map');
  allObjects = require('../../objects/all');
  WorldPillbox = require('../../objects/world_pillbox');
  WorldBase = require('../../objects/world_base');
  unpack = require('../../struct').unpack;
  decodeBase64 = require('../base64').decodeBase64;
  net = require('../../net');
  helpers = require('../../helpers');
  JOIN_DIALOG_TEMPLATE = "<div id=\"join-dialog\">\n  <div>\n    <p>What is your name?</p>\n    <p><input type=\"text\" id=\"join-nick-field\" name=\"join-nick-field\" maxlength=20></input></p>\n  </div>\n  <div id=\"join-team\">\n    <p>Choose a side:</p>\n    <p>\n      <input type=\"radio\" id=\"join-team-red\" name=\"join-team\" value=\"red\"></input>\n      <label for=\"join-team-red\"><span class=\"bolo-team bolo-team-red\"></span></label>\n      <input type=\"radio\" id=\"join-team-blue\" name=\"join-team\" value=\"blue\"></input>\n      <label for=\"join-team-blue\"><span class=\"bolo-team bolo-team-blue\"></span></label>\n    </p>\n  </div>\n  <div>\n    <p><input type=\"button\" name=\"join-submit\" id=\"join-submit\" value=\"Join game\"></input></p>\n  </div>\n</div>";
  BoloClientWorld = function() {
    function BoloClientWorld() {
      BoloClientWorld.__super__.constructor.apply(this, arguments);
      this.mapChanges = {};
      this.processingServerMessages = false;
    }
    __extends(BoloClientWorld, ClientWorld);
    BoloClientWorld.prototype.authority = false;
    BoloClientWorld.prototype.loaded = function(vignette) {
      var m, path, ws;
      this.vignette = vignette;
      this.vignette.message('Connecting to the multiplayer game');
      this.heartbeatTimer = 0;
      if (m = /^\?([a-z]{20})$/.exec(location.search)) {
        path = "/match/" + m[1];
      } else if (location.search) {
        return this.vignette.message('Invalid game ID');
      } else {
        path = "/demo";
      }
      this.ws = new WebSocket("ws://" + location.host + path);
      ws = $(this.ws);
      ws.one('open.bolo', __bind(function() {
        return this.connected();
      }, this));
      return ws.one('close.bolo', __bind(function() {
        return this.failure('Connection lost');
      }, this));
    };
    BoloClientWorld.prototype.connected = function() {
      var ws;
      this.vignette.message('Waiting for the game map');
      ws = $(this.ws);
      return ws.one('message.bolo', __bind(function(e) {
        return this.receiveMap(e.originalEvent);
      }, this));
    };
    BoloClientWorld.prototype.receiveMap = function(e) {
      this.map = WorldMap.load(decodeBase64(e.data));
      this.commonInitialization();
      this.vignette.message('Waiting for the game state');
      return $(this.ws).bind('message.bolo', __bind(function(e) {
        return this.handleMessage(e.originalEvent);
      }, this));
    };
    BoloClientWorld.prototype.synchronized = function() {
      var blue, disadvantaged, red, tank, _i, _len, _ref;
      this.rebuildMapObjects();
      this.vignette.destroy();
      this.vignette = null;
      this.loop.start();
      red = blue = 0;
      _ref = this.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (tank.team === 0) {
          red++;
        }
        if (tank.team === 1) {
          blue++;
        }
      }
      disadvantaged = blue < red ? 'blue' : 'red';
      this.joinDialog = $(JOIN_DIALOG_TEMPLATE).dialog({
        dialogClass: 'unclosable'
      });
      return this.joinDialog.find('#join-nick-field').val($.cookie('nick') || '').focus().keydown(__bind(function(e) {
        if (e.which === 13) {
          return this.join();
        }
      }, this)).end().find("#join-team-" + disadvantaged).attr('checked', 'checked').end().find("#join-team").buttonset().end().find('#join-submit').button().click(__bind(function() {
        return this.join();
      }, this));
    };
    BoloClientWorld.prototype.join = function() {
      var nick, team;
      nick = this.joinDialog.find('#join-nick-field').val();
      team = this.joinDialog.find('#join-team input[checked]').val();
      team = function() {
        switch (team) {
          case 'red':
            return 0;
          case 'blue':
            return 1;
          default:
            return -1;
        }
      }();
      if (!(nick && team !== -1)) {
        return;
      }
      $.cookie('nick', nick);
      this.joinDialog.dialog('destroy');
      this.joinDialog = null;
      this.ws.send(JSON.stringify({
        command: 'join',
        nick: nick,
        team: team
      }));
      return this.input.focus();
    };
    BoloClientWorld.prototype.receiveWelcome = function(tank) {
      this.player = tank;
      this.renderer.initHud();
      return this.initChat();
    };
    BoloClientWorld.prototype.tick = function() {
      BoloClientWorld.__super__.tick.apply(this, arguments);
      if (this.increasingRange !== this.decreasingRange) {
        if (++this.rangeAdjustTimer === 6) {
          if (this.increasingRange) {
            this.ws.send(net.INC_RANGE);
          } else {
            this.ws.send(net.DEC_RANGE);
          }
          this.rangeAdjustTimer = 0;
        }
      } else {
        this.rangeAdjustTimer = 0;
      }
      if (++this.heartbeatTimer === 10) {
        this.heartbeatTimer = 0;
        return this.ws.send('');
      }
    };
    BoloClientWorld.prototype.failure = function(message) {
      if (this.ws) {
        this.ws.close();
        $(this.ws).unbind('.bolo');
        this.ws = null;
      }
      return BoloClientWorld.__super__.failure.apply(this, arguments);
    };
    BoloClientWorld.prototype.soundEffect = function(sfx, x, y, owner) {};
    BoloClientWorld.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {
      if (this.processingServerMessages) {
        return;
      }
      if (this.mapChanges[cell.idx] == null) {
        cell._net_oldType = oldType;
        cell._net_hadMine = hadMine;
        cell._net_oldLife = oldLife;
        this.mapChanges[cell.idx] = cell;
      }
      return;
    };
    BoloClientWorld.prototype.initChat = function() {
      this.chatMessages = $('<div/>', {
        id: 'chat-messages'
      }).appendTo(this.renderer.hud);
      this.chatContainer = $('<div/>', {
        id: 'chat-input'
      }).appendTo(this.renderer.hud).hide();
      return this.chatInput = $('<input/>', {
        type: 'text',
        name: 'chat',
        maxlength: 140
      }).appendTo(this.chatContainer).keydown(__bind(function(e) {
        return this.handleChatKeydown(e);
      }, this));
    };
    BoloClientWorld.prototype.openChat = function(options) {
      options || (options = {});
      this.chatContainer.show();
      return this.chatInput.val('').focus().team = options.team;
    };
    BoloClientWorld.prototype.commitChat = function() {
      this.ws.send(JSON.stringify({
        command: this.chatInput.team ? 'teamMsg' : 'msg',
        text: this.chatInput.val()
      }));
      return this.closeChat();
    };
    BoloClientWorld.prototype.closeChat = function() {
      this.chatContainer.hide();
      return this.input.focus();
    };
    BoloClientWorld.prototype.receiveChat = function(who, text, options) {
      var element;
      options || (options = {});
      element = options.team ? $('<p/>', {
        "class": 'msg-team'
      }).text("<" + who.name + "> " + text) : $('<p/>', {
        "class": 'msg'
      }).text("<" + who.name + "> " + text);
      this.chatMessages.append(element);
      return window.setTimeout(__bind(function() {
        return element.remove();
      }, this), 7000);
    };
    BoloClientWorld.prototype.handleKeydown = function(e) {
      if (!(this.ws && this.player)) {
        return;
      }
      switch (e.which) {
        case 32:
          return this.ws.send(net.START_SHOOTING);
        case 37:
          return this.ws.send(net.START_TURNING_CCW);
        case 38:
          return this.ws.send(net.START_ACCELERATING);
        case 39:
          return this.ws.send(net.START_TURNING_CW);
        case 40:
          return this.ws.send(net.START_BRAKING);
        case 84:
          return this.openChat();
        case 82:
          return this.openChat({
            team: true
          });
      }
    };
    BoloClientWorld.prototype.handleKeyup = function(e) {
      if (!(this.ws && this.player)) {
        return;
      }
      switch (e.which) {
        case 32:
          return this.ws.send(net.STOP_SHOOTING);
        case 37:
          return this.ws.send(net.STOP_TURNING_CCW);
        case 38:
          return this.ws.send(net.STOP_ACCELERATING);
        case 39:
          return this.ws.send(net.STOP_TURNING_CW);
        case 40:
          return this.ws.send(net.STOP_BRAKING);
      }
    };
    BoloClientWorld.prototype.handleChatKeydown = function(e) {
      if (!(this.ws && this.player)) {
        return;
      }
      switch (e.which) {
        case 13:
          this.commitChat();
          break;
        case 27:
          this.closeChat();
          break;
        default:
          return;
      }
      return e.preventDefault();
    };
    BoloClientWorld.prototype.buildOrder = function(action, trees, cell) {
      if (!(this.ws && this.player)) {
        return;
      }
      trees || (trees = 0);
      return this.ws.send([net.BUILD_ORDER, action, trees, cell.x, cell.y].join(','));
    };
    BoloClientWorld.prototype.handleMessage = function(e) {
      var ate, command, data, error, length, message, pos, _i, _len, _ref;
      error = null;
      if (e.data.charAt(0) === '{') {
        try {
          this.handleJsonCommand(JSON.parse(e.data));
        } catch (e) {
          error = e;
        }
      } else if (e.data.charAt(0) === '[') {
        try {
          _ref = JSON.parse(e.data);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            message = _ref[_i];
            this.handleJsonCommand(message);
          }
        } catch (e) {
          error = e;
        }
      } else {
        this.netRestore();
        try {
          data = decodeBase64(e.data);
          pos = 0;
          length = data.length;
          this.processingServerMessages = true;
          while (pos < length) {
            command = data[pos++];
            ate = this.handleBinaryCommand(command, data, pos);
            pos += ate;
          }
          this.processingServerMessages = false;
          if (pos !== length) {
            error = new Error("Message length mismatch, processed " + pos + " out of " + length + " bytes");
          }
        } catch (e) {
          error = e;
        }
      }
      if (error) {
        this.failure('Connection lost (protocol error)');
        if (typeof console != "undefined" && console !== null) {
          console.log("Following exception occurred while processing message:", e.data);
        }
        throw error;
      }
    };
    BoloClientWorld.prototype.handleBinaryCommand = function(command, data, offset) {
      var ascii, bytes, cell, code, idx, life, mine, owner, sfx, tank_idx, x, y, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
      switch (command) {
        case net.SYNC_MESSAGE:
          this.synchronized();
          return 0;
          break;
        case net.WELCOME_MESSAGE:
          _ref = unpack('H', data, offset), tank_idx = _ref[0][0], bytes = _ref[1];
          this.receiveWelcome(this.objects[tank_idx]);
          return bytes;
          break;
        case net.CREATE_MESSAGE:
          return this.netSpawn(data, offset);
        case net.DESTROY_MESSAGE:
          return this.netDestroy(data, offset);
        case net.MAPCHANGE_MESSAGE:
          _ref2 = unpack('BBBBf', data, offset), _ref3 = _ref2[0], x = _ref3[0], y = _ref3[1], code = _ref3[2], life = _ref3[3], mine = _ref3[4], bytes = _ref2[1];
          ascii = String.fromCharCode(code);
          cell = this.map.cells[y][x];
          cell.setType(ascii, mine);
          cell.life = life;
          return bytes;
          break;
        case net.SOUNDEFFECT_MESSAGE:
          _ref4 = unpack('BHHH', data, offset), _ref5 = _ref4[0], sfx = _ref5[0], x = _ref5[1], y = _ref5[2], owner = _ref5[3], bytes = _ref4[1];
          this.renderer.playSound(sfx, x, y, this.objects[owner]);
          return bytes;
          break;
        case net.TINY_UPDATE_MESSAGE:
          _ref6 = unpack('H', data, offset), idx = _ref6[0][0], bytes = _ref6[1];
          bytes += this.netUpdate(this.objects[idx], data, offset + bytes);
          return bytes;
          break;
        case net.UPDATE_MESSAGE:
          return this.netTick(data, offset);
        default:
          throw new Error("Bad command '" + command + "' from server, at offset " + (offset - 1));
      }
    };
    BoloClientWorld.prototype.handleJsonCommand = function(data) {
      switch (data.command) {
        case 'nick':
          return this.objects[data.idx].name = data.nick;
        case 'msg':
          return this.receiveChat(this.objects[data.idx], data.text);
        case 'teamMsg':
          return this.receiveChat(this.objects[data.idx], data.text, {
            team: true
          });
        default:
          throw new Error("Bad JSON command '" + data.command + "' from server.");
      }
    };
    BoloClientWorld.prototype.rebuildMapObjects = function() {
      var obj, _i, _len, _ref, _ref2;
      this.map.pills = [];
      this.map.bases = [];
      _ref = this.objects;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if (obj instanceof WorldPillbox) {
          this.map.pills.push(obj);
        } else if (obj instanceof WorldBase) {
          this.map.bases.push(obj);
        } else {
          continue;
        }
        if ((_ref2 = obj.cell) != null) {
          _ref2.retile();
        }
      }
      return;
    };
    BoloClientWorld.prototype.netRestore = function() {
      var cell, idx, _ref;
      BoloClientWorld.__super__.netRestore.apply(this, arguments);
      _ref = this.mapChanges;
      for (idx in _ref) {
        if (!__hasProp.call(_ref, idx)) continue;
        cell = _ref[idx];
        cell.setType(cell._net_oldType, cell._net_hadMine);
        cell.life = cell._net_oldLife;
      }
      return this.mapChanges = {};
    };
    return BoloClientWorld;
  }();
  helpers.extend(BoloClientWorld.prototype, require('./mixin'));
  allObjects.registerWithWorld(BoloClientWorld.prototype);
  module.exports = BoloClientWorld;
}).call(this);
