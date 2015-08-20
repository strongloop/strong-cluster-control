'use strict';

var _ = require('lodash');
var cluster = require('cluster');

exports.liveWorkerIds = liveWorkerIds;
exports.clusterSize = clusterSize;

// Workers remain in cluster.workers after they have have exited.
function liveWorkerIds() {
  var workerIds = Object.keys(cluster.workers).filter(function(id) {
    var worker = cluster.workers[id];
    var isAlive = worker.process.signalCode == null &&
      worker.process.exitCode == null;
    return isAlive;
  });
  // Array.sort sorts Number as if it was a String, 80 is before 9, use lodash.
  return _.sortBy(workerIds);
}

function clusterSize() {
  return liveWorkerIds().length;
}
