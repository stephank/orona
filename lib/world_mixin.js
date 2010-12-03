(function() {
  var BoloWorldMixin;
  BoloWorldMixin = {
    boloInit: function() {
      return this.tanks = [];
    },
    addTank: function(tank) {
      tank.tank_idx = this.tanks.length;
      this.tanks.push(tank);
      if (this.authority) {
        return this.resolveMapObjectOwners();
      }
    },
    removeTank: function(tank) {
      var i, _ref, _ref2;
      this.tanks.splice(tank.tank_idx, 1);
      for (i = _ref = tank.tank_idx, _ref2 = this.tanks.length; (_ref <= _ref2 ? i < _ref2 : i > _ref2); (_ref <= _ref2 ? i += 1 : i -= 1)) {
        this.tanks[i].tank_idx = i;
      }
      if (this.authority) {
        return this.resolveMapObjectOwners();
      }
    },
    getAllMapObjects: function() {
      return this.map.pills.concat(this.map.bases);
    },
    spawnMapObjects: function() {
      var obj, _i, _len, _ref;
      _ref = this.getAllMapObjects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        obj.world = this;
        this.insert(obj);
        obj.spawn();
        obj.anySpawn();
      }
      return;
    },
    resolveMapObjectOwners: function() {
      var obj, _i, _len, _ref, _ref2;
      _ref = this.getAllMapObjects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        obj.ref('owner', this.tanks[obj.owner_idx]);
        if ((_ref2 = obj.cell) != null) {
          _ref2.retile();
        }
      }
      return;
    }
  };
  module.exports = BoloWorldMixin;
}).call(this);
