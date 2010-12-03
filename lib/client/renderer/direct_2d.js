(function() {
  var Common2dRenderer, Direct2dRenderer, TILE_SIZE_PIXELS, ceil, floor;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  floor = Math.floor, ceil = Math.ceil;
  TILE_SIZE_PIXELS = require('../../constants').TILE_SIZE_PIXELS;
  Common2dRenderer = require('./common_2d');
  Direct2dRenderer = function() {
    function Direct2dRenderer() {
      Direct2dRenderer.__super__.constructor.apply(this, arguments);
    }
    __extends(Direct2dRenderer, Common2dRenderer);
    Direct2dRenderer.prototype.onRetile = function(cell, tx, ty) {
      return cell.tile = [tx, ty];
    };
    Direct2dRenderer.prototype.drawMap = function(sx, sy, w, h) {
      var etx, ety, ex, ey, stx, sty;
      ex = sx + w - 1;
      ey = sy + h - 1;
      stx = floor(sx / TILE_SIZE_PIXELS);
      sty = floor(sy / TILE_SIZE_PIXELS);
      etx = ceil(ex / TILE_SIZE_PIXELS);
      ety = ceil(ey / TILE_SIZE_PIXELS);
      return this.world.map.each(__bind(function(cell) {
        var obj, _ref;
        if (obj = cell.pill || cell.base) {
          return this.drawStyledTile(cell.tile[0], cell.tile[1], (_ref = obj.owner) != null ? _ref.$.team : void 0, cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS);
        } else {
          return this.drawTile(cell.tile[0], cell.tile[1], cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS);
        }
      }, this), stx, sty, etx, ety);
    };
    return Direct2dRenderer;
  }();
  module.exports = Direct2dRenderer;
}).call(this);
