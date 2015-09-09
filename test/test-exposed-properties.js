'use strict';

var _ = require('lodash');
var master = require('../lib/master');
var tap = require('tap');
var os = require('os');

tap.test('master should expose', function(t) {
  t.test('cpu count, for easy use as a default size', function(t) {
    t.equal(master.CPUS, os.cpus().length);
    t.end();
  });

  t.test('master process start time', function(t) {
    t.assert(_.isFinite(master.startTime));
    t.end();
  });

  t.test('message cmd names in master', function(t) {
    t.equal(master.cmd.SHUTDOWN, 'CLUSTER_CONTROL_shutdown');
    t.end();
  });

  t.end();
});
