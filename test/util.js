var isWindows = exports.isWindows = require('../lib/platform').isWindows;

// specialize of mocha's it() for unix-only shoulds.
exports.onUnixIt = function onUnixIt(name, callback) {
  if(isWindows) {
    it.skip(name,callback);
  } else {
    it(name,callback);
  }
}
