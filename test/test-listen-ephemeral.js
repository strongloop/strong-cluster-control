'use strict';

// Bail when run by mocha
if ('describe' in global) {
  describe(module.parent.filename, function() {
    it.skip('run test with tap, not mocha', function(){});
  });
  return;
}

if (process.env.CHILD) return child();

function child() {
  var assert = require('assert');
  console.log('worker starting');
  assert(process.env.PORT);
  require('net').createServer().listen(process.env.PORT || 3000)
    .on('listening', function(addr) {
      console.log('worker listen on %d', addr.port);
      assert.notEqual(String(addr.port), process.env.PORT);
      assert.notEqual(addr.port, 3000);
    });
  return;
}

// env will be inherited by child, which will use node cluster
process.env.CHILD = true;

var assert = require('assert');
var cluster = require('../lib/cluster');
var control = require('../');

process.env.PORT = '0';

control.start({size: 1});

cluster.on('listening', function(worker, listen) {
  console.log('listening: wid %j port %j', worker.id, listen.port);
  assert.equal(listen.port, process.env.PORT);
  control.stop();
});
