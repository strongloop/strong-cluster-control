// Copyright IBM Corp. 2013,2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

// cluster-control:

var assert = require('assert');
var cluster = require('cluster');
var VERSION = require('./package.json').version;

if (cluster._strongControlMaster) {
  assert(
    cluster._strongControlMaster.VERSION === VERSION,
    'Multiple versions of strong-cluster-control are being initialized.\n' +
    'This version ' + VERSION + ' is incompatible with already initialized\n' +
    'version ' + cluster._strongControlMaster.VERSION + '.\n'
  );
  module.exports = cluster._strongControlMaster;
  return;
}

if (cluster.isMaster) {
  module.exports = require('./lib/master');
  module.exports.VERSION = VERSION;
  cluster._strongControlMaster = module.exports;
} else {
  exports = module.exports = new (require('events').EventEmitter);
  // Calling .start() in a worker is a nul op
  exports.start = function(options, callback) {
    // both options and callback are optional, adjust position based on type
    // XXX cut-n-paste from lib/master, is it possible to factor out, maybe
    // into a function that modifies arguments?
    if (typeof callback === 'undefined') {
      if (typeof options === 'function') {
        callback = options;
        options = undefined;
      }
    }

    if (callback) {
      process.nextTick(callback);
    }
    return this;
  };
  exports.stop = function(callback) {
    if (callback) {
      process.nextTick(callback);
    }
    return this;
  };
  exports.cmd = require('./lib/msg');
}
