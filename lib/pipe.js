var path = require('path');

// Copied from node/lib/net.js:
function toNumber(x) {
  return (x = Number(x)) >= 0 ? x : false;
}

function isPipeName(s) {
  return typeof s === 'string' && toNumber(s) === false;
}

function pipeName(addr) {
  // Not Windows? Don't do anything
  if(process.platform !== 'win32') {
    return addr;
  }
  // Not a pipe name? Don't do anything
  if(!isPipeName(addr)) {
    return addr;
  }
  // Already a valid windows pipe name? Don't do anything.  Since both / and \
  // are useable as path seperators on windows, the regex is a bit horrible.
  if(/^(?:\/\/)|(?:\\\\).[\\/]pipe[\\/]/.test(addr)) {
    return addr;
  }
  // Resolve path location, so its semi-unique
  addr = path.resolve(addr);

  return path.join('\\\\?\\pipe', addr)
}

exports.toPipe = pipeName;
