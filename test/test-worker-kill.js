'use strict';

var cluster = require('cluster');
var debug = require('debug')('strong-cluster-control:test');
var master = require('../lib/master');
var tap = require('tap');

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('should kill workers that refuse to die', function(t) {
  function assertWorkerIsKilledAfter(action, t) {
    master.start({shutdownTimeout: 100, terminateTimeout: 100});

    var worker = cluster.fork();

    cluster.once('online', setBusy);

    function setBusy() {
      worker.send({cmd: 'LOOP'});
      worker.on('message', function(msg) {
        if (msg.cmd === 'LOOP') {
          stopWorker();
        }
      });
    }

    function stopWorker() {
      master[action](worker.id);
      worker.once('exit', function(code, signal) {
        debug('exit with', code, signal);
        if (process.platform === 'win32') {
          // SIGTERM is emulated by libuv on Windows by calling
          // TerminateProcess(), which cannot be blocked or caught
          t.equal(signal, 'SIGTERM');
        } else {
          // SIGTERM can be ignored on Unix, but SIGKILL cannot
          t.equal(signal, 'SIGKILL');
        }
        t.equal(code, null);
        master.stop(t.end);
      });
    }
  }

  t.test('with terminate', function(t) {
    assertWorkerIsKilledAfter('terminate', t);
  });

  t.test('with shutdown', function(t) {
    assertWorkerIsKilledAfter('shutdown', t);
  });

  t.end();
});
