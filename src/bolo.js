var tiles = null;
var canvas = null;
var c = null;

var player = null;


var Bolo = {
  start: function() {
    // First, make sure the tilemap is loaded.
    if (tiles === null) {
      tiles = new Image();
      $(tiles).load(Bolo.start);
      // FIXME: Handle errors
      tiles.src = 'img/tiles2x.png';
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
      var start = starts[Math.round(Math.random() * (starts.length - 1))];
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
    var sx = Math.round(player.x / PIXEL_SIZE_WORLD - canvas[0].width  / 2);
    var sy = Math.round(player.y / PIXEL_SIZE_WORLD - canvas[0].height / 2);

    c.save();
      c.translate(-sx, -sy);
      map.draw(sx, sy, sx + canvas[0].width, sy + canvas[0].height);
      player.draw();
      Bolo.updateMapOverlayHud();
    c.restore();
  },

  updateMapOverlayHud: function() {
    // FIXME: variable firing distance
    // FIXME: hide when dead
    var distance = 7 * TILE_SIZE_PIXEL;
    var rad = (256 - player.direction) * 2 * Math.PI / 256;
    var x = Math.round(player.x / PIXEL_SIZE_WORLD + Math.cos(rad) * distance);
    var y = Math.round(player.y / PIXEL_SIZE_WORLD + Math.sin(rad) * distance);

    c.drawImage(tiles, 17 * TILE_SIZE_PIXEL, 4 * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
        x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL);
  }
};
