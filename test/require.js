var _ = require('lodash');
var assert = require('assert');
var control = require('../index');
var master = require('../lib/master');

describe('require', function() {
  it('should expose master', function() {
    assert.equal(control.start, master.start);
    assert.equal(control.stop, master.stop);
    assert.equal(control.ADDR, master.ADDR);
  });

  it('should set the master process startTime', function() {
    assert(_.isFinite(master.startTime));
  });

  it.skip('should expose null ops in slave', function() {
    // XXX(sam) how to test with mocha?
  });
});
