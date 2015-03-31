2015-03-31, Version 2.0.1
=========================

 * debug: switch from debuglog to visonmedia/debug (Sam Roberts)

 * ui: remove unused lib/ui.js and test/ui.js (Sam Roberts)

 * package: update jscs ignore rule (Sam Roberts)

 * Update README for strong-pm.io (Sam Roberts)

 * package: update eslint to 0.17 (Sam Roberts)

 * Update README (Sam Roberts)

 * lint: add eslint and jscs support (Sam Roberts)

 * Fix broken link (Rand McKinney)


2015-01-12, Version 2.0.0
=========================

 * Remove loadOptions(), its no longer used (Sam Roberts)

 * Update dev dependencies to work on Windows (Ryan Graham)

 * Add utility to humanize duration (Ryan Graham)

 * Add uptime to worker status (Ryan Graham)

 * Fix bad CLA URL in CONTRIBUTING.md (Ryan Graham)


2014-12-12, Version 1.0.2
=========================

 * package: update lodash to ^2.2 (Sam Roberts)


2014-11-03, Version 1.0.1
=========================

 * status: include current set-size (Sam Roberts)


2014-10-02, Version 1.0.0
=========================

 * package: remove module names from keywords (Sam Roberts)

 * Update contribution guidelines (Ryan Graham)


2014-08-21, Version 0.5.1
=========================

 * Update package license to match LICENSE.md (Sam Roberts)


2014-07-21, Version 0.5.0
=========================

 * Update package keywords, sort order, and bins (Sam Roberts)

 * Remove control channel and CLI (Sam Roberts)

 * Fix link to docs (again) (Rand McKinney)

 * Update link to doc (Rand McKinney)

 * doc: add CONTRIBUTING.md and LICENSE.md (Ben Noordhuis)

 * fix broken links in README (Sam Roberts)


2014-02-19, Version 0.4.0
=========================

 * Use 'slc clusterctl' in usage when run from slc (Sam Roberts)

 * Note existence of strong-supervisor in README (Sam Roberts)

 * Prefer cluster to size in command line and config (Sam Roberts)

 * example-master, log information about environment (Sam Roberts)

 * Install CLI as sl-clusterctl (Sam Roberts)

 * Apply Dual MIT/StrongLoop license (Sam Roberts)

 * Update jshint (Sam Roberts)


2014-01-25, Version 0.3.0
=========================

 * Add keywords to npm package (Sam Roberts)

 * Include master process ID in status (Sam Roberts)

 * Emit 'startRestart' when restart begins (Sam Roberts)

 * Emit 'setSize' event after size is set (Sam Roberts)

 * Size for loadOptions() allows 0, and mixed case (Sam Roberts)

 * Fix example-master, too complicated to be useful (Sam Roberts)

 * Clarify debug message about server status (Sam Roberts)

 * Clarify debug message about exit (Sam Roberts)

 * support windows variations of worker death (Sam Roberts)

 * support both windows and unix local sockets (Sam Roberts)

 * Test death by signal, as well as worker.destroy() (Sam Roberts)

 * Refactor resize test so size can be easily changed (Sam Roberts)

 * Add debug messages around server disconnection (Sam Roberts)

 * Remove env dump by every worker in debug mode (Sam Roberts)


2013-11-28, Version 0.2.2
=========================

 * clusterctl reports worker id correctly (Sam Roberts)

 * Update README.md (Rand McKinney)

 * Remove test code causing test worker to exit (Sam Roberts)

 * Worker debug output cleaned up and extended (Sam Roberts)

 * Update docs.json (Rand McKinney)

 * Extracted API docs into separate file (Rand McKinney)

 * Remove blanket from package.json, we use istanbul (Sam Roberts)


2013-11-06, Version 0.2.1
=========================

 * start/stop stubs for worker return an EventEmitter (Sam Roberts)


2013-10-29, Version 0.2.0
=========================

 * Revert premature update of package version (Sam Roberts)

 * Doc using `npm install`, not `slnode install` (Sam Roberts)

 * Detect and fail on invalid multiple instantiation (Sam Roberts)

 * Add restart command, to restart all workers (Sam Roberts)

 * Test reorganized into categories, and size reset (Sam Roberts)

 * Throttle worker restarts after an abormal exit (Sam Roberts)

 * Test worker, add support for commands in env (Sam Roberts)

 * Test worker, add support for exit by erroring (Sam Roberts)

 * Setup all workers with _control and birth time (Sam Roberts)

 * Use DEBUG or NODE_DEBUG to enable logging (Sam Roberts)

 * Keep control.options.size in sync with setSize() (Sam Roberts)

 * Support shutting down a cluster (Sam Roberts)

 * Fix test failure involving client/server race (Sam Roberts)

 * Add master.status(), a public method for cluster state. (Michael Schoonmaker)

 * Use blanket ~1.1.5 instead of 'latest' (Sam Roberts)

 * Use mocha tap reporter (Sam Roberts)

 * Cli factored into a callable function (Sam Roberts)

 * Minor edits per style guide. Rm'd dangling API header. (Edmond Meinfelder)


2013-08-29, Version 0.1.0
=========================

 * Document the loadOptions function (Sam Roberts)

 * Optional loading of options from configuration (Sam Roberts)

 * Adding docs.json for doc effort. (Edmond Meinfelder)

 * Rename control.msg to control.cmd (Sam Roberts)

 * update coverage filename (slnode)

 * Send SHUTDOWN message before disconnecting (Sam Roberts)


2013-07-15, Version 0.0.2
=========================

 * First release!
