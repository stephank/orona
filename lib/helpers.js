(function() {
  var atan2, distance, extend, heading, sqrt;
  sqrt = Math.sqrt, atan2 = Math.atan2;
  extend = exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };
  distance = exports.distance = function(a, b) {
    var dx, dy;
    dx = a.x - b.x;
    dy = a.y - b.y;
    return sqrt(dx * dx + dy * dy);
  };
  heading = exports.heading = function(a, b) {
    return atan2(b.y - a.y, b.x - a.x);
  };
}).call(this);
