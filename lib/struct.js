(function() {
  var buildPacker, buildUnpacker, fromUint16, fromUint32, fromUint8, pack, toUint16, toUint32, toUint8, unpack;
  toUint8 = function(n) {
    return [n & 0xFF];
  };
  toUint16 = function(n) {
    return [(n & 0xFF00) >> 8, n & 0x00FF];
  };
  toUint32 = function(n) {
    return [(n & 0xFF000000) >> 24, (n & 0x00FF0000) >> 16, (n & 0x0000FF00) >> 8, n & 0x000000FF];
  };
  fromUint8 = function(d, o) {
    return d[o];
  };
  fromUint16 = function(d, o) {
    return (d[o] << 8) + d[o + 1];
  };
  fromUint32 = function(d, o) {
    return (d[o] << 24) + (d[o + 1] << 16) + (d[o + 2] << 8) + d[o + 3];
  };
  buildPacker = function() {
    var bitIndex, bits, data, flushBitFields, retval;
    data = [];
    bits = null;
    bitIndex = 0;
    flushBitFields = function() {
      if (bits === null) {
        return;
      }
      data.push(bits);
      return bits = null;
    };
    retval = function(type, value) {
      if (type === 'f') {
        if (bits === null) {
          bits = !!value ? 1 : 0;
          return bitIndex = 1;
        } else {
          if (!!value) {
            bits |= 1 << bitIndex;
          }
          bitIndex++;
          if (bitIndex === 8) {
            return flushBitFields();
          }
        }
      } else {
        flushBitFields();
        return data = data.concat(function() {
          switch (type) {
            case 'B':
              return toUint8(value);
            case 'H':
              return toUint16(value);
            case 'I':
              return toUint32(value);
            default:
              throw new Error("Unknown format character " + type);
          }
        }());
      }
    };
    retval.finish = function() {
      flushBitFields();
      return data;
    };
    return retval;
  };
  buildUnpacker = function(data, offset) {
    var bitIndex, idx, retval;
    offset || (offset = 0);
    idx = offset;
    bitIndex = 0;
    retval = function(type) {
      var bit, bytes, value, _ref;
      if (type === 'f') {
        bit = (1 << bitIndex) & data[idx];
        value = bit > 0;
        bitIndex++;
        if (bitIndex === 8) {
          idx++;
          bitIndex = 0;
        }
      } else {
        if (bitIndex !== 0) {
          idx++;
          bitIndex = 0;
        }
        _ref = function() {
          switch (type) {
            case 'B':
              return [fromUint8(data, idx), 1];
            case 'H':
              return [fromUint16(data, idx), 2];
            case 'I':
              return [fromUint32(data, idx), 4];
            default:
              throw new Error("Unknown format character " + type);
          }
        }(), value = _ref[0], bytes = _ref[1];
        idx += bytes;
      }
      return value;
    };
    retval.finish = function() {
      if (bitIndex !== 0) {
        idx++;
      }
      return idx - offset;
    };
    return retval;
  };
  pack = function(fmt) {
    var i, packer, type, value, _len;
    packer = buildPacker();
    for (i = 0, _len = fmt.length; i < _len; i++) {
      type = fmt[i];
      value = arguments[i + 1];
      packer(type, value);
    }
    return packer.finish();
  };
  unpack = function(fmt, data, offset) {
    var type, unpacker, values, _i, _len, _results;
    unpacker = buildUnpacker(data, offset);
    values = function() {
      _results = [];
      for (_i = 0, _len = fmt.length; _i < _len; _i++) {
        type = fmt[_i];
        _results.push(unpacker(type));
      }
      return _results;
    }();
    return [values, unpacker.finish()];
  };
  exports.buildPacker = buildPacker;
  exports.buildUnpacker = buildUnpacker;
  exports.pack = pack;
  exports.unpack = unpack;
}).call(this);
