'use strict';

// Bail when run by mocha
if ('describe' in global) {
  describe(module.parent.filename, function() {
    it.skip('run test with tap, not mocha', function(){});
  });
  return;
}

var cluster = require('../lib/cluster');
var control = require('../');
var fmt = require('util').format;

if (cluster.isWorker) {
  console.log('worker starting');
  require('net').createServer().listen(3000);
  return;
}

control.start({size: 1});

function summary() {
  return Object.keys(cluster.workers).map(function(id) {
    return fmt('%d:suicide=%j', id, cluster.workers[id].suicide);
  }).join(' ');
}

function size() {
  return Object.keys(cluster.workers).length;
}

cluster.on('listening', function(worker, listen) {
  console.log('listening: %j %j', worker.id, listen);
  console.log('reached size: ', summary());
  if (size() === 0) {
    process.exit(0);
  }
  cluster.workers[1].disconnect();
  console.log('disconnected:', summary());
  control.setSize(0);
  console.log('resizing:', summary());
});
