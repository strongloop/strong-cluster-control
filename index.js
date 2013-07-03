// cluster-control:

var cluster = require('cluster');

if (cluster.isMaster) {
  exports.start = require('./lib/master.js').start;
} else {
  // Calling .start() in a worker is a nul op
  exports.start = function () {}
}
