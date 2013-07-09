// null worker... it should not exit until explicitly disconnected

var assert = require('assert');
var cluster = require('cluster');
var debug = require('../../lib/debug');

debug('worker start', process.pid, process.argv);

assert(!cluster.isMaster);

process.send({
  env:process.env,
  argv:process.argv
});

process.on('disconnect', function() {
  debug('worker disconnect', process.pid);
});

process.on('exit', function() {
  debug('worker exit', process.pid);
});
