'use strict';

// Bail when run by mocha
if ('describe' in global) {
  describe(module.parent.filename, function() {
    it.skip('run test with tap, not mocha', function(){});
  });
  return;
}

if (process.env.CHILD) {
  console.log('worker starting');
  require('net').createServer().listen(process.env.PORT || 3000);
  return;
}

// Fixed PORT triggers 'default' mode, wherein all workers listen on a single
// shared port.
process.env.PORT = 3456;

// env will be inherited by child, which will use node cluster
process.env.CHILD = true;

var assert = require('assert');
var cluster = require('../lib/cluster');
var control = require('../');

control.start({size: 1});

cluster.on('listening', function(worker, listen) {
  console.log('listening: wid %j port %j', worker.id, listen.port);
  assert.equal(listen.port, process.env.PORT);
  control.stop();
});
