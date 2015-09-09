var _ = require('lodash');
var control = require('../index');
var master = require('../lib/master');
var tap = require('tap');

tap.test('require', function(t) {
  t.test('should expose master', function(t) {
    t.equal(control.start, master.start);
    t.equal(control.stop, master.stop);
    t.equal(control.ADDR, master.ADDR);
    t.end();
  });

  t.test('should set the master process startTime', function(t) {
    t.assert(_.isFinite(master.startTime));
    t.end();
  });

  t.end();
});
