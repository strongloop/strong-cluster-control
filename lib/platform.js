// For simulating windows behaviours on unix, this defines isWindows
// if we are are on windows, or have DEBUG_WIN32 set in the environment.
if(process.platform === 'win32' || process.env.DEBUG_WIN32) {
  exports.isWindows = true;
} else {
  exports.isWindows = false;
}
