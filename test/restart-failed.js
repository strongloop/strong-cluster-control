'use strict';

// Bail when run by mocha
if ('describe' in global) {
  describe(module.parent.filename, function() {
    it.skip('run test with tap, not mocha', function(){});
  });
  return;
}

var debug = require('debug')('strong-cluster-control:test');
var cluster = require('cluster');
var control = require('../');
var tap = require('tap');

var SIZE = global.SIZE;

if (cluster.isWorker) {
  if (cluster.worker.id > SIZE)
    process.exit(3);
  return;
}

tap.test('good workers are not killed', function(t) {
  var ended;

  control.start({size: SIZE});

  function size() {
    return Object.keys(cluster.workers).length;
  }

  control.once('resize', function() {
    if (ended) return;

    debug('reached size, restart');
    control.restart();
  });

  cluster.on('exit', function(w) {
    if (ended) return;

    debug('w %d died: alive %d', w.id, size());

    if (size() < SIZE) {
      t.fail('good workers died');
      end();
    } else if (w.id > (SIZE + 3)) {
      t.pass('good workers survived');
      end();
    }
  });

  function end() {
    ended = true;
    control.stop();
    t.end();
  }
});
