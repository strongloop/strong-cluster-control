'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var tap = require('tap');

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('should shutdown a worker with', function(t) {
  t.test('no connections', function(t) {
    var worker = cluster.fork();
    cluster.once('online', shutdown);

    function shutdown() {
      master.setSize(0);
      worker.once('exit', function(code, signal) {
        t.equal(signal, null);
        t.equal(code, 0);
        master.stop(t.end);
      });
    }
  });

  t.test('connections', function(t) {
    master.start({shutdownTimeout: 100});

    var worker = cluster.fork();
    cluster.once('online', setBusy);

    function setBusy() {
      worker.send({cmd: 'BUSY'});
      worker.on('message', function(msg) {
        if (msg.cmd === 'BUSY') {
          shutdown();
        }
      });
    }

    function shutdown() {
      master.setSize(0);
      worker.once('exit', function(code) {
        // On unix, node catches SIGTERM and exits with non-zero status. On
        // Windows, it dies with SIGTERM. Either way, its not a normal exit
        // (code === 0).
        t.notEqual(code, 0, 'signalled');
        master.stop(t.end);
      });
    }
  });

  t.end();
});
