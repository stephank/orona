(function() {
  var BoloLocalWorld, EverardIsland, NetLocalWorld, Tank, WorldMap, allObjects, decodeBase64, helpers;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  NetLocalWorld = require('villain/world/net/local');
  WorldMap = require('../../world_map');
  EverardIsland = require('../everard');
  allObjects = require('../../objects/all');
  Tank = require('../../objects/tank');
  decodeBase64 = require('../base64').decodeBase64;
  helpers = require('../../helpers');
  BoloLocalWorld = function() {
    function BoloLocalWorld() {
      BoloLocalWorld.__super__.constructor.apply(this, arguments);
    }
    __extends(BoloLocalWorld, NetLocalWorld);
    BoloLocalWorld.prototype.authority = true;
    BoloLocalWorld.prototype.loaded = function(vignette) {
      this.map = WorldMap.load(decodeBase64(EverardIsland));
      this.commonInitialization();
      this.spawnMapObjects();
      this.player = this.spawn(Tank, 0);
      this.renderer.initHud();
      vignette.destroy();
      return this.loop.start();
    };
    BoloLocalWorld.prototype.tick = function() {
      BoloLocalWorld.__super__.tick.apply(this, arguments);
      if (this.increasingRange !== this.decreasingRange) {
        if (++this.rangeAdjustTimer === 6) {
          if (this.increasingRange) {
            this.player.increaseRange();
          } else {
            this.player.decreaseRange();
          }
          return this.rangeAdjustTimer = 0;
        }
      } else {
        return this.rangeAdjustTimer = 0;
      }
    };
    BoloLocalWorld.prototype.soundEffect = function(sfx, x, y, owner) {
      return this.renderer.playSound(sfx, x, y, owner);
    };
    BoloLocalWorld.prototype.mapChanged = function(cell, oldType, hadMine, oldLife) {};
    BoloLocalWorld.prototype.handleKeydown = function(e) {
      switch (e.which) {
        case 32:
          return this.player.shooting = true;
        case 37:
          return this.player.turningCounterClockwise = true;
        case 38:
          return this.player.accelerating = true;
        case 39:
          return this.player.turningClockwise = true;
        case 40:
          return this.player.braking = true;
      }
    };
    BoloLocalWorld.prototype.handleKeyup = function(e) {
      switch (e.which) {
        case 32:
          return this.player.shooting = false;
        case 37:
          return this.player.turningCounterClockwise = false;
        case 38:
          return this.player.accelerating = false;
        case 39:
          return this.player.turningClockwise = false;
        case 40:
          return this.player.braking = false;
      }
    };
    BoloLocalWorld.prototype.buildOrder = function(action, trees, cell) {
      return this.player.builder.$.performOrder(action, trees, cell);
    };
    return BoloLocalWorld;
  }();
  helpers.extend(BoloLocalWorld.prototype, require('./mixin'));
  allObjects.registerWithWorld(BoloLocalWorld.prototype);
  module.exports = BoloLocalWorld;
}).call(this);
