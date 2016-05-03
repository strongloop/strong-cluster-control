// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

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

  // Object keys for scalars are of type String, sort by their numeric value.
  return _.sortBy(workerIds, Number);
}

function clusterSize() {
  return liveWorkerIds().length;
}
