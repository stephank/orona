# Bolo

Bolo is a top-down game of tank warfare originally written by Stuart Chesire for the BBC Micro and
Apple Macintosh, and also notably rewritten for Windows and Linux by John Morrison.

 * [The Bolo homepage][Bolo]
 * [The WinBolo homepage][WinBolo]
 * [The WinBolo project at Google Code][WinBolo project]

## Orona

Orona is another rewrite of Bolo, intended to be played in any modern browser. Orona is developed
in [CoffeeScript], and relies on some of the newer technologies made possible by HTML5.

The name comes from an uninhabited island situated in the central Pacific Ocean.

## Work-in-progress

Orona is a work-in-progress. Consider it less than alpha quality!

You can see Orona in action on-line, right now, without even having to download it.
Just visit the [GitHub Pages] for a demonstration.

## Hacking Orona

Orona depends on several other projects, which you will have to install to run it. Take a look
at their project pages on how to install them:

 * [CoffeeScript], the language Orona is written it.
 * [node.js], a server-side JavaScript framework.
 * [Connect], a node.js middleware framework.

To run Orona, simply run `cake run`, then visit 'http://localhost:8124/'.

## License

The source code of Orona is distributed with the GNU GPL version 2, as inherited from WinBolo.
Much of the game logic was written with WinBolo as a reference, thus becoming a derived work of it.
Though the GNU GPL version 2 is a fine license either way. You can find a copy of the license
in the COPYING file.

All the graphic and sound files are copyright 1993 Stuart Cheshire.

 [Bolo]: http://www.lgm.com/bolo/
 [WinBolo]: http://www.winbolo.com/
 [WinBolo project]: http://code.google.com/p/winbolo/
 [GitHub Pages]: http://stephank.github.com/orona/
 [CoffeeScript]: http://jashkenas.github.com/coffee-script/
 [node.js]: http://nodejs.org/
 [Connect]: http://github.com/senchalabs/connect
