###
Orona, © 2010 Stéphan Kochen

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.
###

# This module contains just a large map of team colours and descriptive their names.
TEAM_COLORS = [
  # Primaries:
  { r: 255, g:   0, b:   0, name: 'red'     }
  { r:   0, g:   0, b: 255, name: 'blue'    }
  { r:   0, g: 255, b:   0, name: 'green'   }

  # Secondaries:
  { r:   0, g: 255, b: 255, name: 'cyan'    }
  { r: 255, g: 255, b:   0, name: 'yellow'  }
  { r: 255, g:   0, b: 255, name: 'magenta' }

  # FIXME: Need some more here, probably at least 16 total.
]


# Exports.
module.exports = TEAM_COLORS
