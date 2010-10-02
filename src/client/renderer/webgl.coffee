# The WebGL renderer works much like the Direct2D renderer, but uses WebGL to accomplish it.
# The advantage is that we can draw individual tiles, but actually feed them in large batches to
# the graphics hardware using Vertex Buffer Objects (VBO). Another advantage is that we can do all
# the styling we need in a fragment shader.
#
# All in all, this is the least CPU intensive drawing method, but strangely not the smoothest.


{round, floor, ceil} = Math
BaseRenderer         = require './base'
{TILE_SIZE_PIXELS,
 PIXEL_SIZE_WORLD}   = require '../../constants'
TEAM_COLORS          = require '../../team_colors'



#### Shaders

# The vertex shader simply applies the transformation matrix, and interpolates texture coordinates.
VERTEX_SHADER =
  '''
  /* Input variables. */
  attribute vec2 aVertexCoord;
  attribute vec2 aTextureCoord;
  uniform mat4 uTransform;

  /* Output variables. */
  /* implicit vec4 gl_Position; */
  varying vec2 vTextureCoord;

  void main(void) {
    gl_Position = uTransform * vec4(aVertexCoord, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
  }
  '''

# The fragment shader makes the decision which tilemap to sample from, and combines the styled
# tilemap with the styling overlay. Three texture units are used.
FRAGMENT_SHADER =
  '''
  #ifdef GL_ES
  precision highp float;
  #endif

  /* Input variables. */
  varying vec2 vTextureCoord;
  uniform sampler2D uBase;
  uniform sampler2D uStyled;
  uniform sampler2D uOverlay;
  uniform bool uUseStyled;
  uniform bool uIsStyled;
  uniform vec3 uStyleColor;

  /* Output variables. */
  /* implicit vec4 gl_FragColor; */

  void main(void) {
    if (uUseStyled) {
      vec4 base = texture2D(uStyled, vTextureCoord);
      if (uIsStyled) {
        float alpha = texture2D(uOverlay, vTextureCoord).r;
        gl_FragColor = vec4(
            mix(base.rgb, uStyleColor, alpha),
            clamp(base.a + alpha, 0.0, 1.0)
        );
      }
      else {
        gl_FragColor = base;
      }
    }
    else {
      gl_FragColor = texture2D(uBase, vTextureCoord);
    }
  }
  '''

# Helper function that is used to compile the above shaders.
compileShader = (ctx, type, source) ->
  shader = ctx.createShader type
  ctx.shaderSource shader, source
  ctx.compileShader shader
  unless ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)
    throw "Could not compile shader: #{ctx.getShaderInfoLog(shader)}"
  shader


#### Renderer

class WebglRenderer extends BaseRenderer
  constructor: (images, sim) ->
    super

    # Initialize the canvas.
    @canvas = $('<canvas/>')
    try
      @ctx = @canvas[0].getContext('experimental-webgl')
      @ctx.bindBuffer # Just access it, see if it throws.
    catch e
      throw "Could not initialize WebGL canvas: #{e.message}"
    @canvas.appendTo('body')

    # This makes WebGL calls feel slightly more natural.
    gl = @ctx

    # We use 2D textures and blending.
    # gl.enable(gl.TEXTURE_2D)  # Illegal and not required in WebGL / GLES 2.0.
    gl.enable(gl.BLEND)

    # When blending, apply the source's alpha channel.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    # Create and permanently bind the tilemap texture into texture unit 0.
    for img, i in [@images.base, @images.styled, @images.overlay]
      gl.activeTexture(gl.TEXTURE0 + i)
      texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      # No scaling should ever be necessary, so pick the fastest algorithm.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      # This should prevent overflowing between tiles at least at the edge of the tilemap.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      # Load the tilemap data into the texture
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

    # Preparations for drawTile. Calculate the tile size in the texture coordinate space.
    @hTileSizeTexture = TILE_SIZE_PIXELS / @images.base.width
    @vTileSizeTexture = TILE_SIZE_PIXELS / @images.base.height
    # And again for drawStyledTile.
    @hStyledTileSizeTexture = TILE_SIZE_PIXELS / @images.styled.width
    @vStyledTileSizeTexture = TILE_SIZE_PIXELS / @images.styled.height

    # Compile the shaders.
    @program = gl.createProgram()
    gl.attachShader(@program, compileShader(gl, gl.VERTEX_SHADER,   VERTEX_SHADER))
    gl.attachShader(@program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
    gl.linkProgram(@program)
    unless gl.getProgramParameter(@program, gl.LINK_STATUS)
      throw "Could not link shaders: #{gl.getProgramInfoLog(@program)}"
    gl.useProgram(@program)

    # Store the shader inputs we need to be able to fill.
    @aVertexCoord  =  gl.getAttribLocation(@program, 'aVertexCoord')
    @aTextureCoord =  gl.getAttribLocation(@program, 'aTextureCoord')
    @uTransform    = gl.getUniformLocation(@program, 'uTransform')
    @uBase         = gl.getUniformLocation(@program, 'uBase')
    @uStyled       = gl.getUniformLocation(@program, 'uStyled')
    @uOverlay      = gl.getUniformLocation(@program, 'uOverlay')
    @uUseStyled    = gl.getUniformLocation(@program, 'uUseStyled')
    @uIsStyled     = gl.getUniformLocation(@program, 'uIsStyled')
    @uStyleColor   = gl.getUniformLocation(@program, 'uStyleColor')

    # Enable vertex attributes as arrays.
    gl.enableVertexAttribArray(@aVertexCoord)
    gl.enableVertexAttribArray(@aTextureCoord)

    # Tell the fragment shader which texture units to use for its uniforms.
    gl.uniform1i(@uBase,    0)
    gl.uniform1i(@uStyled,  1)
    gl.uniform1i(@uOverlay, 2)

    # Allocate the translation matrix, and fill it with the identity matrix.
    # To do all of our transformations, we only need to change 4 elements.
    @transformArray = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ])

    # Allocate the vertex buffer with room for a bunch of tiles.
    # This will store both vertex coordinates as well as texture coordinates.
    @vertexArray = new Float32Array(256 * (6*4))

    # Create and permanently bind the vertex buffer.
    @vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, @vertexBuffer)
    gl.vertexAttribPointer(@aVertexCoord,  2, gl.FLOAT, no, 16, 0)
    gl.vertexAttribPointer(@aTextureCoord, 2, gl.FLOAT, no, 16, 8)

    # Handle resizes.
    @handleResize()
    $(window).resize => @handleResize()

  # On resize, we update the canvas size, and recalculate the translation matrix. Because this is
  # called at convenient times, we also check the GL error state at this point.
  handleResize: ->
    @canvas[0].width  = window.innerWidth
    @canvas[0].height = window.innerHeight
    @canvas.css(
      width:  window.innerWidth + 'px'
      height: window.innerHeight + 'px'
    )

    # Adjust the body as well, to prevent accidental scrolling on some browsers.
    $('body').css(
      width:  window.innerWidth + 'px'
      height: window.innerHeight + 'px'
    )

    @ctx.viewport(0, 0, window.innerWidth, window.innerHeight)
    @setTranslation(0, 0)

    @checkError()

  # This function checks the GL error state and throws an exception if necessary.
  checkError: ->
    gl = @ctx
    unless (err = gl.getError()) == gl.NO_ERROR
      throw "WebGL error: #{err}"
    return

  # Rebuild the translation matrix. The translation matrix accomplishes the following:
  #
  # A. Apply the requested translation by (px,py).
  # B. The WebGL coordinate space runs from -1 to 1. Scale the pixel coordinates to fit in the
  #    range 0 to 2.
  # C. Then translate to fit in the range -1 to 1.
  # D. The WebGL y-axis is inverted compared to what we want. So multiply the y-axis by -1.
  #
  # To chain all this into one matrix, we have to apply these into reverse order. The math then
  # looks as follows:
  #
  #               D                     C                     B                     A
  #     |   1   0   0   0 |   |   1   0   0  -1 |   |  xt   0   0   0 |   |   1   0   0  px |
  # T = |   0  -1   0   0 | x |   0   1   0  -1 | x |   0  xy   0   0 | x |   0   1   0  py |
  #     |   0   0   1   0 |   |   0   0   1   0 |   |   0   0   1   0 |   |   0   0   1   0 |
  #     |   0   0   0   1 |   |   0   0   0   1 |   |   0   0   0   1 |   |   0   0   0   1 |
  #
  # To top that off, WebGL expects things in column major order. So the array indices should be
  # read as being transposed.
  setTranslation: (px, py) ->

    xt = 2 / window.innerWidth
    yt = 2 / window.innerHeight

    arr = @transformArray
    arr[0] =  xt
    arr[5] = -yt
    arr[12] = px *  xt - 1
    arr[13] = py * -yt + 1
    @ctx.uniformMatrix4fv(@uTransform, no, arr)

  # Apply a translation that centers everything around the given coordinates.
  centerOn: (x, y, cb) ->
    {width, height} = @canvas[0]
    left = round(x / PIXEL_SIZE_WORLD - width  / 2)
    top =  round(y / PIXEL_SIZE_WORLD - height / 2)
    @setTranslation(-left, -top)

    cb(left, top, width, height)

    @setTranslation(0, 0)

  # Helper function that adds a tile to an array that is used to prepare the VBO. It takes care
  # of calculating texture coordinates based on tile coordinates `tx` and `ty`, and adds entries
  # for two triangles to the given `buffer` at the given `offset`.
  bufferTile: (buffer, offset, tx, ty, styled, sdx, sdy) ->
    if styled
      stx =  tx * @hStyledTileSizeTexture
      sty =  ty * @vStyledTileSizeTexture
      etx = stx + @hStyledTileSizeTexture
      ety = sty + @vStyledTileSizeTexture
    else
      stx =  tx * @hTileSizeTexture
      sty =  ty * @vTileSizeTexture
      etx = stx + @hTileSizeTexture
      ety = sty + @vTileSizeTexture

    edx = sdx + TILE_SIZE_PIXELS
    edy = sdy + TILE_SIZE_PIXELS

    buffer.set([
      sdx, sdy, stx, sty,
      sdx, edy, stx, ety,
      edx, sdy, etx, sty,
      sdx, edy, stx, ety,
      edx, sdy, etx, sty,
      edx, edy, etx, ety
    ], offset * (6*4))

  # Draw a single tile, unstyled.
  drawTile: (tx, ty, sdx, sdy) ->
    gl = @ctx
    gl.uniform1i(@uUseStyled, 0)
    @bufferTile(@vertexArray, 0, tx, ty, no, sdx, sdy)
    gl.bufferData(gl.ARRAY_BUFFER, @vertexArray, gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

  # Draw a single tile, styled with a team color.
  drawStyledTile: (tx, ty, style, sdx, sdy) ->
    gl = @ctx
    gl.uniform1i(@uUseStyled, 1)
    if color = TEAM_COLORS[style]
      gl.uniform1i(@uIsStyled, 1)
      gl.uniform3f(@uStyleColor, color.r / 255, color.g / 255, color.b / 255)
    else
      gl.uniform1i(@uIsStyled, 0)
    @bufferTile(@vertexArray, 0, tx, ty, yes, sdx, sdy)
    gl.bufferData(gl.ARRAY_BUFFER, @vertexArray, gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

  # When a cell is retiled, we simply store the tile index for the upcoming frames.
  onRetile: (cell, tx, ty) ->
    cell.tile = [tx, ty]

  # Draw the map.
  drawMap: (sx, sy, w, h) ->
    gl = @ctx

    ex = sx + w - 1
    ey = sy + h - 1

    # Calculate tile boundaries.
    stx = floor(sx / TILE_SIZE_PIXELS)
    sty = floor(sy / TILE_SIZE_PIXELS)
    etx =  ceil(ex / TILE_SIZE_PIXELS)
    ety =  ceil(ey / TILE_SIZE_PIXELS)

    styledCells = {}
    arrayTileIndex = 0
    maxTiles = @vertexArray.length / (6*4)

    # Draw the accumulated tiles.
    flushArray = =>
      return if arrayTileIndex == 0
      gl.bufferData(gl.ARRAY_BUFFER, @vertexArray, gl.DYNAMIC_DRAW)
      gl.drawArrays(gl.TRIANGLES, 0, arrayTileIndex * 6)
      arrayTileIndex = 0

    # Only draw unstyled tiles, but build an index of styled tiles by color.
    gl.uniform1i(@uUseStyled, 0)
    @sim.map.each (cell) =>
      if obj = cell.pill || cell.base
        style = obj.owner?.$.team
        style = 255 unless TEAM_COLORS[style]
        (styledCells[style] ||= []).push(cell)
      else
        @bufferTile @vertexArray, arrayTileIndex, cell.tile[0], cell.tile[1], no,
            cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS
        if ++arrayTileIndex == maxTiles
          flushArray()
    , stx, sty, etx, ety
    flushArray()

    # Draw the remaining styled tiles.
    gl.uniform1i(@uUseStyled, 1)
    for style, cells of styledCells
      if color = TEAM_COLORS[style]
        gl.uniform1i(@uIsStyled, 1)
        gl.uniform3f(@uStyleColor, color.r / 255, color.g / 255, color.b / 255)
      else
        gl.uniform1i(@uIsStyled, 0)

      for cell in cells
        @bufferTile @vertexArray, arrayTileIndex, cell.tile[0], cell.tile[1], yes,
            cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS
        if ++arrayTileIndex == maxTiles
          flushArray()
      flushArray()


#### Exports
module.exports = WebglRenderer
