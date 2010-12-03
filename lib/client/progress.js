(function() {
  var EventEmitter, Progress;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  Progress = function() {
    function Progress(initialAmount) {
      this.lengthComputable = true;
      this.loaded = 0;
      this.total = initialAmount != null ? initialAmount : 0;
      this.wrappingUp = false;
    }
    __extends(Progress, EventEmitter);
    Progress.prototype.add = function() {
      var amount, args, cb;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (typeof args[0] === 'number') {
        amount = args.shift();
      } else {
        amount = 1;
      }
      if (typeof args[0] === 'function') {
        cb = args.shift();
      } else {
        cb = null;
      }
      this.total += amount;
      this.emit('progress', this);
      return __bind(function() {
        this.step(amount);
        return typeof cb === "function" ? cb() : void 0;
      }, this);
    };
    Progress.prototype.step = function(amount) {
      if (amount == null) {
        amount = 1;
      }
      this.loaded += amount;
      this.emit('progress', this);
      return this.checkComplete();
    };
    Progress.prototype.set = function(total, loaded) {
      this.total = total;
      this.loaded = loaded;
      this.emit('progress', this);
      return this.checkComplete();
    };
    Progress.prototype.wrapUp = function() {
      this.wrappingUp = true;
      return this.checkComplete();
    };
    Progress.prototype.checkComplete = function() {
      if (!(this.wrappingUp && this.loaded >= this.total)) {
        return;
      }
      return this.emit('complete');
    };
    return Progress;
  }();
  module.exports = Progress;
}).call(this);
