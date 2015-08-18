'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('should start and stop', function(t) {
  t.test('notifying with events', function(t) {
    master.start();
    master.once('start', function() {
      master.stop();
      master.once('stop', t.end);
    });
  });

  t.test('notifying with callbacks', function(t) {
    master.start(function() {
      master.stop(t.end);
    });
  });

  t.end();
});
