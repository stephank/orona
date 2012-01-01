# Bolo

Bolo is a top-down game of tank warfare originally written by Stuart Cheshire for the BBC Micro and
Apple Macintosh, and also notably rewritten for Windows and Linux by John Morrison.

 * [The Bolo homepage][Bolo]
 * [The WinBolo homepage][WinBolo]
 * [The WinBolo project at Google Code][WinBolo project]

## Orona

Orona is another rewrite of Bolo, intended to be played in any modern browser. Orona is developed
in [CoffeeScript], and relies on some of the newer technologies made possible by HTML5.

The name comes from an uninhabited island situated in the central Pacific Ocean.

## Playing Orona

Orona is alpha quality, but still very playable. Take a look at [GitHub Pages] to see a single
player game in action, which should work on most modern browsers. There's also a
[multiplayer instance] kindly hosted by [Joyent], but browser support is more limited.

If you're seeing odd things in your browser, take a look at the [browser compatibility] wiki page,
and feel free to extend it with your experiences. [Issue] reports are also welcome.

## Running an Orona server

These instructions are written from a Linux perspective, but they should work for Mac OS X, or
other Unix-likes that can run node.js. Some commandline-fu is required.

A fast way to get going is to install [node.js] 0.2.x, [npm], and then Orona itself:

    npm install orona
    bolo-server

You will need a small config file; `bolo-server` will tell you how to create one. Note that the IRC
functionality is optional, but the only way to do match-making at the moment. If you don't want to
connect to an IRC network, simply remove the `irc` section from the config file.

## Hacking Orona

The Orona project lives on [GitHub]. You can grab the source using:

    git clone http://github.com/stephank/orona.git
    cd orona

If you've installed Orona using npm before, most dependencies should already be installed.
Otherwise, take a look at the `package.json` file for what you need. You also need [CoffeeScript]:

    npm install coffee-script

Then, to build and run from the source directory, do:

    cake build
    bin/bolo-server

## License

The source code of Orona is distributed with the GNU GPL version 2, as inherited from WinBolo.
Much of the game logic was written with WinBolo as a reference, thus becoming a derived work of it.
Though the GNU GPL version 2 is a fine license either way. You can find a copy of the license
in the COPYING file.

Some files, or parts of files, are subject to other licenses, where indicated in the files
themselves. A short overview of those parts follows.

The source file 'src/server/websocket.coffee' is a modification/rewrite based on:

 * [Socket.IO], © 2010 LearnBoost, MIT-licensed.

All the graphic and sound files are from:

 * [Bolo], © 1993 Stuart Cheshire.

For the browser client, Orona also bundles:

 * [jQuery], © 2010 John Resig, licensed MIT and GPLv2.
 * [Sizzle], © 2010 The Dojo Foundation, licensed MIT, BSD and GPL.
 * [jQuery UI], © 2010 The jQuery UI Team, licensed MIT and GPLv2.
 * [jQuery Cookie plugin], © 2006 Klaus Hartl, licensed MIT and GPLv2.
 * Components that are part of [Villain].

 [Bolo]: http://www.bolo.net/
 [WinBolo]: http://www.winbolo.com/
 [WinBolo project]: http://code.google.com/p/winbolo/
 [CoffeeScript]: http://jashkenas.github.com/coffee-script/
 [GitHub Pages]: http://stephank.github.com/orona/
 [multiplayer instance]: http://orona.no.de/
 [Joyent]: http://www.joyent.com/
 [browser compatibility]: http://github.com/stephank/orona/wiki/Browser-compatibility
 [Issue]: http://github.com/stephank/orona/issues
 [node.js]: http://nodejs.org/
 [npm]: http://github.com/isaacs/npm
 [GitHub]: http://github.com/stephank/orona
 [Socket.IO]: http://socket.io/
 [jQuery]: http://jquery.com/
 [Sizzle]: http://sizzlejs.com/
 [jQuery UI]: http://jqueryui.com/
 [jQuery Cookie plugin]: http://plugins.jquery.com/project/Cookie
 [Villain]: http://github.com/stephank/villain
