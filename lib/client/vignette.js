(function() {
  var Vignette;
  Vignette = function() {
    function Vignette() {
      this.container = $('<div class="vignette"/>').appendTo('body');
      this.messageLine = $('<div class="vignette-message"/>').appendTo(this.container);
    }
    Vignette.prototype.message = function(text) {
      return this.messageLine.text(text);
    };
    Vignette.prototype.showProgress = function() {};
    Vignette.prototype.hideProgress = function() {};
    Vignette.prototype.progress = function(p) {};
    Vignette.prototype.destroy = function() {
      this.container.remove();
      return this.container = this.messageLine = null;
    };
    return Vignette;
  }();
  module.exports = Vignette;
}).call(this);
