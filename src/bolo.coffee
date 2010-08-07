{round, floor, random, cos, sin, PI} = Math


window.Bolo =
  start: ->
    # First, make sure the tilemap is loaded.
    unless window.tilemap?
      window.tilemap = new Image()
      $(tilemap).load(Bolo.start)
      # FIXME: Handle errors
      tilemap.src = 'img/tiles2x.png'
      return

    # Create the canvas.
    window.canvas = $('<canvas/>').appendTo('body')
    Bolo.handleResize()
    $(window).resize(Bolo.handleResize)
    window.c = canvas[0].getContext('2d')

    # Install key handlers.
    $(document).keydown(Bolo.handleKeydown).keyup(Bolo.handleKeyup)

    # Fetch and load the map.
    $.ajax(
      url: 'maps/everard-island.txt'
      dataType: 'text'
      success: (data) ->
        map.load data

        # Create a player tank.
        start = map.starts[round(random() * (map.starts.length - 1))]
        window.player = new Tank(start.x, start.y, start.direction)

        # Start the game loop.
        Bolo.startLoop()
    )


  # Event handlers.

  handleResize: ->
    canvas[0].width  = window.innerWidth
    canvas[0].height = window.innerHeight
    canvas.css(
      width:  window.innerWidth + 'px'
      height: window.innerHeight + 'px'
    )

  handleKeydown: (e) ->
    return unless player?
    switch e.which
      when 32 then player.shooting = yes
      when 37 then player.turningCounterClockwise = yes
      when 38 then player.accelerating = yes
      when 39 then player.turningClockwise = yes
      when 40 then player.braking = yes
      else return
    e.preventDefault()

  handleKeyup: (e) ->
    return unless player?
    switch e.which
      when 32 then player.shooting = no
      when 37 then player.turningCounterClockwise = no
      when 38 then player.accelerating = no
      when 39 then player.turningClockwise = no
      when 40 then player.braking = no
      else return
    e.preventDefault()


  # Game loop.

  gameTimer: null
  lastTick: null

  startLoop: ->
    Bolo.tick()
    Bolo.lastTick = Date.now()

    Bolo.gameTimer = window.setInterval(Bolo.timerCallback, TICK_LENGTH_MS)

  stopLoop: ->
    window.clearInterval(Bolo.gameTimer)

    Bolo.gameTimer = null
    Bolo.lastTick = null

  timerCallback: ->
    now = Date.now()
    while now - Bolo.lastTick >= TICK_LENGTH_MS
      Bolo.tick()
      Bolo.lastTick += TICK_LENGTH_MS
    Bolo.draw()


  # Simulation.

  tick: ->
    player.update()


  # Graphics.

  draw: ->
    {width, height} = canvas[0]
    left = round(player.x / PIXEL_SIZE_WORLD - width  / 2)
    top =  round(player.y / PIXEL_SIZE_WORLD - height / 2)

    c.save()
    c.translate(-left, -top)
    map.draw(left, top, left + width, top + height)
    player.draw()
    Bolo.updateMapOverlayHud()
    c.restore()
    Bolo.updateScreenOverlayHud(width, height)

  updateMapOverlayHud: ->
    # FIXME: variable firing distance
    # FIXME: hide when dead
    # FIXME: just use the DOM for this?
    distance = 7 * TILE_SIZE_PIXEL
    rad = (256 - player.direction) * 2 * PI / 256
    x = round(player.x / PIXEL_SIZE_WORLD + cos(rad) * distance)
    y = round(player.y / PIXEL_SIZE_WORLD + sin(rad) * distance)

    c.drawImage tilemap,
      17 * TILE_SIZE_PIXEL,    4 * TILE_SIZE_PIXEL,     TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
      x - TILE_SIZE_PIXEL / 2, y - TILE_SIZE_PIXEL / 2, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL

  updateScreenOverlayHud: (w, h) ->
    c.save()

    # Background.
    sy = h - 66
    c.beginPath(); c.rect(-5, sy, 130, 71); c.rect(125, sy, 125, 71)
    c.fillStyle   = '#000000'; c.fill()
    c.strokeStyle = '#c0c0f0'; c.lineWidth = 2; c.stroke()

    # Pillboxes
    for pill, i in map.pills
      x = 6 + 20 * (i % 6) + 6
      y = sy + 6 + floor(i / 6) * 20 + 6
      c.beginPath(); c.arc(x, y, 7, 0, 2 * PI, no)
      # FIXME: allegiance
      c.fillStyle   = '#a0a0a0'; c.fill()
      c.strokeStyle = '#f0f0f0'; c.lineWidth = 2; c.stroke()
    c.drawImage tilemap,
      15 * TILE_SIZE_PIXEL, 4 * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
      104, sy + 44, 16, 16

    # Bases
    for base, i in map.bases
      x = 131 + 20 * (i % 6)
      y = sy + 5 + floor(i / 6) * 20
      c.beginPath(); c.rect(x, y, 14, 14)
      # FIXME: allegiance
      c.fillStyle   = '#a0a0a0'; c.fill()
      c.strokeStyle = '#f0f0f0'; c.lineWidth = 2; c.stroke()
    c.drawImage tilemap,
      16 * TILE_SIZE_PIXEL, 4 * TILE_SIZE_PIXEL, TILE_SIZE_PIXEL, TILE_SIZE_PIXEL,
      229, sy + 44, 16, 16

    c.restore()
