'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('slowly when workers exit unexpectedly', function(t) {
  // Run for some time, with workers set to error on start. Without
  // throttling, workers get forked faster than dozens per second, with
  // throttling, it should be no more than a couple a second.
  var TIME = 5000;
  var FORKS = TIME / 1000 * 2;
  var forks = 0;

  master.start({
    size: 3,
    env: {cmd: 'EXIT'}
  });

  cluster.on('fork', function forkCounter() {
    forks++;
  });

  setTimeout(function() {
    t.assert(forks < FORKS, 'forked ' + forks + ' times!');
    master.stop(t.end);
  }, TIME);
});
