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

Orona is a work-in-progress, thus you will find many basic features are missing.
Consider it less than alpha quality!

But there is something to see, and you can see it in action on-line, right now, without even having
to download it. (Though you'll be alone in the game.) Just visit the [GitHub Pages] site for a
demonstration!

If you want to play around with multi-player, or otherwise tinker with Orona, read on for how to
get Orona running on your own machine.

## Running Orona

Orona depends on several other projects, which you will have to install to run it. You'll find this
is easiest on a Linux or Mac OS X machine, though you need a bit of commandline-fu to get it all
set up. Here's the recipe:

 * [CoffeeScript], the language Orona is written in. Tested with 0.9.4.
 * [node.js], a server-side JavaScript framework. Tested with 0.2.0.
 * [Connect], a node.js middleware framework. Tested with 0.2.4.

A fast way to get going is to install node.js, then install [npm], and use npm to install the rest:

    npm install coffee-script
    npm install connect

To run Orona, clone it, build it, then run it:

    git clone http://github.com/stephank/orona.git
    cd orona
    cake build
    bin/bolo-server

Now visit `http://localhost:8124/bolo.html`.

## License

The source code of Orona is distributed with the GNU GPL version 2, as inherited from WinBolo.
Much of the game logic was written with WinBolo as a reference, thus becoming a derived work of it.
Though the GNU GPL version 2 is a fine license either way. You can find a copy of the license
in the COPYING file.

Some files, or parts of files, are subject to other licenses, where indicated in the files
themselves. A short overview of those parts follows.

Parts of the 'Cakefile' are based on:

 * [CoffeeScript] 'command.coffee', © 2010 Jeremy Ashkenas, MIT-licensed.
 * [Yabble] 'yabbler.js', © 2010 James Brantly, MIT-licensed.

The source file 'src/server/websocket.coffee' is a modification/rewrite based on:

 * [Socket.IO], © 2010 LearnBoost, MIT-licensed.

The source file 'src/client/brequire.coffee' is a modification based on:

 * [Brequire], © 2010 Jonah Fox.

All the graphic and sound files are from:

 * [Bolo], © 1993 Stuart Cheshire.

 [Bolo]: http://www.lgm.com/bolo/
 [WinBolo]: http://www.winbolo.com/
 [WinBolo project]: http://code.google.com/p/winbolo/
 [GitHub Pages]: http://stephank.github.com/orona/
 [CoffeeScript]: http://jashkenas.github.com/coffee-script/
 [node.js]: http://nodejs.org/
 [Connect]: http://github.com/senchalabs/connect
 [npm]: http://github.com/isaacs/npm
 [Yabble]: http://github.com/jbrantly/yabble
 [Socket.IO]: http://socket.io/
 [Brequire]: http://github.com/weepy/brequire
