'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');

tap.test('should use options.env with fork', function(t) {
  cluster.setupMaster({
    exec: 'test/workers/null.js'
  });

  t.on('end', master.stop);

  master.start({
    size: 1,
    env: {SOME_VAR: 'MY VALUE'}
  });

  master.once('startWorker', function(worker) {
    worker.once('message', function(msg) {
      t.equal(msg.env.SOME_VAR, 'MY VALUE');
      t.end();
    });
  });
});
