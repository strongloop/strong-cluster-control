'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');
var workerCount = require('./helpers').workerCount;

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('from size 1 to 2', function(t) {
  master.start({size: 1});
  master.once('startWorker', function() {
    master.setSize(2);
    master.once('startWorker', function() {
      t.equal(workerCount(), 2);
      master.stop(t.end);
    });
  });
});
