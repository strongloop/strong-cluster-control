'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');
var workerCount = require('./helpers').workerCount;

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('to last of concurrent resizes', function(t) {
  master.start({size: 10});
  master.on('startWorker', function() {
    if (workerCount() === 3) {
      master.setSize(5);
    }
    if (workerCount() === 5) {
      master.setSize(2);
    }
  });

  master.on('stopWorker', function() {
    if (workerCount() === 3) {
      master.setSize(0);
    }
    if (workerCount() === 0) {
      master.stop(t.end);
    }
  });
});
