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
        bits = 1
        bitsIndex = 1
      else
        bits |= 1 << bitsIndex
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


# The opposite of the above. Takes an array of bytes and an optional offset, and returns an array
# of values which are decoded according to the given format string.
unpack = (fmt, data, offset) ->
  offset ||= 0
  # FIXME
  []


# Exports
exports.pack = pack
exports.unpack = unpack
