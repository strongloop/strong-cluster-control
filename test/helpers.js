'use strict';

var _ = require('lodash');
var cluster = require('cluster');
var clusterSize = require('../lib/util').clusterSize;

exports.workerCount = clusterSize;
exports.pickWorker = pickWorker;
exports.assertWorker = assertWorker;

function randomInteger(I) {
  return Math.floor(Math.random() * I);
}

function pickWorker() {
  var workerIds = Object.keys(cluster.workers);
  var pickId = workerIds[randomInteger(workerIds.length)];
  return cluster.workers[pickId];
}

function assertWorker(t, worker) {
  var isN = _.isFinite;
  t.assert(isN(_.parseInt(worker.id, 10)), 'id invalid: ' + worker.id);
  t.assert(isN(worker.uptime), 'uptime invalid: ' + worker.uptime);
  t.assert(isN(worker.startTime), 'startTime invalid: ' + worker.startTime);
  t.assert(isN(worker.pid) && worker.pid >= 1, 'pid invalid: ' + worker.pid);
}
