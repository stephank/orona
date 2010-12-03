(function() {
  var SoundKit;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  SoundKit = function() {
    function SoundKit() {
      var dummy;
      this.sounds = {};
      this.isSupported = false;
      if (typeof Audio != "undefined" && Audio !== null) {
        dummy = new Audio();
        this.isSupported = dummy.canPlayType != null;
      }
    }
    SoundKit.prototype.register = function(name, url) {
      this.sounds[name] = url;
      return this[name] = __bind(function() {
        return this.play(name);
      }, this);
    };
    SoundKit.prototype.load = function(name, url, cb) {
      var loader;
      this.register(name, url);
      if (!this.isSupported) {
        return typeof cb === "function" ? cb() : void 0;
      }
      loader = new Audio();
      if (cb) {
        $(loader).one('canplaythrough', cb);
      }
      $(loader).one('error', __bind(function(e) {
        switch (e.code) {
          case e.MEDIA_ERR_SRC_NOT_SUPPORTED:
            this.isSupported = false;
            return typeof cb === "function" ? cb() : void 0;
        }
      }, this));
      loader.src = url;
      return loader.load();
    };
    SoundKit.prototype.play = function(name) {
      var effect;
      if (!this.isSupported) {
        return;
      }
      effect = new Audio();
      effect.src = this.sounds[name];
      effect.play();
      return effect;
    };
    return SoundKit;
  }();
  module.exports = SoundKit;
}).call(this);
