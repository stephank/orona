(function() {
  exports.registerWithWorld = function(w) {
    w.registerType(require('./world_pillbox'));
    w.registerType(require('./world_base'));
    w.registerType(require('./flood_fill'));
    w.registerType(require('./tank'));
    w.registerType(require('./explosion'));
    w.registerType(require('./mine_explosion'));
    w.registerType(require('./shell'));
    w.registerType(require('./fireball'));
    return w.registerType(require('./builder'));
  };
}).call(this);
