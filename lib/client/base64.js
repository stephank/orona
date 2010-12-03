(function() {
  var decodeBase64;
  decodeBase64 = function(input) {
    var c, cc, i, output, outputIndex, outputLength, quad, quadIndex, tail, _len;
    if (input.length % 4 !== 0) {
      throw new Error("Invalid base64 input length, not properly padded?");
    }
    outputLength = input.length / 4 * 3;
    tail = input.substr(-2);
    if (tail[0] === '=') {
      outputLength--;
    }
    if (tail[1] === '=') {
      outputLength--;
    }
    output = new Array(outputLength);
    quad = new Array(4);
    outputIndex = 0;
    for (i = 0, _len = input.length; i < _len; i++) {
      c = input[i];
      cc = c.charCodeAt(0);
      quadIndex = i % 4;
      quad[quadIndex] = function() {
        if (65 <= cc && cc <= 90) {
          return cc - 65;
        } else if (97 <= cc && cc <= 122) {
          return cc - 71;
        } else if (48 <= cc && cc <= 57) {
          return cc + 4;
        } else if (cc === 43) {
          return 62;
        } else if (cc === 47) {
          return 63;
        } else if (cc === 61) {
          return -1;
        } else {
          throw new Error("Invalid base64 input character: " + c);
        }
      }();
      if (quadIndex !== 3) {
        continue;
      }
      output[outputIndex++] = ((quad[0] & 0x3F) << 2) + ((quad[1] & 0x30) >> 4);
      if (quad[2] !== -1) {
        output[outputIndex++] = ((quad[1] & 0x0F) << 4) + ((quad[2] & 0x3C) >> 2);
      }
      if (quad[3] !== -1) {
        output[outputIndex++] = ((quad[2] & 0x03) << 6) + (quad[3] & 0x3F);
      }
    }
    return output;
  };
  exports.decodeBase64 = decodeBase64;
}).call(this);
