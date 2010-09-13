###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# The following methods pack Fixnums in an array of bytes, in network byte order (MSB).

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


# This method works a bit like struct.pack() in Python.
# It takes a format string, and packs the rest of the arguments according to that.
pack = (fmt) ->
  data = []

  # These are to handle bit fields.
  bits = null
  bitIndex = 0
  flushBitFields = ->
    return unless bits != null
    data.push bits
    bits = null

  for c, i in fmt
    arg = arguments[i+1]
    if c == 'f'
      # A bit field.
      if bits == null
        bits = if !!arg then 1 else 0
        bitsIndex = 1
      else
        bits |= 1 << bitsIndex if !!arg
        bitsIndex++
        # We've collected eight, so add the byte.
        flushBitFields() if bitsIndex == 8
    else
      flushBitFields()
      # Simple byte-aligned data types.
      data = data.concat(switch c
        when 'B' then toUint8(arg)
        when 'H' then toUint16(arg)
        when 'I' then toUint32(arg)
        else throw new Error("Unknown format character #{c}")
      )
  flushBitFields()
  data


# The opposite of the above. Takes an array of bytes and an optional offset,
# and returns a pair containing:
#  * an array of values which are decoded according to the given format string.
#  * a length in bytes that was read.
unpack = (fmt, data, offset) ->
  offset ||= 0
  idx = offset
  values = []

  # These are to handle bit fields.
  bitIndex = 0

  for c, i in fmt
    if c == 'f'
      # A bit field.
      bit = (1 << bitIndex) & data[idx]
      values.push(bit > 0)
      bitIndex++
      # If we've collected eight, skip to the next byte.
      if bitIndex == 8
        idx++
        bitIndex = 0
    else
      # If we were processing bitfields, skip to the next byte.
      if bitIndex != 0
        idx++
        bitIndex = 0
      # Simple byte-aligned data types.
      [value, bytes] = switch c
        when 'B' then [ fromUint8(data, idx), 1]
        when 'H' then [fromUint16(data, idx), 2]
        when 'I' then [fromUint32(data, idx), 4]
        else throw new Error("Unknown format character #{c}")
      values.push value
      idx += bytes
  # Make sure we account for trailing bitfields.
  if bitIndex != 0
    idx++

  # Return the pair.
  [values, idx - offset]


# Exports
exports.pack = pack
exports.unpack = unpack
