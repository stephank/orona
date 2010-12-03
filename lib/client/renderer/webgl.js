(function() {
  var BaseRenderer, FRAGMENT_SHADER, PIXEL_SIZE_WORLD, TEAM_COLORS, TILE_SIZE_PIXELS, VERTEX_SHADER, WebglRenderer, ceil, compileShader, floor, round, _ref;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  round = Math.round, floor = Math.floor, ceil = Math.ceil;
  BaseRenderer = require('./base');
  _ref = require('../../constants'), TILE_SIZE_PIXELS = _ref.TILE_SIZE_PIXELS, PIXEL_SIZE_WORLD = _ref.PIXEL_SIZE_WORLD;
  TEAM_COLORS = require('../../team_colors');
  VERTEX_SHADER = '/* Input variables. */\nattribute vec2 aVertexCoord;\nattribute vec2 aTextureCoord;\nuniform mat4 uTransform;\n\n/* Output variables. */\n/* implicit vec4 gl_Position; */\nvarying vec2 vTextureCoord;\n\nvoid main(void) {\n  gl_Position = uTransform * vec4(aVertexCoord, 0.0, 1.0);\n  vTextureCoord = aTextureCoord;\n}';
  FRAGMENT_SHADER = '#ifdef GL_ES\nprecision highp float;\n#endif\n\n/* Input variables. */\nvarying vec2 vTextureCoord;\nuniform sampler2D uBase;\nuniform sampler2D uStyled;\nuniform sampler2D uOverlay;\nuniform bool uUseStyled;\nuniform bool uIsStyled;\nuniform vec3 uStyleColor;\n\n/* Output variables. */\n/* implicit vec4 gl_FragColor; */\n\nvoid main(void) {\n  if (uUseStyled) {\n    vec4 base = texture2D(uStyled, vTextureCoord);\n    if (uIsStyled) {\n      float alpha = texture2D(uOverlay, vTextureCoord).r;\n      gl_FragColor = vec4(\n          mix(base.rgb, uStyleColor, alpha),\n          clamp(base.a + alpha, 0.0, 1.0)\n      );\n    }\n    else {\n      gl_FragColor = base;\n    }\n  }\n  else {\n    gl_FragColor = texture2D(uBase, vTextureCoord);\n  }\n}';
  compileShader = function(ctx, type, source) {
    var shader;
    shader = ctx.createShader(type);
    ctx.shaderSource(shader, source);
    ctx.compileShader(shader);
    if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
      throw "Could not compile shader: " + (ctx.getShaderInfoLog(shader));
    }
    return shader;
  };
  WebglRenderer = function() {
    function WebglRenderer() {
      WebglRenderer.__super__.constructor.apply(this, arguments);
    }
    __extends(WebglRenderer, BaseRenderer);
    WebglRenderer.prototype.setup = function() {
      var gl, i, img, texture, _len, _ref;
      try {
        this.ctx = this.canvas[0].getContext('experimental-webgl');
        this.ctx.bindBuffer;
      } catch (e) {
        throw "Could not initialize WebGL canvas: " + e.message;
      }
      gl = this.ctx;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      _ref = [this.images.base, this.images.styled, this.images.overlay];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        img = _ref[i];
        gl.activeTexture(gl.TEXTURE0 + i);
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      }
      this.hTileSizeTexture = TILE_SIZE_PIXELS / this.images.base.width;
      this.vTileSizeTexture = TILE_SIZE_PIXELS / this.images.base.height;
      this.hStyledTileSizeTexture = TILE_SIZE_PIXELS / this.images.styled.width;
      this.vStyledTileSizeTexture = TILE_SIZE_PIXELS / this.images.styled.height;
      this.program = gl.createProgram();
      gl.attachShader(this.program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(this.program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        throw "Could not link shaders: " + (gl.getProgramInfoLog(this.program));
      }
      gl.useProgram(this.program);
      this.aVertexCoord = gl.getAttribLocation(this.program, 'aVertexCoord');
      this.aTextureCoord = gl.getAttribLocation(this.program, 'aTextureCoord');
      this.uTransform = gl.getUniformLocation(this.program, 'uTransform');
      this.uBase = gl.getUniformLocation(this.program, 'uBase');
      this.uStyled = gl.getUniformLocation(this.program, 'uStyled');
      this.uOverlay = gl.getUniformLocation(this.program, 'uOverlay');
      this.uUseStyled = gl.getUniformLocation(this.program, 'uUseStyled');
      this.uIsStyled = gl.getUniformLocation(this.program, 'uIsStyled');
      this.uStyleColor = gl.getUniformLocation(this.program, 'uStyleColor');
      gl.enableVertexAttribArray(this.aVertexCoord);
      gl.enableVertexAttribArray(this.aTextureCoord);
      gl.uniform1i(this.uBase, 0);
      gl.uniform1i(this.uStyled, 1);
      gl.uniform1i(this.uOverlay, 2);
      this.transformArray = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      this.vertexArray = new Float32Array(256 * (6 * 4));
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(this.aVertexCoord, 2, gl.FLOAT, false, 16, 0);
      return gl.vertexAttribPointer(this.aTextureCoord, 2, gl.FLOAT, false, 16, 8);
    };
    WebglRenderer.prototype.handleResize = function() {
      WebglRenderer.__super__.handleResize.apply(this, arguments);
      this.ctx.viewport(0, 0, window.innerWidth, window.innerHeight);
      this.setTranslation(0, 0);
      return this.checkError();
    };
    WebglRenderer.prototype.checkError = function() {
      var err, gl;
      gl = this.ctx;
      if ((err = gl.getError()) !== gl.NO_ERROR) {
        throw "WebGL error: " + err;
      }
      return;
    };
    WebglRenderer.prototype.setTranslation = function(px, py) {
      var arr, xt, yt;
      xt = 2 / window.innerWidth;
      yt = 2 / window.innerHeight;
      arr = this.transformArray;
      arr[0] = xt;
      arr[5] = -yt;
      arr[12] = px * xt - 1;
      arr[13] = py * -yt + 1;
      return this.ctx.uniformMatrix4fv(this.uTransform, false, arr);
    };
    WebglRenderer.prototype.centerOn = function(x, y, cb) {
      var height, left, top, width, _ref;
      _ref = this.getViewAreaAtWorld(x, y), left = _ref[0], top = _ref[1], width = _ref[2], height = _ref[3];
      this.setTranslation(-left, -top);
      cb(left, top, width, height);
      return this.setTranslation(0, 0);
    };
    WebglRenderer.prototype.bufferTile = function(buffer, offset, tx, ty, styled, sdx, sdy) {
      var edx, edy, etx, ety, stx, sty;
      if (styled) {
        stx = tx * this.hStyledTileSizeTexture;
        sty = ty * this.vStyledTileSizeTexture;
        etx = stx + this.hStyledTileSizeTexture;
        ety = sty + this.vStyledTileSizeTexture;
      } else {
        stx = tx * this.hTileSizeTexture;
        sty = ty * this.vTileSizeTexture;
        etx = stx + this.hTileSizeTexture;
        ety = sty + this.vTileSizeTexture;
      }
      edx = sdx + TILE_SIZE_PIXELS;
      edy = sdy + TILE_SIZE_PIXELS;
      return buffer.set([sdx, sdy, stx, sty, sdx, edy, stx, ety, edx, sdy, etx, sty, sdx, edy, stx, ety, edx, sdy, etx, sty, edx, edy, etx, ety], offset * (6 * 4));
    };
    WebglRenderer.prototype.drawTile = function(tx, ty, sdx, sdy) {
      var gl;
      gl = this.ctx;
      gl.uniform1i(this.uUseStyled, 0);
      this.bufferTile(this.vertexArray, 0, tx, ty, false, sdx, sdy);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.DYNAMIC_DRAW);
      return gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    WebglRenderer.prototype.drawStyledTile = function(tx, ty, style, sdx, sdy) {
      var color, gl;
      gl = this.ctx;
      gl.uniform1i(this.uUseStyled, 1);
      if (color = TEAM_COLORS[style]) {
        gl.uniform1i(this.uIsStyled, 1);
        gl.uniform3f(this.uStyleColor, color.r / 255, color.g / 255, color.b / 255);
      } else {
        gl.uniform1i(this.uIsStyled, 0);
      }
      this.bufferTile(this.vertexArray, 0, tx, ty, true, sdx, sdy);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.DYNAMIC_DRAW);
      return gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    WebglRenderer.prototype.onRetile = function(cell, tx, ty) {
      return cell.tile = [tx, ty];
    };
    WebglRenderer.prototype.drawMap = function(sx, sy, w, h) {
      var arrayTileIndex, cell, cells, color, etx, ety, ex, ey, flushArray, gl, maxTiles, stx, sty, style, styledCells, _i, _len, _results;
      gl = this.ctx;
      ex = sx + w - 1;
      ey = sy + h - 1;
      stx = floor(sx / TILE_SIZE_PIXELS);
      sty = floor(sy / TILE_SIZE_PIXELS);
      etx = ceil(ex / TILE_SIZE_PIXELS);
      ety = ceil(ey / TILE_SIZE_PIXELS);
      styledCells = {};
      arrayTileIndex = 0;
      maxTiles = this.vertexArray.length / (6 * 4);
      flushArray = __bind(function() {
        if (arrayTileIndex === 0) {
          return;
        }
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexArray, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, arrayTileIndex * 6);
        return arrayTileIndex = 0;
      }, this);
      gl.uniform1i(this.uUseStyled, 0);
      this.world.map.each(__bind(function(cell) {
        var obj, style, _ref;
        if (obj = cell.pill || cell.base) {
          style = (_ref = obj.owner) != null ? _ref.$.team : void 0;
          if (!TEAM_COLORS[style]) {
            style = 255;
          }
          return (styledCells[style] || (styledCells[style] = [])).push(cell);
        } else {
          this.bufferTile(this.vertexArray, arrayTileIndex, cell.tile[0], cell.tile[1], false, cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS);
          if (++arrayTileIndex === maxTiles) {
            return flushArray();
          }
        }
      }, this), stx, sty, etx, ety);
      flushArray();
      gl.uniform1i(this.uUseStyled, 1);
      _results = [];
      for (style in styledCells) {
        if (!__hasProp.call(styledCells, style)) continue;
        cells = styledCells[style];
        if (color = TEAM_COLORS[style]) {
          gl.uniform1i(this.uIsStyled, 1);
          gl.uniform3f(this.uStyleColor, color.r / 255, color.g / 255, color.b / 255);
        } else {
          gl.uniform1i(this.uIsStyled, 0);
        }
        for (_i = 0, _len = cells.length; _i < _len; _i++) {
          cell = cells[_i];
          this.bufferTile(this.vertexArray, arrayTileIndex, cell.tile[0], cell.tile[1], true, cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS);
          if (++arrayTileIndex === maxTiles) {
            flushArray();
          }
        }
        _results.push(flushArray());
      }
      return _results;
    };
    WebglRenderer.prototype.drawBuilderIndicator = function(b) {};
    WebglRenderer.prototype.drawNames = function() {};
    return WebglRenderer;
  }();
  module.exports = WebglRenderer;
}).call(this);
