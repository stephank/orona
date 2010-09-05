###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

{round, floor, ceil} = Math
{TILE_SIZE_PIXELS,
 PIXEL_SIZE_WORLD}   = require '../../constants'


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

FRAGMENT_SHADER =
  '''
  #ifdef GL_ES
  precision highp float;
  #endif

  /* Input variables. */
  varying vec2 vTextureCoord;
  uniform sampler2D uTexture;

  /* Output variables. */
  /* implicit vec4 gl_FragColor; */

  void main(void) {
    gl_FragColor = texture2D(uTexture, vTextureCoord);
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


# The WebGL renderer works much like the Direct2D renderer,
# but uses WebGL to accomplish it, of course.

class WebglRenderer
  constructor: (@images, @map) ->
    # Initialize the canvas.
    @canvas = $('<canvas/>')
    try
      @ctx = @canvas[0].getContext('experimental-webgl')
      @ctx.bindBuffer # Just access it, see if it throws.
    catch e
      throw "Could not initialize WebGL canvas: #{e.message}"
    @canvas.appendTo('body')

    # Because we do a lot of calls here, and it feels more natural,
    # assign the context to a local variable 'gl'.
    gl = @ctx

    # We use 2D textures and blending.
    # gl.enable(gl.TEXTURE_2D)  # Illegal and not required in WebGL / GLES 2.0.
    gl.enable(gl.BLEND)

    # When blending, apply the source's alpha channel.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    # Create and permanently bind the tilemap texture into texture unit 0.
    gl.activeTexture(gl.TEXTURE0)
    @tilemapTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, @tilemapTexture)
    # No scaling should ever be necessary, so pick the fastest algorithm.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    # This should prevent overflowing between tiles at least at the edge of the tilemap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    # Load the tilemap data into the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, @images.base)

    # Preparations for drawTile. Calculate the tile size in the texture coordinate space.
    @hTileSizeTexture = TILE_SIZE_PIXELS / @images.base.width
    @vTileSizeTexture = TILE_SIZE_PIXELS / @images.base.height

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
    @uTexture      = gl.getUniformLocation(@program, 'uTexture')

    # Enable vertex attributes as arrays.
    gl.enableVertexAttribArray(@aVertexCoord)
    gl.enableVertexAttribArray(@aTextureCoord)

    # Tell the fragment shader to take tilemap input from texture unit 0.
    gl.uniform1i(@uTexture, 0)

    # Allocate the translation matrix, and fill it with the identity matrix.
    # To do all of our transformations, we only need to change 4 elements.
    @transformArray = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ])

    # Allocate the vertex buffer for our quads.
    # This will store both vertex coordinates as well as texture coordinates.
    @vertexArray = new Float32Array(4*4)

    # Create and permanently bind the vertex buffer.
    @vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, @vertexBuffer)
    gl.vertexAttribPointer(@aVertexCoord,  2, gl.FLOAT, no, 16, 0)
    gl.vertexAttribPointer(@aTextureCoord, 2, gl.FLOAT, no, 16, 8)

    # Handle resizes.
    @handleResize()
    $(window).resize => @handleResize()

  handleResize: ->
    # Update the canvas size.
    @canvas[0].width  = window.innerWidth
    @canvas[0].height = window.innerHeight
    @canvas.css(
      width:  window.innerWidth + 'px'
      height: window.innerHeight + 'px'
    )
    @ctx.viewport(0, 0, window.innerWidth, window.innerHeight)

    # Recalculate the transformation matrix.
    @setTranslation(0, 0)

    # This seems like a good spot to do a quick check for errors.
    @checkError()

  checkError: ->
    gl = @ctx
    unless (err = gl.getError()) == gl.NO_ERROR
      throw "WebGL error: #{err}"
    return

  setTranslation: (px, py) ->
    # Rebuild the translation matrix.

    # A. Apply the requested translation by (px,py).
    # B. The WebGL coordinate space runs from -1 to 1.
    #    Scale the pixel coordinates to fit in the range 0 to 2.
    # C. Then translate to fit in the range -1 to 1.
    # D. The WebGL y-axis is inverted compared to what we want.
    #    So multiply the y-axis by -1.

    # To chain all this into one matrix, we have to apply these into reverse order.
    # The math then looks as follows:

    xt = 2 / window.innerWidth
    yt = 2 / window.innerHeight

    #               D                     C                     B                     A
    #     |   1   0   0   0 |   |   1   0   0  -1 |   |  xt   0   0   0 |   |   1   0   0  px |
    # T = |   0  -1   0   0 | x |   0   1   0  -1 | x |   0  xy   0   0 | x |   0   1   0  py |
    #     |   0   0   1   0 |   |   0   0   1   0 |   |   0   0   1   0 |   |   0   0   1   0 |
    #     |   0   0   0   1 |   |   0   0   0   1 |   |   0   0   0   1 |   |   0   0   0   1 |

    # To top that off, WebGL expects things in column major order.
    # So the array indices below should be read as being transposed.

    arr = @transformArray
    arr[0] =  xt
    arr[5] = -yt
    arr[12] = px *  xt - 1
    arr[13] = py * -yt + 1
    @ctx.uniformMatrix4fv(@uTransform, no, arr)

  centerOn: (x, y, cb) ->
    # Apply a translation that centers everything around the player.
    {width, height} = @canvas[0]
    left = round(x / PIXEL_SIZE_WORLD - width  / 2)
    top =  round(y / PIXEL_SIZE_WORLD - height / 2)
    @setTranslation(-left, -top)

    cb(left, top, width, height)

    @setTranslation(0, 0)

  drawTile: (tx, ty, sdx, sdy) ->
    # Calculate texture coordinate bounds for the tile.
    stx =  tx * @hTileSizeTexture
    sty =  ty * @vTileSizeTexture
    etx = stx + @hTileSizeTexture
    ety = sty + @vTileSizeTexture

    # Calculate pixel coordinate bounds for the destination.
    edx = sdx + TILE_SIZE_PIXELS
    edy = sdy + TILE_SIZE_PIXELS

    # Update the quad array.
    @vertexArray.set([
      sdx, sdy, stx, sty,
      sdx, edy, stx, ety,
      edx, sdy, etx, sty,
      edx, edy, etx, ety
    ])

    # Draw.
    gl = @ctx
    gl.bufferData(gl.ARRAY_BUFFER, @vertexArray, gl.DYNAMIC_DRAW)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  onRetile: (cell, tx, ty) ->
    # Simply cache the tile index.
    cell.tile = [tx, ty]

  drawMap: (sx, sy, w, h) ->
    # Calculate pixel boundaries.
    ex = sx + w - 1
    ey = sy + h - 1

    # Calculate tile boundaries.
    stx = floor(sx / TILE_SIZE_PIXELS)
    sty = floor(sy / TILE_SIZE_PIXELS)
    etx =  ceil(ex / TILE_SIZE_PIXELS)
    ety =  ceil(ey / TILE_SIZE_PIXELS)

    # Iterate each tile in view.
    @map.each (cell) =>
      # FIXME: use one large VBO to do this.
      @drawTile(
        cell.tile[0], cell.tile[1],
        cell.x * TILE_SIZE_PIXELS, cell.y * TILE_SIZE_PIXELS
      )
    , stx, sty, etx, ety


# Exports.
module.exports = WebglRenderer
