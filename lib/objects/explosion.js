(function() {
  var BoloObject, Explosion, floor;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  floor = Math.floor;
  BoloObject = require('../object');
  Explosion = function() {
    function Explosion() {
      Explosion.__super__.constructor.apply(this, arguments);
    }
    __extends(Explosion, BoloObject);
    Explosion.prototype.styled = false;
    Explosion.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('H', 'x');
        p('H', 'y');
      }
      return p('B', 'lifespan');
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
    Explosion.prototype.spawn = function(x, y) {
      this.x = x;
      this.y = y;
      return this.lifespan = 23;
    };
    Explosion.prototype.update = function() {
      if (this.lifespan-- === 0) {
        return this.world.destroy(this);
      }
    };
    return Explosion;
  }();
  module.exports = Explosion;
}).call(this);
