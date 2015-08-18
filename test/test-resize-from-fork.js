'use strict';

var _ = require('lodash');
var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');
var workerCount = require('./helpers').workerCount;

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('should resize from a fork before start', function(t) {
  var sawNewWorker = 0;
  cluster.fork();
  master.start({size: 3});
  master.once('startWorker', function startWorker(worker) {
    // Make sure our argument is really a worker.
    t.assert(worker);
    t.assert(worker.id);
    t.assert(worker.process.pid);
    t.assert(_.isFinite(worker.startTime));

    sawNewWorker += 1;

    if (sawNewWorker === 2) {
      t.equal(workerCount(), 3);
      t.end();
    }
    master.once('startWorker', startWorker);
  });
  t.on('end', master.stop);
});
