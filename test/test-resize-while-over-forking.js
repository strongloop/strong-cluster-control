'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');
var workerCount = require('./helpers').workerCount;

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('while too many workers are forked', function(t) {
  master.start({size: 5});
  master.on('startWorker', function() {
    if (workerCount() === 3) {
      cluster.fork();
      cluster.fork();
      cluster.fork();
      cluster.fork();
    }
  });
  master.once('resize', function(size) {
    t.equal(size, 5);
    master.stop(t.end);
  });
});
