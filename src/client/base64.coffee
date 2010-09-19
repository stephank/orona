# A base64 decoder, because we don't have one in the browser.
# The output is an array of byte values as numbers, much like a node.js Buffer.
#
# Note that this is a very simple implementation. It doesn't cope with whitespace, and breaks on
# otherwise invalid input. For example, it's known to break when the padding character is injected
# in the middle.


decodeBase64 = (input) ->
  unless input.length % 4 == 0
    throw new Error "Invalid base64 input length, not properly padded?"

  outputLength = input.length / 4 * 3
  tail = input.substr(-2)
  outputLength-- if tail[0] == '='
  outputLength-- if tail[1] == '='

  output = new Array(outputLength)
  quad = new Array(4)
  outputIndex = 0
  for c, i in input
    cc = c.charCodeAt(0)

    # Gather the numerical values of the next group of 4 characters.
    quadIndex = i % 4
    quad[quadIndex] =
      if      65 <= cc <=  90 then cc - 65 # A-Z
      else if 97 <= cc <= 122 then cc - 71 # a-z
      else if 48 <= cc <=  57 then cc + 4  # 0-9
      else if       cc ==  43 then 62      # +
      else if       cc ==  47 then 63      # /
      else if       cc ==  61 then -1      # Padding
      else throw new Error "Invalid base64 input character: #{c}"

    # Did we complete a quad? If so, calculate the octet values and add them to the output.
    # We take bits from the character values as follows: 000000 001111 111122 222222
    continue unless quadIndex == 3
    output[outputIndex++] = ((quad[0] & 0x3F) << 2) + ((quad[1] & 0x30) >> 4)
    output[outputIndex++] = ((quad[1] & 0x0F) << 4) + ((quad[2] & 0x3C) >> 2) unless quad[2] == -1
    output[outputIndex++] = ((quad[2] & 0x03) << 6) + ((quad[3] & 0x3F)     ) unless quad[3] == -1

  # Return output.
  output


#### Exports
exports.decodeBase64 = decodeBase64
