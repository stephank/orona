(function() {
  var BaseRenderer, Common2dRenderer, PI, PIXEL_SIZE_WORLD, TEAM_COLORS, TILE_SIZE_PIXELS, cos, distance, heading, min, round, sin, _ref, _ref2;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  min = Math.min, round = Math.round, PI = Math.PI, sin = Math.sin, cos = Math.cos;
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD;
  _ref2 = require('../../helpers'), distance = _ref2.distance, heading = _ref2.heading;
  BaseRenderer = require('./base');
  TEAM_COLORS = require('../../team_colors');
  Common2dRenderer = function() {
    function Common2dRenderer() {
      Common2dRenderer.__super__.constructor.apply(this, arguments);
    }
    __extends(Common2dRenderer, BaseRenderer);
    Common2dRenderer.prototype.setup = function() {
      var ctx, imageData, img, temp;
      try {
        this.ctx = this.canvas[0].getContext('2d');
        this.ctx.drawImage;
      } catch (e) {
        throw "Could not initialize 2D canvas: " + e.message;
      }
      img = this.images.overlay;
      temp = $('<canvas/>')[0];
      temp.width = img.width;
      temp.height = img.height;
      ctx = temp.getContext('2d');
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(img, 0, 0);
      imageData = ctx.getImageData(0, 0, img.width, img.height);
      this.overlay = imageData.data;
      return this.prestyled = {};
    };
    Common2dRenderer.prototype.drawTile = function(tx, ty, dx, dy, ctx) {
      return (ctx || this.ctx).drawImage(this.images.base, tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, dx, dy, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS);
    };
    Common2dRenderer.prototype.createPrestyled = function(color) {
      var base, ctx, data, factor, height, i, imageData, source, width, x, y;
      base = this.images.styled;
      width = base.width, height = base.height;
      source = $('<canvas/>')[0];
      source.width = width;
      source.height = height;
      ctx = source.getContext('2d');
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(base, 0, 0);
      imageData = ctx.getImageData(0, 0, width, height);
      data = imageData.data;
      for (x = 0; (0 <= width ? x < width : x > width); (0 <= width ? x += 1 : x -= 1)) {
        for (y = 0; (0 <= height ? y < height : y > height); (0 <= height ? y += 1 : y -= 1)) {
          i = 4 * (y * width + x);
          factor = this.overlay[i] / 255;
          data[i + 0] = round(factor * color.r + (1 - factor) * data[i + 0]);
          data[i + 1] = round(factor * color.g + (1 - factor) * data[i + 1]);
          data[i + 2] = round(factor * color.b + (1 - factor) * data[i + 2]);
          data[i + 3] = min(255, data[i + 3] + this.overlay[i]);
        }
      }
      ctx.putImageData(imageData, 0, 0);
      return source;
    };
    Common2dRenderer.prototype.drawStyledTile = function(tx, ty, style, dx, dy, ctx) {
      var color, source;
      if (!(source = this.prestyled[style])) {
        source = (color = TEAM_COLORS[style]) ? this.prestyled[style] = this.createPrestyled(color) : this.images.styled;
      }
      return (ctx || this.ctx).drawImage(source, tx * TILE_SIZE_PIXELS, ty * TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS, dx, dy, TILE_SIZE_PIXELS, TILE_SIZE_PIXELS);
    };
    Common2dRenderer.prototype.centerOn = function(x, y, cb) {
      var height, left, top, width, _ref;
      this.ctx.save();
      _ref = this.getViewAreaAtWorld(x, y), left = _ref[0], top = _ref[1], width = _ref[2], height = _ref[3];
      this.ctx.translate(-left, -top);
      cb(left, top, width, height);
      return this.ctx.restore();
    };
    Common2dRenderer.prototype.drawBuilderIndicator = function(b) {
      var dist, offset, player, px, py, rad, x, y;
      player = b.owner.$;
      if ((dist = distance(player, b)) <= 128) {
        return;
      }
      px = player.x / PIXEL_SIZE_WORLD;
      py = player.y / PIXEL_SIZE_WORLD;
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.globalAlpha = min(1.0, (dist - 128) / 1024);
      offset = min(50, dist / 10240 * 50) + 32;
      rad = heading(player, b);
      this.ctx.beginPath();
      this.ctx.moveTo(x = px + cos(rad) * offset, y = py + sin(rad) * offset);
      rad += PI;
      this.ctx.lineTo(x + cos(rad - 0.4) * 10, y + sin(rad - 0.4) * 10);
      this.ctx.lineTo(x + cos(rad + 0.4) * 10, y + sin(rad + 0.4) * 10);
      this.ctx.closePath();
      this.ctx.fillStyle = 'yellow';
      this.ctx.fill();
      return this.ctx.restore();
    };
    Common2dRenderer.prototype.drawNames = function() {
      var dist, metrics, player, tank, x, y, _i, _len, _ref;
      this.ctx.save();
      this.ctx.strokeStyle = this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 11px sans-serif';
      this.ctx.textBaselines = 'alphabetic';
      this.ctx.textAlign = 'left';
      player = this.world.player;
      _ref = this.world.tanks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tank = _ref[_i];
        if (tank.name && tank.armour !== 255 && tank !== player) {
          if (player) {
            if ((dist = distance(player, tank)) <= 768) {
              continue;
            }
            this.ctx.globalAlpha = min(1.0, (dist - 768) / 1536);
          } else {
            this.ctx.globalAlpha = 1.0;
          }
          metrics = this.ctx.measureText(tank.name);
          this.ctx.beginPath();
          this.ctx.moveTo(x = round(tank.x / PIXEL_SIZE_WORLD) + 16, y = round(tank.y / PIXEL_SIZE_WORLD) - 16);
          this.ctx.lineTo(x += 12, y -= 9);
          this.ctx.lineTo(x + metrics.width, y);
          this.ctx.stroke();
          this.ctx.fillText(tank.name, x, y - 2);
        }
      }
      return this.ctx.restore();
    };
    return Common2dRenderer;
  }();
  module.exports = Common2dRenderer;
}).call(this);
