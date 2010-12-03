(function() {
  var EventEmitter, WebSocket, createHash;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  EventEmitter = require('events').EventEmitter;
  createHash = require('crypto').createHash;
  WebSocket = function() {
    function WebSocket(request, connection, initialData) {
      this.request = request;
      this.connection = connection;
      WebSocket.__super__.constructor.apply(this, arguments);
      this.connection.setTimeout(0);
      this.connection.setEncoding('utf8');
      this.connection.setNoDelay(true);
      this.data = initialData.toString('binary');
      this.queued = [];
      process.nextTick(__bind(function() {
        return this._handshake();
      }, this));
      this.connection.on('data', __bind(function(data) {
        return this._onData(data);
      }, this));
      this.connection.on('end', __bind(function() {
        return this._onEnd();
      }, this));
      this.connection.on('timeout', __bind(function() {
        return this._onTimeout();
      }, this));
      this.connection.on('drain', __bind(function() {
        return this._onDrain();
      }, this));
      this.connection.on('error', __bind(function() {
        return this._onError();
      }, this));
      this.connection.on('close', __bind(function() {
        return this._onClose();
      }, this));
    }
    __extends(WebSocket, EventEmitter);
    WebSocket.prototype._handshake = function() {
      var headers, k, k1, k2, k3, md5, message, n, origin, spaces, _i, _j, _len, _len2, _ref, _ref2;
      if (this.data.length < 8) {
        return;
      }
      k1 = this.request.headers['sec-websocket-key1'];
      k2 = this.request.headers['sec-websocket-key2'];
      if (!(k1 && k2)) {
        this.emit('error', new Error("Keys missing in client handshake"));
      }
      k3 = this.data.slice(0, 8);
      this.data = this.data.slice(8);
      md5 = createHash('md5');
      _ref = [k1, k2];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        n = parseInt(k.replace(/[^\d]/g, ''));
        spaces = k.replace(/[^ ]/g, '').length;
        if (spaces === 0 || n % spaces !== 0) {
          this.emit('error', new Error("Invalid Keys in client handshake"));
        }
        n /= spaces;
        md5.update(new Buffer([(n & 0xFF000000) >> 24, (n & 0x00FF0000) >> 16, (n & 0x0000FF00) >> 8, (n & 0x000000FF) >> 0]));
      }
      md5.update(k3);
      md5 = new Buffer(md5.digest('base64'), 'base64');
      origin = this.request.headers.origin;
      headers = ['HTTP/1.1 101 WebSocket Protocol Handshake', 'Upgrade: WebSocket', 'Connection: Upgrade', 'Sec-WebSocket-Origin: ' + (origin || 'null'), 'Sec-WebSocket-Location: ws://' + this.request.headers.host + this.request.url];
      if (__indexOf.call(this.request.headers, 'sec-websocket-protocol') >= 0) {
        headers.push('Sec-WebSocket-Protocol: ' + this.request.headers['sec-websocket-protocol']);
      }
      headers = headers.concat('', '').join('\r\n');
      this.connection.write(headers, 'utf-8');
      this.connection.write(md5);
      delete this.request;
      _ref2 = this.queued;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        message = _ref2[_j];
        this.sendMessage(message);
      }
      delete this.queued;
      this.emit('connect');
      if (this.data.length > 0) {
        return this._onData();
      }
    };
    WebSocket.prototype._onData = function(data) {
      var chunk, chunks, _i, _len;
      if (data != null) {
        this.data += data;
      }
      if (this.request != null) {
        this._handshake();
      } else {
        chunks = this.data.split('\ufffd');
        this.data = chunks.pop();
        for (_i = 0, _len = chunks.length; _i < _len; _i++) {
          chunk = chunks[_i];
          if (chunk[0] !== '\u0000') {
            return this.connection.end();
          }
          this.emit('message', chunk.slice(1));
        }
      }
      return;
    };
    WebSocket.prototype.sendMessage = function(message) {
      var buffer, messageLength;
      if (this.request != null) {
        this.queued.push(message);
        return;
      }
      messageLength = Buffer.byteLength(message, 'utf-8');
      buffer = new Buffer(messageLength + 2);
      buffer[0] = 0x00;
      buffer.write(message, 1, 'utf-8');
      buffer[messageLength + 1] = 0xFF;
      try {
        return this.connection.write(buffer);
      } catch (e) {
        return this.emit('error', e);
      }
    };
    WebSocket.prototype.end = function(message) {
      if (message != null) {
        this.sendMessage(message);
      }
      return this.connection.end();
    };
    WebSocket.prototype.setTimeout = function(ms) {
      return this.connection.setTimeout(ms);
    };
    WebSocket.prototype.destroy = function() {
      return this.connection.destroy();
    };
    WebSocket.prototype._onEnd = function() {
      return this.emit('end');
    };
    WebSocket.prototype._onTimeout = function() {
      return this.emit('timeout');
    };
    WebSocket.prototype._onDrain = function() {
      return this.emit('drain');
    };
    WebSocket.prototype._onError = function(exception) {
      return this.emit('error', exception);
    };
    WebSocket.prototype._onClose = function(had_error) {
      return this.emit('close', had_error);
    };
    return WebSocket;
  }();
  module.exports = WebSocket;
}).call(this);
