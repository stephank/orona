# Functions that provide functionality somewhat like Python's `struct` module: packing and
# unpacking a bunch of values to and from binary data.
#
# The main differences with Python are that this version is far less featureful, of course, but
# also that this version is built for streaming, using a generator pattern. This allows the caller
# to make decisions mid-stream about the data that's going to follow.
#
# Because there's no standard way for dealing with binary data in JavaScript (yet), these functions
# deal with arrays of byte values instead.


#### Helpers

# The following methods pack numbers in an array of bytes, in network byte order.

toUint8  = (n) -> [
    n & 0xFF
  ]

toUint16 = (n) -> [
    (n & 0xFF00) >> 8,
     n & 0x00FF
  ]

toUint32 = (n) -> [
    (n & 0xFF000000) >> 24,
    (n & 0x00FF0000) >> 16,
    (n & 0x0000FF00) >> 8,
     n & 0x000000FF
  ]


# And the reverse of the above. Each takes an array of bytes, and an offset.

fromUint8  = (d, o) -> d[o]
fromUint16 = (d, o) -> (d[o] << 8) + d[o+1]
fromUint32 = (d, o) -> (d[o] << 24) + (d[o+1] << 16) + (d[o+2] << 8) + d[o+3]


#### Streaming packers

# Return a generator function, that is used to generate binary data. Basic usage is as follows:
#
#     packer = buildPacker()
#     packer('B', myByteValue)
#     packer('H', myShortValue)
#     packer('f', myBooleanValue)
#     packer('f', mySecondBooleanValue)
#     data = packer.finish()
#
# The format characters match those of Python's `struct`. However, only a subset is supported,
# namely `B`, `H`, and `I`. In addition to these, there's also a way to tightly pack bit fields,
# simply by using the `f` format character in repetition. The caller should take care to group
# bit fields, though.
buildPacker = ->
  data = []

  bits = null
  bitIndex = 0
  flushBitFields = ->
    return unless bits != null
    data.push bits
    bits = null

  retval = (type, value) ->
    if type == 'f'
      if bits == null
        bits = if !!value then 1 else 0
        bitIndex = 1
      else
        bits |= 1 << bitIndex if !!value
        bitIndex++
        flushBitFields() if bitIndex == 8
    else
      flushBitFields()
      data = data.concat(switch type
        when 'B' then toUint8(value)
        when 'H' then toUint16(value)
        when 'I' then toUint32(value)
        else throw new Error("Unknown format character #{type}")
      )

  retval.finish = ->
    flushBitFields()
    data

  retval


# The opposite of the above. Takes an array of bytes and an optional offset, and returns a
# generator which can be repeatedly called to get values from the input data. For example:
#
#     unpacker = buildUnpacker()
#     myByteValue = unpacker('B')
#     myShortValue = unpacker('H')
#     myBooleanValue = unpacker('f')
#     mySecondBooleanValue = unpacker('f')
#     bytesTaken = unpacker.finish()
buildUnpacker = (data, offset) ->
  offset ||= 0
  idx = offset

  bitIndex = 0

  retval = (type) ->
    if type == 'f'
      bit = (1 << bitIndex) & data[idx]
      value = bit > 0
      bitIndex++
      if bitIndex == 8
        idx++
        bitIndex = 0
    else
      if bitIndex != 0
        idx++
        bitIndex = 0
      [value, bytes] = switch type
        when 'B' then [ fromUint8(data, idx), 1]
        when 'H' then [fromUint16(data, idx), 2]
        when 'I' then [fromUint32(data, idx), 4]
        else throw new Error("Unknown format character #{type}")
      idx += bytes
    value

  retval.finish = ->
    idx++ if bitIndex != 0
    idx - offset

  retval


#### Non-streaming packers
#
# These work more like Python's `struct`.

# The `pack` function takes a format string, and the respective values as its arguments. It then
# returns the binary data as an array of byte values.
pack = (fmt) ->
  packer = buildPacker()
  for type, i in fmt
    value = arguments[i+1]
    packer(type, value)
  packer.finish()

# The `unpack` function takes a format string, an array of bytes and an optional offset. The return
# value is a pair containing an array of the unpacked values, and the number of bytes taken.
unpack = (fmt, data, offset) ->
  unpacker = buildUnpacker(data, offset)
  values = for type in fmt then unpacker(type)
  [values, unpacker.finish()]


#### Exports
exports.buildPacker = buildPacker
exports.buildUnpacker = buildUnpacker
exports.pack = pack
exports.unpack = unpack
