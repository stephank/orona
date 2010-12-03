(function() {
  var CachedSegment, Common2dRenderer, MAP_SIZE_SEGMENTS, MAP_SIZE_TILES, Offscreen2dRenderer, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_TILES, TILE_SIZE_PIXELS, floor, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  floor = Math.floor;
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, MAP_SIZE_TILES = _ref.MAP_SIZE_TILES;
  Common2dRenderer = require('./common_2d');
  SEGMENT_SIZE_TILES = 16;
  MAP_SIZE_SEGMENTS = MAP_SIZE_TILES / SEGMENT_SIZE_TILES;
  SEGMENT_SIZE_PIXEL = SEGMENT_SIZE_TILES * TILE_SIZE_PIXELS;
  CachedSegment = function() {
    function CachedSegment(renderer, x, y) {
      this.renderer = renderer;
      this.sx = x * SEGMENT_SIZE_TILES;
      this.sy = y * SEGMENT_SIZE_TILES;
      this.ex = this.sx + SEGMENT_SIZE_TILES - 1;
      this.ey = this.sy + SEGMENT_SIZE_TILES - 1;
      this.psx = x * SEGMENT_SIZE_PIXEL;
      this.psy = y * SEGMENT_SIZE_PIXEL;
      this.pex = this.psx + SEGMENT_SIZE_PIXEL - 1;
      this.pey = this.psy + SEGMENT_SIZE_PIXEL - 1;
      this.canvas = null;
    }
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
      this.canvas.width = this.canvas.height = SEGMENT_SIZE_PIXEL;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.translate(-this.psx, -this.psy);
      return this.renderer.world.map.each(__bind(function(cell) {
        return this.onRetile(cell, cell.tile[0], cell.tile[1]);
      }, this), this.sx, this.sy, this.ex, this.ey);
    };
    CachedSegment.prototype.clear = function() {
      return this.canvas = this.ctx = null;
    };
    CachedSegment.prototype.onRetile = function(cell, tx, ty) {
      var obj, _ref;
      if (!this.canvas) {
        return;
      }
      if (obj = cell.pill || cell.base) {
        return this.renderer.drawStyledTile(cell.tile[0], cell.tile[1], (_ref = obj.owner) != null ? _ref.$.team : void 0, cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, this.ctx);
      } else {
        return this.renderer.drawTile(cell.tile[0], cell.tile[1], cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS, this.ctx);
      }
    };
    return CachedSegment;
  }();
  Offscreen2dRenderer = function() {
    function Offscreen2dRenderer() {
      Offscreen2dRenderer.__super__.constructor.apply(this, arguments);
    }
    __extends(Offscreen2dRenderer, Common2dRenderer);
    Offscreen2dRenderer.prototype.setup = function() {
      var row, x, y, _results, _results2;
      Offscreen2dRenderer.__super__.setup.apply(this, arguments);
      this.cache = new Array(MAP_SIZE_SEGMENTS);
      _results = [];
      for (y = 0; (0 <= MAP_SIZE_SEGMENTS ? y < MAP_SIZE_SEGMENTS : y > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? y += 1 : y -= 1)) {
        row = this.cache[y] = new Array(MAP_SIZE_SEGMENTS);
        _results.push(function() {
          _results2 = [];
          for (x = 0; (0 <= MAP_SIZE_SEGMENTS ? x < MAP_SIZE_SEGMENTS : x > MAP_SIZE_SEGMENTS); (0 <= MAP_SIZE_SEGMENTS ? x += 1 : x -= 1)) {
            _results2.push(row[x] = new CachedSegment(this, x, y));
          }
          return _results2;
        }.call(this));
      }
      return _results;
    };
    Offscreen2dRenderer.prototype.onRetile = function(cell, tx, ty) {
      var segx, segy;
      cell.tile = [tx, ty];
      segx = floor(cell.x / SEGMENT_SIZE_TILES);
      segy = floor(cell.y / SEGMENT_SIZE_TILES);
      return this.cache[segy][segx].onRetile(cell, tx, ty);
    };
    Offscreen2dRenderer.prototype.drawMap = function(sx, sy, w, h) {
      var alreadyBuiltOne, ex, ey, row, segment, _i, _j, _len, _len2, _ref;
      ex = sx + w - 1;
      ey = sy + h - 1;
      alreadyBuiltOne = false;
      _ref = this.cache;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
          segment = row[_j];
          if (!segment.isInView(sx, sy, ex, ey)) {
            if (segment.canvas) {
              segment.clear();
            }
            continue;
          }
          if (!segment.canvas) {
            if (alreadyBuiltOne) {
              continue;
            }
            segment.build();
            alreadyBuiltOne = true;
          }
          this.ctx.drawImage(segment.canvas, 0, 0, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL, segment.psx, segment.psy, SEGMENT_SIZE_PIXEL, SEGMENT_SIZE_PIXEL);
        }
      }
      return;
    };
    return Offscreen2dRenderer;
  }();
  module.exports = Offscreen2dRenderer;
}).call(this);
