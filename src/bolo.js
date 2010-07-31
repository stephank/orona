var overlay = null;
var hud = null;
var reticle = null;

var player = null;


var Bolo = {
  gameTimer: null,
  lastTick: null,

  start: function() {
    overlay = $('#overlay');
    hud = $('#hud');
    reticle = $('<div/>', {'id': 'reticle', 'class': 'tile'}).appendTo(overlay);
    map.init();
    $(document).keydown(Bolo.handleKeydown).keyup(Bolo.handleKeyup);

    $.ajax({url: 'maps/everard-island.txt', dataType: 'text', success: function(data) {
      map.load(data);

      var start = starts[Math.round(Math.random() * (starts.length - 1))];
      player = new Tank(start.x, start.y, start.direction);

      Bolo.tick();
      Bolo.lastTick = Date.now();
      Bolo.gameTimer = window.setInterval(Bolo.timerCallback, TICK_LENGTH_MS);
    }});
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

  timerCallback: function() {
    var now = Date.now();
    while (now - Bolo.lastTick >= TICK_LENGTH_MS) {
      Bolo.tick();
      Bolo.lastTick += TICK_LENGTH_MS;
    }
  },

  tick: function() {
    player.update();
    Bolo.updateHud();
    Bolo.scrollToPlayer();
  },

  updateHud: function() {
    // FIXME: variable firing distance
    // FIXME: hide when dead
    var distance = 7 * TILE_SIZE_PIXEL;
    var rad = (256 - player.direction) * 2 * Math.PI / 256;
    var x = Math.round(player.x / PIXEL_SIZE_WORLD + Math.cos(rad) * distance);
    var y = Math.round(player.y / PIXEL_SIZE_WORLD + Math.sin(rad) * distance);

    var s = reticle[0].style;
    s.left = Math.round(x - TILE_SIZE_PIXEL / 2) + 'px';
    s.top  = Math.round(y - TILE_SIZE_PIXEL / 2) + 'px';
  },

  scrollToPlayer: function() {
    var e = document.body;
    e.scrollLeft = player.x / PIXEL_SIZE_WORLD - Math.round(window.innerWidth  / 2);
    e.scrollTop  = player.y / PIXEL_SIZE_WORLD - Math.round(window.innerHeight / 2);
  }
};
