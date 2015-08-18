'use strict';

var cluster = require('cluster');
var debug = require('debug')('strong-cluster-control:test');
var master = require('../lib/master');
var net = require('net');
var tap = require('tap');

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('should notify workers they are being shutdown', function(t) {
  var worker = cluster.fork();

  worker.once('online', function() {
    debug('online, send graceful');
    worker.send({cmd: 'GRACEFUL'});
  });

  worker.once('listening', function (address) {
    debug('master, listening on address', address);
    net.connect(address.port, onceConnected);
  });

  function onceConnected() {
    debug('master, once connected', this.address());
    // We have a tcp connection, but worker may not have accepted it yet, we
    // have to make sure not to send the shutdown notification until the
    // worker has accepted the connection. We ensure this by pumping data
    // through.
    this.write('X');
    this.once('data', function() {
      // now we are sure the server knows about the connection, shutdown
      this.once('data', function(data) {
        t.equal(String(data), 'bye');
        serverBye = true;
        maybeDone();
      });
      master.shutdown(worker.id);
    });
  }

  worker.on('exit', function(code) {
    t.equal(code, 0);
    serverExit = true;
    maybeDone();
  });

  // We know we are done when the child sends us 'bye', evidence it has
  // received the notification to do a graceful close, and when the exit
  // status is 0, evidence that the closing of the server connections has
  // allowed the child to disconnect and exit normally.
  var serverBye;
  var serverExit;

  function maybeDone() {
    if (serverBye && serverExit)
      master.stop(t.end);
  }
});
