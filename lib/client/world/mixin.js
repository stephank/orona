(function() {
  var BoloClientWorldMixin, BoloWorldMixin, DefaultRenderer, Loop, Progress, SoundKit, TICK_LENGTH_MS, Vignette, helpers;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Loop = require('villain/loop');
  Progress = require('../progress');
  Vignette = require('../vignette');
  SoundKit = require('../soundkit');
  DefaultRenderer = require('../renderer/offscreen_2d');
  TICK_LENGTH_MS = require('../../constants').TICK_LENGTH_MS;
  helpers = require('../../helpers');
  BoloWorldMixin = require('../../world_mixin');
  BoloClientWorldMixin = {
    start: function() {
      var vignette;
      vignette = new Vignette();
      return this.waitForCache(vignette, __bind(function() {
        return this.loadResources(vignette, __bind(function() {
          return this.loaded(vignette);
        }, this));
      }, this));
    },
    waitForCache: function(vignette, callback) {
      var afterCache, cache;
      if (typeof applicationCache == "undefined" || applicationCache === null) {
        return callback();
      }
      vignette.message('Checking for newer versions');
      cache = $(applicationCache);
      cache.bind('downloading.bolo', function() {
        vignette.message('Downloading latest version');
        vignette.showProgress();
        return cache.bind('progress.bolo', function(p) {
          return vignette.progress(p);
        });
      });
      cache.bind('updateready.bolo', function() {
        vignette.hideProgress();
        vignette.message('Reloading latest version');
        return location.reload();
      });
      afterCache = function() {
        vignette.hideProgress();
        cache.unbind('.bolo');
        return callback();
      };
      cache.bind('cached.bolo', afterCache);
      return cache.bind('noupdate.bolo', afterCache);
    },
    loadResources: function(vignette, callback) {
      var progress;
      vignette.message('Loading resources');
      progress = new Progress();
      this.images = {};
      this.loadImages(__bind(function(name) {
        var img;
        this.images[name] = img = new Image();
        $(img).load(progress.add());
        return img.src = "images/" + name + ".png";
      }, this));
      this.soundkit = new SoundKit();
      this.loadSounds(__bind(function(name) {
        var i, methodName, parts, src, _ref;
        src = "sounds/" + name + ".ogg";
        parts = name.split('_');
        for (i = 1, _ref = parts.length; (1 <= _ref ? i < _ref : i > _ref); (1 <= _ref ? i += 1 : i -= 1)) {
          parts[i] = parts[i].substr(0, 1).toUpperCase() + parts[i].substr(1);
        }
        methodName = parts.join('');
        return this.soundkit.load(methodName, src, progress.add());
      }, this));
      if (typeof applicationCache == "undefined" || applicationCache === null) {
        vignette.showProgress();
        progress.on('progress', function(p) {
          return vignette.progress(p);
        });
      }
      progress.on('complete', function() {
        vignette.hideProgress();
        return callback();
      });
      return progress.wrapUp();
    },
    loadImages: function(i) {
      i('base');
      i('styled');
      return i('overlay');
    },
    loadSounds: function(s) {
      s('big_explosion_far');
      s('big_explosion_near');
      s('bubbles');
      s('farming_tree_far');
      s('farming_tree_near');
      s('hit_tank_far');
      s('hit_tank_near');
      s('hit_tank_self');
      s('man_building_far');
      s('man_building_near');
      s('man_dying_far');
      s('man_dying_near');
      s('man_lay_mine_near');
      s('mine_explosion_far');
      s('mine_explosion_near');
      s('shooting_far');
      s('shooting_near');
      s('shooting_self');
      s('shot_building_far');
      s('shot_building_near');
      s('shot_tree_far');
      s('shot_tree_near');
      s('tank_sinking_far');
      return s('tank_sinking_near');
    },
    commonInitialization: function() {
      this.renderer = new DefaultRenderer(this);
      this.map.world = this;
      this.map.setView(this.renderer);
      this.boloInit();
      this.loop = new Loop(this);
      this.loop.tickRate = TICK_LENGTH_MS;
      this.increasingRange = false;
      this.decreasingRange = false;
      this.rangeAdjustTimer = 0;
      this.input = $('<input/>', {
        id: 'input-dummy',
        type: 'text',
        autocomplete: 'off'
      });
      this.input.insertBefore(this.renderer.canvas).focus();
      return this.input.add(this.renderer.canvas).add('#tool-select label').keydown(__bind(function(e) {
        e.preventDefault();
        switch (e.which) {
          case 90:
            return this.increasingRange = true;
          case 88:
            return this.decreasingRange = true;
          default:
            return this.handleKeydown(e);
        }
      }, this)).keyup(__bind(function(e) {
        e.preventDefault();
        switch (e.which) {
          case 90:
            return this.increasingRange = false;
          case 88:
            return this.decreasingRange = false;
          default:
            return this.handleKeyup(e);
        }
      }, this));
    },
    idle: function() {
      return this.renderer.draw();
    },
    failure: function(message) {
      var _ref;
      if ((_ref = this.loop) != null) {
        _ref.stop();
      }
      return $('<div/>').text(message).dialog({
        modal: true,
        dialogClass: 'unclosable'
      });
    },
    checkBuildOrder: function(action, cell) {
      var builder, flexible, pills, trees, _ref;
      builder = this.player.builder.$;
      if (builder.order !== builder.states.inTank) {
        return [false];
      }
      if (cell.mine) {
        return [false];
      }
      _ref = function() {
        switch (action) {
          case 'forest':
            if (cell.base || cell.pill || !cell.isType('#')) {
              return [false];
            } else {
              return ['forest', 0];
            }
            break;
          case 'road':
            if (cell.base || cell.pill || cell.isType('|', '}', 'b', '^')) {
              return [false];
            } else if (cell.isType('#')) {
              return ['forest', 0];
            } else if (cell.isType('=')) {
              return [false];
            } else if (cell.isType(' ') && cell.hasTankOnBoat()) {
              return [false];
            } else {
              return ['road', 2];
            }
            break;
          case 'building':
            if (cell.base || cell.pill || cell.isType('b', '^')) {
              return [false];
            } else if (cell.isType('#')) {
              return ['forest', 0];
            } else if (cell.isType('}')) {
              return ['repair', 1];
            } else if (cell.isType('|')) {
              return [false];
            } else if (cell.isType(' ')) {
              if (cell.hasTankOnBoat()) {
                return [false];
              } else {
                return ['boat', 20];
              }
            } else if (cell === this.player.cell) {
              return [false];
            } else {
              return ['building', 2];
            }
            break;
          case 'pillbox':
            if (cell.pill) {
              if (cell.pill.armour === 16) {
                return [false];
              } else if (cell.pill.armour >= 11) {
                return ['repair', 1, true];
              } else if (cell.pill.armour >= 7) {
                return ['repair', 2, true];
              } else if (cell.pill.armour >= 3) {
                return ['repair', 3, true];
              } else if (cell.pill.armour < 3) {
                return ['repair', 4, true];
              }
            } else if (cell.isType('#')) {
              return ['forest', 0];
            } else if (cell.base || cell.isType('b', '^', '|', '}', ' ')) {
              return [false];
            } else if (cell === this.player.cell) {
              return [false];
            } else {
              return ['pillbox', 4];
            }
            break;
          case 'mine':
            if (cell.base || cell.pill || cell.isType('^', ' ', '|', 'b', '}')) {
              return [false];
            } else {
              return ['mine'];
            }
        }
      }.call(this), action = _ref[0], trees = _ref[1], flexible = _ref[2];
      if (!action) {
        return [false];
      }
      if (action === 'mine') {
        if (this.player.mines === 0) {
          return [false];
        }
        return ['mine'];
      }
      if (action === 'pill') {
        pills = this.player.getCarryingPillboxes();
        if (pills.length === 0) {
          return [false];
        }
      }
      if (this.player.trees < trees) {
        if (!flexible) {
          return [false];
        }
        trees = this.player.trees;
      }
      return [action, trees, flexible];
    }
  };
  helpers.extend(BoloClientWorldMixin, BoloWorldMixin);
  module.exports = BoloClientWorldMixin;
}).call(this);
