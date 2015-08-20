'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');
var workerCount = require('./helpers').workerCount;

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('from size 3 to 1', function(t) {
  master.start({size: 3});
  master.on('startWorker', function() {
    if (workerCount() === 3) {
      master.setSize(1);
    }
  });
  master.once('stopWorker', function() {
    t.equal(workerCount(), 2);
    master.once('stopWorker', function() {
      t.equal(workerCount(), 1);
      master.stop(t.end);
    });
  });
});
