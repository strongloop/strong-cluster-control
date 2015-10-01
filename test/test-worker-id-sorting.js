'use strict';

var cluster = require('cluster');

if (cluster.isWorker)
  return;

var _ = require('lodash');
var liveWorkerIds = require('../lib/util').liveWorkerIds;
var tap = require('tap');

// Must be greater than 10 so we can see order is ..., '9', '10', '11', ..., not
// '10', '11', '9', ...
var N = 15;
var workers = _.times(N, function() {
  return cluster.fork();
});

// These will be in creation order: always ascending.
var workerIds = workers.map(function(w) {
  return String(w.id);
});

tap.equal(workerIds.length, N, 'should be N workers');
// Sorting should also be in ascending order.
tap.strictDeepEqual(liveWorkerIds(), workerIds, 'sort should preserve order');

cluster.disconnect();
