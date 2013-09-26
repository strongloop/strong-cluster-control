// debug: use same debuglog name for all of cluster-control, for now

// Debuglog uses node convention, but fallback on visionmedia/debug
// convention if not defined.
process.env.NODE_DEBUG = process.env.NODE_DEBUG || process.env.DEBUG;

module.exports = require('debuglog')('cluster-control');
