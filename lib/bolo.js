(function() {
  var PI, _a, cos, floor, random, round, sin;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  /*
  Orona, © 2010 Stéphan Kochen

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.
  */
  _a = Math;
  round = _a.round;
  floor = _a.floor;
  random = _a.random;
  cos = _a.cos;
  sin = _a.sin;
  PI = _a.PI;
  window.Bolo = {
    start: function() {
      var _b;
      if (!((typeof (_b = window.tilemap) !== "undefined" && _b !== null))) {
        window.tilemap = new Image();
        $(tilemap).load(Bolo.start);
        tilemap.src = 'img/tiles2x.png';
        return null;
      }
      window.canvas = $('#game');
      Bolo.handleResize();
      $(window).resize(Bolo.handleResize);
      window.c = canvas[0].getContext('2d');
      $(document).keydown(Bolo.handleKeydown).keyup(Bolo.handleKeyup);
      return $.ajax({
        url: 'maps/everard-island.txt',
        dataType: 'text',
        success: function(data) {
          var start;
          map.load(data);
          start = map.starts[round(random() * (map.starts.length - 1))];
          window.player = new Tank(start.x, start.y, start.direction);
          window.hud = $('#hud');
          Bolo.initHud();
          return Bolo.startLoop();
        }
      });
    },
    handleResize: function() {
      canvas[0].width = window.innerWidth;
      canvas[0].height = window.innerHeight;
      return canvas.css({
        width: window.innerWidth + 'px',
        height: window.innerHeight + 'px'
      });
    },
    handleKeydown: function(e) {
      var _b;
      if (!(typeof player !== "undefined" && player !== null)) {
        return null;
      }
      if ((_b = e.which) === 32) {
        player.shooting = true;
      } else if (_b === 37) {
        player.turningCounterClockwise = true;
      } else if (_b === 38) {
        player.accelerating = true;
      } else if (_b === 39) {
        player.turningClockwise = true;
      } else if (_b === 40) {
        player.braking = true;
      } else {
        return null;
      }
      return e.preventDefault();
    },
    handleKeyup: function(e) {
      var _b;
      if (!(typeof player !== "undefined" && player !== null)) {
        return null;
      }
      if ((_b = e.which) === 32) {
        player.shooting = false;
      } else if (_b === 37) {
        player.turningCounterClockwise = false;
      } else if (_b === 38) {
        player.accelerating = false;
      } else if (_b === 39) {
        player.turningClockwise = false;
      } else if (_b === 40) {
        player.braking = false;
      } else {
        return null;
      }
      return e.preventDefault();
    },
    gameTimer: null,
    lastTick: null,
    startLoop: function() {
      Bolo.tick();
      Bolo.lastTick = Date.now();
      return (Bolo.gameTimer = window.setInterval(Bolo.timerCallback, TICK_LENGTH_MS));
    },
    stopLoop: function() {
      window.clearInterval(Bolo.gameTimer);
      Bolo.gameTimer = null;
      return (Bolo.lastTick = null);
    },
    timerCallback: function() {
      var now;
      now = Date.now();
      while (now - Bolo.lastTick >= TICK_LENGTH_MS) {
        Bolo.tick();
        Bolo.lastTick += TICK_LENGTH_MS;
      }
      return Bolo.draw();
    },
    tick: function() {
      return player.update();
    },
    draw: function() {
      var _b, height, left, top, width;
      c.save();
      _b = canvas[0];
      width = _b.width;
      height = _b.height;
      left = round(player.x / PIXEL_SIZE_WORLD - width / 2);
      top = round(player.y / PIXEL_SIZE_WORLD - height / 2);
      c.translate(-left, -top);
      map.draw(left, top, left + width, top + height);
      player.draw();
      Bolo.drawOverlay();
      c.restore();
      return Bolo.updateHud();
    },
    drawOverlay: function() {
      var distance, rad, x, y;
      distance = 7 * TILE_SIZE_PIXEL;
      rad = (256 - player.direction) * 2 * PI / 256;
      x = round(player.x / PIXEL_SIZE_WORLD + cos(rad) * distance);
      y = round(player.y / PIXEL_SIZE_WORLD + sin(rad) * distance);
      return c.drawImage(tilemap, 17 * TILE_SIZE_PIXEL, 4 * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
    },
    initHud: function() {
      var _b, _c, _d, _e, _f, _g, base, container, pill;
      hud.html('');
      container = $('<div/>', {
        id: 'pillStatus'
      }).appendTo(hud);
      $('<div/>', {
        "class": 'deco'
      }).appendTo(container);
      _c = map.pills;
      for (_b = 0, _d = _c.length; _b < _d; _b++) {
        pill = _c[_b];
        $('<div/>', {
          "class": 'pill'
        }).appendTo(container).data('pill', pill);
      }
      container = $('<div/>', {
        id: 'baseStatus'
      }).appendTo(hud);
      $('<div/>', {
        "class": 'deco'
      }).appendTo(container);
      _f = map.bases;
      for (_e = 0, _g = _f.length; _e < _g; _e++) {
        base = _f[_e];
        $('<div/>', {
          "class": 'base'
        }).appendTo(container).data('base', base);
      }
      !(location.host === 'localhost') ? $('<div/>').text('This is a work-in-progress; less than alpha quality!').css({
        'position': 'absolute',
        'top': '8px',
        'left': '0px',
        'width': '100%',
        'text-align': 'center',
        'font-family': 'monospace',
        'font-size': '16px',
        'font-weight': 'bold',
        'color': 'white'
      }).appendTo(hud) : null;
      return Bolo.updateHud();
    },
    updateHud: function() {
      $('#pillStatus .pill').each(__bind(function(i, node) {
        return $(node).attr('status', 'neutral');
      }, this));
      return $('#baseStatus .base').each(__bind(function(i, node) {
        return $(node).attr('status', 'neutral');
      }, this));
    }
  };
})();
