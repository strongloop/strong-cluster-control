'use strict';

var _ = require('lodash');
var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');

cluster.setupMaster({
  exec: 'workers/null.js'
});

tap.test('should stop workers it started', function(t) {
  master.start(function() {
    var worker = cluster.fork();
    worker.once('fork', function() {
      t.assert(_.isFinite(worker.startTime));
      t.assert(_.isFinite(worker.process.pid));
      worker.process.kill('SIGINT');
    }).on('exit', function(code, signal) {
      var SIGINT = 2;
      if (signal)
        t.equal(signal, 'SIGINT');
      else
        // 0.10 exits with 0x80 + signal number
        t.equal(code - 0x80, SIGINT);
      t.end();
    });
  });
});
