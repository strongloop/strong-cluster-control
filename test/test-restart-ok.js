'use strict';

var _ = require('lodash');
var debug = require('debug')('strong-cluster-control:test');
var cluster = require('cluster');
var control = require('../');

var SIZE = 3;

if (cluster.isWorker) {
  return;
}

var tap = require('tap');

tap.test('good workers are not killed', function(t) {
  var old;
  control.start({size: SIZE});

  t.plan(1);

  control.once('resize', function() {
    debug('reached size, restart');
    control.restart();
  });

  control.on('startRestart', function(_old) {
    old = _old;
  });

  control.on('restart', function() {
    var fresh = Object.keys(cluster.workers);
    var remaining = _.intersection(old, fresh);

    debug('old %j fresh %j remaining: %j', old, fresh, remaining);

    t.equal(remaining.length, 0);
    control.stop();
  });
});
