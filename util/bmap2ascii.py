#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, struct, copy

fo = open(sys.argv[1], 'r')

if fo.read(8) != "BMAPBOLO":
  raise ValueError('Not a Bolo map')
version, numPills, numBases, numStarts = struct.unpack('>BBBB', fo.read(4))
if version != 1:
  raise ValueError('Unsupported map version')

pills = []
for i in range(numPills):
  pills.append(struct.unpack('>BBBBB', fo.read(5)))

bases = []
for i in range(numBases):
  bases.append(struct.unpack('>BBBBBB', fo.read(6)))

starts = []
for i in range(numStarts):
  starts.append(struct.unpack('>BBB', fo.read(3)))


m = []
col = ['^ '] * 256
for y in range(256):
  m.append(copy.copy(col))

def nibble_generator(data):
  for c in data:
    c = ord(c)
    yield (c & 0xF0) >> 4
    yield  c & 0x0F

terrain_num2ascii = [
  '| ', '  ', '~ ', '% ', '= ', '# ', ': ', '. ', '} ', 'b ',
              '~*', '%*', '=*', '#*', ':*', '.*'
]

while True:
  datalen, y, startx, endx = struct.unpack('>BBBB', fo.read(4))
  datalen -= 4

  if datalen == 0 and y == startx == endx == 0xFF:
    break

  run = fo.read(datalen)
  if len(run) != datalen:
    raise ValueError('Incomplete run data')
  nibbles = nibble_generator(run)

  x = startx
  while x < endx:
    seqlen = nibbles.next()
    if seqlen < 8:
      seqlen += 1
      for i in range(seqlen):
        m[y][x] = terrain_num2ascii[nibbles.next()]
        x += 1
    else:
      seqlen -= 6
      s = nibbles.next()
      for i in range(seqlen):
        m[y][x] = terrain_num2ascii[s]
        x += 1


print "Bolo map, version 0"
print

print "Pills:"
for pill in pills:
  print "  @%d,%d owner:%d armour:%d speed:%d" % pill
print

print "Bases:"
for base in bases:
  print "  @%d,%d owner:%d armour:%d shells:%d mines:%d" % base
print

print "Starting positions:"
for start in starts:
  print "  @%d,%d direction:%d" % start
print

for row in m:
  print ''.join(row)
