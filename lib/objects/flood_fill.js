(function() {
  var BoloObject, FloodFill;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  BoloObject = require('../object');
  FloodFill = function() {
    function FloodFill() {
      FloodFill.__super__.constructor.apply(this, arguments);
    }
    __extends(FloodFill, BoloObject);
    FloodFill.prototype.styled = null;
    FloodFill.prototype.serialization = function(isCreate, p) {
      if (isCreate) {
        p('H', 'x');
        p('H', 'y');
      }
      return p('B', 'lifespan');
    };
    FloodFill.prototype.spawn = function(cell) {
      var _ref;
      _ref = cell.getWorldCoordinates(), this.x = _ref[0], this.y = _ref[1];
      return this.lifespan = 16;
    };
    FloodFill.prototype.anySpawn = function() {
      this.cell = this.world.map.cellAtWorld(this.x, this.y);
      return this.neighbours = [this.cell.neigh(1, 0), this.cell.neigh(0, 1), this.cell.neigh(-1, 0), this.cell.neigh(0, -1)];
    };
    FloodFill.prototype.update = function() {
      if (this.lifespan-- === 0) {
        this.flood();
        return this.world.destroy(this);
      }
    };
    FloodFill.prototype.canGetWet = function() {
      var n, result, _i, _len, _ref;
      result = false;
      _ref = this.neighbours;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        n = _ref[_i];
        if (!(n.base || n.pill) && n.isType(' ', '^', 'b')) {
          result = true;
          break;
        }
      }
      return result;
    };
    FloodFill.prototype.flood = function() {
      if (this.canGetWet()) {
        this.cell.setType(' ', false);
        return this.spread();
      }
    };
    FloodFill.prototype.spread = function() {
      var n, _i, _len, _ref;
      _ref = this.neighbours;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        n = _ref[_i];
        if (!(n.base || n.pill) && n.isType('%')) {
          this.world.spawn(FloodFill, n);
        }
      }
      return;
    };
    return FloodFill;
  }();
  module.exports = FloodFill;
}).call(this);
