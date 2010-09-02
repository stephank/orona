# Joyent deployment branch

**Don't work off of this branch! It's often rebased against `master`.**

This branch contains a dead simple `server.js` for use with Joyent.

It also contains an script to automate deployment called `deploy.js`. To use it, create a remote
called 'joyent'. It's also recommended to run it with the environment variable `CLOSURE` set to
the jar-file of Google Closure, and make sure `java` is in your `PATH`.
