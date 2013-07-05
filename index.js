// cluster-control:

var cluster = require('cluster');

if (cluster.isMaster) {
  module.exports = require('./lib/master.js');
} else {
  // Calling .start() in a worker is a nul op
  exports.start = function () {};
  exports.stop = function(callback) {
    process.nextTick(callback);
  };
}
