var Bolo = {
  start: function() {
    // First, make sure the tilemap is loaded.
    if (!tilemap) {
      tilemap = new Image();
      $(tilemap).load(Bolo.start);
      // FIXME: Handle errors
      tilemap.src = 'img/tiles2x.png';
      return;
    }

    // Create the canvas.
    canvas = $('<canvas/>').appendTo('body');
    Bolo.handleResize();
    $(window).resize(Bolo.handleResize);
    c = canvas[0].getContext('2d');

    // Install key handlers.
    $(document).keydown(Bolo.handleKeydown).keyup(Bolo.handleKeyup);

    // Fetch and load the map.
    $.ajax({url: 'maps/everard-island.txt', dataType: 'text', success: function(data) {
      map.load(data);

      // Create a player tank.
      var start = map.starts[Math.round(Math.random() * (map.starts.length - 1))];
      player = new Tank(start.x, start.y, start.direction);

      // Start the game loop.
      Bolo.startLoop();
    }});
  },


  // Event handlers.

  handleResize: function() {
    canvas[0].width = window.innerWidth; canvas[0].height = window.innerHeight;
    canvas.css({'width': window.innerWidth + 'px', 'height': window.innerHeight + 'px'});
  },

  handleKeydown: function(e) {
    if (!player) return;
    switch (e.which) {
      case 37: player.turningCounterClockwise = true; break;
      case 38: player.accelerating = true; break;
      case 39: player.turningClockwise = true; break;
      case 40: player.braking = true; break;
      default: return;
    }
    e.preventDefault();
  },

  handleKeyup: function(e) {
    if (!player) return;
    switch (e.which) {
      case 37: player.turningCounterClockwise = false; break;
      case 38: player.accelerating = false; break;
      case 39: player.turningClockwise = false; break;
      case 40: player.braking = false; break;
      default: return;
    }
    e.preventDefault();
  },


  // Game loop.

  gameTimer: null,
  lastTick: null,

  startLoop: function() {
    Bolo.tick();
    Bolo.lastTick = Date.now();

    Bolo.gameTimer = window.setInterval(Bolo.timerCallback, TICK_LENGTH_MS);
  },

  stopLoop: function() {
    window.clearInterval(Bolo.gameTimer);

    Bolo.gameTimer = null;
    Bolo.lastTick = null;
  },

  timerCallback: function() {
    var now = Date.now();
    while (now - Bolo.lastTick >= TICK_LENGTH_MS) {
      Bolo.tick();
      Bolo.lastTick += TICK_LENGTH_MS;
    }
    Bolo.draw();
  },


  // Simulation.

  tick: function() {
    player.update();
  },


  // Graphics.

  draw: function() {
    var w = canvas[0].width, h = canvas[0].height;
    var sx = Math.round(player.x / PIXEL_SIZE_WORLD - w / 2);
    var sy = Math.round(player.y / PIXEL_SIZE_WORLD - h / 2);

    c.save();
      c.translate(-sx, -sy);
      map.draw(sx, sy, sx + w, sy + h);
      player.draw();
      Bolo.updateMapOverlayHud();
    c.restore();
    Bolo.updateScreenOverlayHud(w, h);
  },

  updateMapOverlayHud: function() {
    // FIXME: variable firing distance
    // FIXME: hide when dead
    var distance = 7 * TILE_SIZE_PIXEL;
    var rad = (256 - player.direction) * 2 * Math.PI / 256;
    var x = Math.round(player.x / PIXEL_SIZE_WORLD + Math.cos(rad) * distance);
    var y = Math.round(player.y / PIXEL_SIZE_WORLD + Math.sin(rad) * distance);

    c.drawImage(tilemap, 17 * TILE_SIZE_PIXEL, 4 * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
        x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
  },

  updateScreenOverlayHud: function(w, h) {
    c.save();

    // Pillbox and base status indicators.
    var i, x, y;

    // Background.
    var sy = h - 66;
    c.beginPath(); c.rect(-5, sy, 130, 71); c.rect(125, sy, 125, 71);
    c.globalAlpha = 0.8; c.fillStyle   = '#404060'; c.fill();
    c.globalAlpha = 1.0; c.strokeStyle = '#c0c0f0'; c.lineWidth = 2; c.stroke();

    // Pillboxes
    for (i = 0; i < map.pills.length; i++) {
      x = 6 + 20 * (i % 6) + 6;
      y = sy + 6 + Math.floor(i / 6) * 20 + 6;
      c.beginPath(); c.arc(x, y, 7, 0, 2 * Math.PI, false);
      // FIXME: allegiance
      c.fillStyle = '#a0a0a0'; c.fill();
      c.strokeStyle = '#f0f0f0'; c.lineWidth = 2; c.stroke();
    }
    // FIXME: graphic needs transparency
    c.drawImage(tilemap, 15 * TILE_SIZE_PIXEL, 4 * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
        104, sy + 44, 16, 16);

    // Bases
    for (i = 0; i < map.bases.length; i++) {
      x = 131 + 20 * (i % 6);
      y = sy + 5 + Math.floor(i / 6) * 20;
      c.beginPath(); c.rect(x, y, 14, 14);
      // FIXME: allegiance
      c.fillStyle = '#a0a0a0'; c.fill();
      c.strokeStyle = '#f0f0f0'; c.lineWidth = 2; c.stroke();
    }
    // FIXME: graphic needs transparency
    c.drawImage(tilemap, 16 * TILE_SIZE_PIXEL, 4 * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
        229, sy + 44, 16, 16);

    c.restore();
  }
};
