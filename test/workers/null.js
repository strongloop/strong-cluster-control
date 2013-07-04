// null worker... it should not exit until explicitly disconnected
var assert = require('assert');
var cluster = require('cluster');

console.log('worker start', process.pid);

assert(!cluster.isMaster);

process.on('disconnect', function() {
  console.log('worker disconnect', process.pid);
});

process.on('exit', function() {
  console.log('worker exit', process.pid);
});
