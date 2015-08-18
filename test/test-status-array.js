/*eslint-env mocha*/
'use strict';

var _ = require('lodash');
var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');
var workerCount = require('./helpers').workerCount;
var assertWorker = require('./helpers').assertWorker;

tap.test('should report status array', function(t) {
  cluster.setupMaster({
    exec: 'test/workers/null.js'
  });

  t.on('end', function() {
    cluster.disconnect();
  });

  t.test('for 0 workers', function(t) {
    var rsp = master.status();
    delete rsp.master.setSize;
    t.assert(_.isFinite(rsp.master.startTime));
    delete rsp.master.startTime;
    t.equal(workerCount(), 0);
    t.deepEqual(rsp, {master: {pid: process.pid}, workers: []});
    t.end();
  });

  t.test('for 1 workers', function(t) {
    cluster.fork();
    cluster.once('fork', function() {
      t.equal(workerCount(), 1);
      var rsp = master.status();
      t.equal(rsp.workers.length, 1);
      assertWorker(t, rsp.workers[0]);
      t.end();
    });
  });

  t.test('for 2 workers', function(t) {
    cluster.fork();
    cluster.once('fork', function() {
      var rsp = master.status();
      t.equal(rsp.workers.length, 2);
      rsp.workers.forEach(assertWorker.bind(null, t));
      t.end();
    });
  });

  t.test('for 0 workers, after resize', function(t) {
    cluster.once('online', function() {
      cluster.disconnect(function() {
        var rsp = master.status();
        delete rsp.master.setSize;
        t.assert(_.isFinite(rsp.master.startTime), 'start time');
        delete rsp.master.startTime;
        t.deepEqual(rsp, {master: {pid: process.pid}, workers: []}, 'status');
        t.end();
      });
    });
    cluster.fork();
  });

  t.end();
});
