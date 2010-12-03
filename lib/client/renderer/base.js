(function() {
  var BaseRenderer, MAP_SIZE_PIXELS, PI, PIXEL_SIZE_WORLD, TEAM_COLORS, TILE_SIZE_PIXELS, TILE_SIZE_WORLD, cos, max, min, round, sin, sounds, sqrt, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty;
  min = Math.min, max = Math.max, round = Math.round, cos = Math.cos, sin = Math.sin, PI = Math.PI, sqrt = Math.sqrt;
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, TILE_SIZE_WORLD = _ref.TILE_SIZE_WORLD, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD, MAP_SIZE_PIXELS = _ref.MAP_SIZE_PIXELS;
  sounds = require('../../sounds');
  TEAM_COLORS = require('../../team_colors');
  BaseRenderer = function() {
    function BaseRenderer(world) {
      this.world = world;
      this.images = this.world.images;
      this.soundkit = this.world.soundkit;
      this.canvas = $('<canvas/>').appendTo('body');
      this.lastCenter = this.world.map.findCenterCell().getWorldCoordinates();
      this.mouse = [0, 0];
      this.canvas.click(__bind(function(e) {
        return this.handleClick(e);
      }, this));
      this.canvas.mousemove(__bind(function(e) {
        return this.mouse = [e.pageX, e.pageY];
      }, this));
      this.setup();
      this.handleResize();
      $(window).resize(__bind(function() {
        return this.handleResize();
      }, this));
    }
    BaseRenderer.prototype.setup = function() {};
    BaseRenderer.prototype.centerOn = function(x, y, cb) {};
    BaseRenderer.prototype.drawTile = function(tx, ty, sdx, sdy) {};
    BaseRenderer.prototype.drawStyledTile = function(tx, ty, style, sdx, sdy) {};
    BaseRenderer.prototype.drawMap = function(sx, sy, w, h) {};
    BaseRenderer.prototype.drawBuilderIndicator = function(builder) {};
    BaseRenderer.prototype.onRetile = function(cell, tx, ty) {};
    BaseRenderer.prototype.draw = function() {
      var x, y, _ref, _ref2, _ref3;
      if (this.world.player) {
        _ref = this.world.player, x = _ref.x, y = _ref.y;
        if (this.world.player.fireball != null) {
          _ref2 = this.world.player.fireball.$, x = _ref2.x, y = _ref2.y;
        }
      } else {
        x = y = null;
      }
      if (!((x != null) && (y != null))) {
        _ref3 = this.lastCenter, x = _ref3[0], y = _ref3[1];
      } else {
        this.lastCenter = [x, y];
      }
      this.centerOn(x, y, __bind(function(left, top, width, height) {
        var obj, ox, oy, tx, ty, _i, _len, _ref, _ref2;
        this.drawMap(left, top, width, height);
        _ref = this.world.objects;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          obj = _ref[_i];
          if ((obj.styled != null) && (obj.x != null) && (obj.y != null)) {
            _ref2 = obj.getTile(), tx = _ref2[0], ty = _ref2[1];
            ox = round(obj.x / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2;
            oy = round(obj.y / PIXEL_SIZE_WORLD) - TILE_SIZE_PIXELS / 2;
            switch (obj.styled) {
              case true:
                this.drawStyledTile(tx, ty, obj.team, ox, oy);
                break;
              case false:
                this.drawTile(tx, ty, ox, oy);
            }
          }
        }
        return this.drawOverlay();
      }, this));
      if (this.hud) {
        return this.updateHud();
      }
    };
    BaseRenderer.prototype.playSound = function(sfx, x, y, owner) {
      var dist, dx, dy, mode, name;
      mode = this.world.player && owner === this.world.player ? 'Self' : (dx = x - this.lastCenter[0], dy = y - this.lastCenter[1], dist = sqrt(dx * dx + dy * dy), dist > 40 * TILE_SIZE_WORLD ? 'None' : dist > 15 * TILE_SIZE_WORLD ? 'Far' : 'Near');
      if (mode === 'None') {
        return;
      }
      name = function() {
        switch (sfx) {
          case sounds.BIG_EXPLOSION:
            return "bigExplosion" + mode;
            break;
          case sounds.BUBBLES:
            if (mode === 'Self') {
              return "bubbles";
            }
            break;
          case sounds.FARMING_TREE:
            return "farmingTree" + mode;
            break;
          case sounds.HIT_TANK:
            return "hitTank" + mode;
            break;
          case sounds.MAN_BUILDING:
            return "manBuilding" + mode;
            break;
          case sounds.MAN_DYING:
            return "manDying" + mode;
            break;
          case sounds.MAN_LAY_MINE:
            if (mode === 'Near') {
              return "manLayMineNear";
            }
            break;
          case sounds.MINE_EXPLOSION:
            return "mineExplosion" + mode;
            break;
          case sounds.SHOOTING:
            return "shooting" + mode;
            break;
          case sounds.SHOT_BUILDING:
            return "shotBuilding" + mode;
            break;
          case sounds.SHOT_TREE:
            return "shotTree" + mode;
            break;
          case sounds.TANK_SINKING:
            return "tankSinking" + mode;
        }
      }();
      if (name) {
        return this.soundkit[name]();
      }
    };
    BaseRenderer.prototype.handleResize = function() {
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
    BaseRenderer.prototype.handleClick = function(e) {
      var action, cell, flexible, mx, my, trees, _ref, _ref2;
      e.preventDefault();
      this.world.input.focus();
      if (!this.currentTool) {
        return;
      }
      _ref = this.mouse, mx = _ref[0], my = _ref[1];
      cell = this.getCellAtScreen(mx, my);
      _ref2 = this.world.checkBuildOrder(this.currentTool, cell), action = _ref2[0], trees = _ref2[1], flexible = _ref2[2];
      if (action) {
        return this.world.buildOrder(action, trees, cell);
      }
    };
    BaseRenderer.prototype.getViewAreaAtWorld = function(x, y) {
      var height, left, top, width, _ref;
      _ref = this.canvas[0], width = _ref.width, height = _ref.height;
      left = round(x / PIXEL_SIZE_WORLD - width / 2);
      left = max(0, min(MAP_SIZE_PIXELS - width, left));
      top = round(y / PIXEL_SIZE_WORLD - height / 2);
      top = max(0, min(MAP_SIZE_PIXELS - height, top));
      return [left, top, width, height];
    };
    BaseRenderer.prototype.getCellAtScreen = function(x, y) {
      var cameraX, cameraY, height, left, top, width, _ref, _ref2;
      _ref = this.lastCenter, cameraX = _ref[0], cameraY = _ref[1];
      _ref2 = this.getViewAreaAtWorld(cameraX, cameraY), left = _ref2[0], top = _ref2[1], width = _ref2[2], height = _ref2[3];
      return this.world.map.cellAtPixel(left + x, top + y);
    };
    BaseRenderer.prototype.drawOverlay = function() {
      var b, player;
      if ((player = this.world.player) && player.armour !== 255) {
        b = player.builder.$;
        if (!(b.order === b.states.inTank || b.order === b.states.parachuting)) {
          this.drawBuilderIndicator(b);
        }
        this.drawReticle();
      }
      this.drawNames();
      return this.drawCursor();
    };
    BaseRenderer.prototype.drawReticle = function() {
      var distance, rad, x, y;
      distance = this.world.player.firingRange * TILE_SIZE_PIXELS;
      rad = (256 - this.world.player.direction) * 2 * PI / 256;
      x = round(this.world.player.x / PIXEL_SIZE_WORLD + cos(rad) * distance) - TILE_SIZE_PIXELS / 2;
      y = round(this.world.player.y / PIXEL_SIZE_WORLD + sin(rad) * distance) - TILE_SIZE_PIXELS / 2;
      return this.drawTile(17, 4, x, y);
    };
    BaseRenderer.prototype.drawCursor = function() {
      var cell, mx, my, _ref;
      _ref = this.mouse, mx = _ref[0], my = _ref[1];
      cell = this.getCellAtScreen(mx, my);
      return this.drawTile(18, 6, cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS);
    };
    BaseRenderer.prototype.initHud = function() {
      this.hud = $('<div/>').appendTo('body');
      this.initHudTankStatus();
      this.initHudPillboxes();
      this.initHudBases();
      this.initHudToolSelect();
      this.initHudNotices();
      return this.updateHud();
    };
    BaseRenderer.prototype.initHudTankStatus = function() {
      var bar, container, indicator, _i, _len, _ref;
      container = $('<div/>', {
        id: 'tankStatus'
      }).appendTo(this.hud);
      $('<div/>', {
        "class": 'deco'
      }).appendTo(container);
      this.tankIndicators = {};
      _ref = ['shells', 'mines', 'armour', 'trees'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        indicator = _ref[_i];
        bar = $('<div/>', {
          "class": 'gauge',
          id: "tank-" + indicator
        }).appendTo(container);
        this.tankIndicators[indicator] = $('<div class="gauge-content"></div>').appendTo(bar);
      }
      return;
    };
    BaseRenderer.prototype.initHudPillboxes = function() {
      var container, node, pill, _i, _len, _ref, _results;
      container = $('<div/>', {
        id: 'pillStatus'
      }).appendTo(this.hud);
      $('<div/>', {
        "class": 'deco'
      }).appendTo(container);
      this.pillIndicators = function() {
        _ref = this.world.map.pills;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pill = _ref[_i];
          node = $('<div/>', {
            "class": 'pill'
          }).appendTo(container);
          _results.push([node, pill]);
        }
        return _results;
      }.call(this);
      return;
    };
    BaseRenderer.prototype.initHudBases = function() {
      var base, container, node, _i, _len, _ref, _results;
      container = $('<div/>', {
        id: 'baseStatus'
      }).appendTo(this.hud);
      $('<div/>', {
        "class": 'deco'
      }).appendTo(container);
      this.baseIndicators = function() {
        _ref = this.world.map.bases;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          base = _ref[_i];
          node = $('<div/>', {
            "class": 'base'
          }).appendTo(container);
          _results.push([node, base]);
        }
        return _results;
      }.call(this);
      return;
    };
    BaseRenderer.prototype.initHudToolSelect = function() {
      var tools, _fn, _i, _len, _ref;
      this.currentTool = null;
      tools = $('<div id="tool-select" />').appendTo(this.hud);
      _ref = ['forest', 'road', 'building', 'pillbox', 'mine'];
      _fn = function(toolType) {
        var label, tool, toolname;
        toolname = "tool-" + toolType;
        tool = $('<input/>', {
          type: 'radio',
          name: 'tool',
          id: toolname
        }).appendTo(tools);
        label = $('<label/>', {
          "for": toolname
        }).appendTo(tools);
        label.append($('<span/>', {
          "class": "bolo-tool bolo-" + toolname
        }));
        return tool.click(__bind(function(e) {
          if (this.currentTool === toolType) {
            this.currentTool = null;
            tools.find('input').removeAttr('checked');
            tools.buttonset('refresh');
          } else {
            this.currentTool = toolType;
          }
          return this.world.input.focus();
        }, this));
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        toolType = _ref[_i];
        _fn.call(this, toolType);
      }
      return tools.buttonset();
    };
    BaseRenderer.prototype.initHudNotices = function() {
      if (location.hostname.split('.')[1] === 'github') {
        $('<div/>').html('This is a work-in-progress; less than alpha quality!<br>\nTo see multiplayer in action, follow instructions on Github.').css({
          'position': 'absolute',
          'top': '70px',
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
        return $('<a href="http://github.com/stephank/orona"></a>').css({
          'position': 'absolute',
          'top': '0px',
          'right': '0px'
        }).html('<img src="http://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub">').appendTo(this.hud);
      }
    };
    BaseRenderer.prototype.updateHud = function() {
      var base, color, node, p, pill, prop, statuskey, value, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5, _results;
      _ref = this.pillIndicators;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], node = _ref2[0], pill = _ref2[1];
        statuskey = "" + pill.inTank + ";" + pill.carried + ";" + pill.armour + ";" + pill.team;
        if (pill.hudStatusKey === statuskey) {
          continue;
        }
        pill.hudStatusKey = statuskey;
        if (pill.inTank || pill.carried) {
          node.attr('status', 'carried');
        } else if (pill.armour === 0) {
          node.attr('status', 'dead');
        } else {
          node.attr('status', 'healthy');
        }
        color = TEAM_COLORS[pill.team] || {
          r: 112,
          g: 112,
          b: 112
        };
        node.css({
          'background-color': "rgb(" + color.r + "," + color.g + "," + color.b + ")"
        });
      }
      _ref3 = this.baseIndicators;
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        _ref4 = _ref3[_j], node = _ref4[0], base = _ref4[1];
        statuskey = "" + base.armour + ";" + base.team;
        if (base.hudStatusKey === statuskey) {
          continue;
        }
        base.hudStatusKey = statuskey;
        if (base.armour <= 9) {
          node.attr('status', 'vulnerable');
        } else {
          node.attr('status', 'healthy');
        }
        color = TEAM_COLORS[base.team] || {
          r: 112,
          g: 112,
          b: 112
        };
        node.css({
          'background-color': "rgb(" + color.r + "," + color.g + "," + color.b + ")"
        });
      }
      p = this.world.player;
      p.hudLastStatus || (p.hudLastStatus = {});
      _ref5 = this.tankIndicators;
      _results = [];
      for (prop in _ref5) {
        if (!__hasProp.call(_ref5, prop)) continue;
        node = _ref5[prop];
        value = p.armour === 255 ? 0 : p[prop];
        if (p.hudLastStatus[prop] === value) {
          continue;
        }
        p.hudLastStatus[prop] = value;
        _results.push(node.css({
          height: "" + (round(value / 40 * 100)) + "%"
        }));
      }
      return _results;
    };
    return BaseRenderer;
  }();
  module.exports = BaseRenderer;
}).call(this);
