'use strict';

var cluster = require('cluster');
var master = require('../lib/master');
var pickWorker = require('./helpers').pickWorker;
var tap = require('tap');

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

tap.test('should get resize event on return to configured size', function(t) {
  function assertClusterResizesToConfiguredSizeAfter(somethingHappens, t) {
    var SIZE = 5;
    master.start({size: SIZE});
    master.once('resize', function(size) {
      t.equal(size, SIZE);
      somethingHappens(checkSizeInvariant);
    });

    function checkSizeInvariant() {
      master.once('resize', function(size) {
        t.equal(size, master.options.size);
        master.stop(t.end);
      });
    }
  }

  t.test('after worker disconnect', function(t) {
    assertClusterResizesToConfiguredSizeAfter(function(done) {
      pickWorker()
      .once('exit', done)
      .disconnect();
    }, t);
  });

  t.test('after worker destroy', function(t) {
    assertClusterResizesToConfiguredSizeAfter(function(done) {
      pickWorker()
      .once('exit', done)
      .destroy('SIGKILL'); // .destroy is other, better, name for .kill
    }, t);
  });

  t.test('after worker signal', function(t) {
    assertClusterResizesToConfiguredSizeAfter(function(done) {
      pickWorker()
      .once('exit', done)
      .process.kill('SIGKILL');
      // use process.kill(), because it just sends a signal, whereas
      // worker .kill() first disconnects, and then signals, so signal
      // is usually never received
    }, t);
  });

  t.test('after worker exit', function(t) {
    assertClusterResizesToConfiguredSizeAfter(function(done) {
      pickWorker()
      .once('exit', done)
      .send({cmd: 'EXIT'});
    }, t);
  });

  t.test('after worker fork', function(t) {
    assertClusterResizesToConfiguredSizeAfter(function(done) {
      cluster.fork();
      cluster.once('online', done);
    }, t);
  });

  t.end();
});
