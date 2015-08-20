'use strict';

var _ = require('lodash');
var cluster = require('cluster');
var debug = require('debug')('strong-cluster-control:test');
var master = require('../lib/master');
var tap = require('tap');

debug('master', process.pid);

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('restart all current after new stop dieing', function(t) {
  var SIZE = 5;

  master.start({
    size: SIZE,
    throttleDelay: 200, // default is 2 sec, we'd like test to run faster
  });

  master.once('resize', function() {
    debug('after resize, cmd workers to exit');
    var oldWorkers = Object.keys(cluster.workers);
    process.env.cmd = 'EXIT';
    master.restart();
    master.once('restart', function() {
     t.assert(!process.env.cmd,
              'restart should not finish until workers stop dieing');
     var stillAlive = _.intersection(oldWorkers, Object.keys(cluster.workers));
     debug('on restart, orig:', oldWorkers);
     debug('on restart, aliv:', stillAlive);
     t.equal(stillAlive.length, 0, 'no old workers are still alive');
     t.end();
     master.stop();
    });

    // Run until twice the current number of workers have been forked,
    // and check that some of the originals are still around.
    var forks = 0;
    cluster.once('fork', checkDone);
    function checkDone() {
      forks++;
      if (forks > 2 * SIZE ) {
        var stillAlive = _.intersection(
          oldWorkers, Object.keys(cluster.workers));
          debug('after a while, orig:', oldWorkers);
          debug('after a while, aliv:', stillAlive);
          t.assert(stillAlive.length >= SIZE - 1, 'old workers mostly alive');
          delete process.env.cmd;
      } else {
        cluster.once('fork', checkDone);
      }
    }
  });
});
