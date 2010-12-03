(function() {
  var BoloObject, NetWorldObject;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  NetWorldObject = require('villain/world/net/object');
  BoloObject = function() {
    function BoloObject() {
      BoloObject.__super__.constructor.apply(this, arguments);
    }
    __extends(BoloObject, NetWorldObject);
    BoloObject.prototype.styled = null;
    BoloObject.prototype.team = null;
    BoloObject.prototype.x = null;
    BoloObject.prototype.y = null;
    BoloObject.prototype.soundEffect = function(sfx) {
      return this.world.soundEffect(sfx, this.x, this.y, this);
    };
    BoloObject.prototype.getTile = function() {};
    return BoloObject;
  }();
  module.exports = BoloObject;
}).call(this);
