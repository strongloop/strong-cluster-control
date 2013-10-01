var assert = require('assert');
var cluster = require('cluster');
var net = require('net');
var os = require('os');
var path = require('path');

var _ = require('lodash');

var client = require('../lib/client');
var debug = require('../lib/debug');
var master = require('../lib/master');

debug('master', process.pid);

function workerCount() {
  return Object.keys(cluster.workers).length;
}

function firstWorker() {
  var id = Object.keys(cluster.workers)[0];
  return cluster.workers[id];
}

function randomInteger(I) {
  return Math.floor(Math.random() * I);
}

function pickWorker() {
  var workerIds = Object.keys(cluster.workers);
  var pickId = workerIds[randomInteger(workerIds.length)];
  return cluster.workers[pickId];
}

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

describe('master', function() {
  afterEach(function(done) {
    debug('afterEach workers', workerCount());
    master.removeAllListeners('startWorker');
    master.removeAllListeners('stopWorker');
    master.stop(function() {
      cluster.disconnect(done);
    });
  });

  beforeEach(function() {
    assert.equal(master.size, undefined);
    assert.equal(workerCount(), 0);
  });

  describe('should expose', function() {
    it('default socket address', function() {
      assert.equal(master.ADDR, 'clusterctl');
    });

    it('cpu count, for easy use as a default size', function() {
      assert.equal(master.CPUS, os.cpus().length);
    });

    it('message cmd names in master', function() {
      assert.equal(master.cmd.SHUTDOWN, 'CLUSTER_CONTROL_shutdown');
    });

  });

  describe('should report status array', function() {
    it('for 0 workers', function() {
      var rsp = master.status();
      assert.equal(workerCount(), 0);
      assert.deepEqual(rsp, {workers:[]});
    });


    it('for 1 workers', function(done) {
      cluster.fork();
      cluster.once('fork', function() {
        assert.equal(workerCount(), 1);
        master.request({cmd:'status'}, function(rsp) {
          assert.equal(rsp.workers.length, 1);
          var w0 = rsp.workers[0];
          assert(w0.id);
          assert(w0.pid > 0);
          done();
        });
      });
    });

    it('for 2 workers', function(done) {
      assert.equal(master.size, undefined);
      assert.equal(workerCount(), 0);
      cluster.fork();
      cluster.once('fork', function() {
        cluster.fork();
        cluster.once('fork', function() {
          master.request({cmd:'status'}, function(rsp) {
            assert.equal(rsp.workers.length, 2);
            var w0 = rsp.workers[0];
            assert(w0.id);
            assert(w0.pid > 0);

            var w1 = rsp.workers[1];
            assert(w1.id);
            assert(w1.pid > 0);
            done();
          });
        });
      });
    });

    it('for 0 workers, after resize', function(done) {
      cluster.once('online', function() {
        cluster.disconnect(function() {
          master.request({cmd:'status'}, function(rsp) {
            assert.deepEqual(rsp, {workers:[]});
            done();
          });
        });
      });
      cluster.fork();
    });
  });

  it('should stop workers it started', function(done) {
    process.throwDeprecation = true;
    master.start({size: 1}, function() {
      master.once('resize', function() {
        master.stop(function() {
          assert.equal(workerCount(), 0);
          return done();
        });
      });
    });
  });

  it('should not stop workers it did not start', function(done) {
    master.start(function() {
      cluster.fork();
      cluster.once('online', function() {
        assert.equal(workerCount(), 1);
        master.stop(function() {
          assert.equal(workerCount(), 1);
          return done();
        });
      });
    });
  });

  describe('should start', function() {
    describe('and stop', function() {
      it('notifying with events', function(done) {
        master.start();
        master.once('start', function() {
          master.stop();
          master.once('stop', done);
        });
      });

      it('notifying with callbacks', function(done) {
        master.start(function() {
          master.stop(done);
        });
      });
    });

    it('on path', function(done) {
      master.start({path:'_ctl'});
      master.once('start', connect);

      function connect(addr) {
        assert.equal(addr, '_ctl');
        client.request('_ctl', {cmd:'status'}, stop)
        .once('error', function(er) {
          console.log('client', er);
        });
      }

      function stop() {
        master.stop();
        master.once('stop', done);
      }

      master.once('error', function(er) {
        console.log('master', er);
      });
    });

    it('on port', function(done) {
      master.start({port:4321});
      master.once('start', connect);

      function connect(addr) {
        assert.equal(addr.port, 4321, toString(addr));
        client.request(4321, {cmd:'status'}, stop)
        .once('error', function(er) {
          console.log('client', er);
        });
      }

      function stop() {
        master.stop();
        master.once('stop', done);
      }

      master.once('error', function(er) {
        console.log('master', er);
      });
    });
  });

  it('should return error for unsupported requests', function(done) {
    master.request({cmd:'no-such-command'}, function(rsp) {
      assert(/no-such-command/.test(rsp.error));
      done();
    });
  });

  it('should use options.env with fork', function(done) {
    master.start({
      size: 1,
      env:{SOME_VAR:'MY VALUE'}
    });
    master.once('startWorker', function(worker) {
      worker.once('message', function(msg) {
        assert.equal(msg.env.SOME_VAR, 'MY VALUE');
        done();
      });
    });
  });

  it('should set size in options when changed', function() {
    master.start({size:0});
    assert.equal(master.options.size, 0);
    assert.equal(master.size, 0);
    master.setSize(1);
    assert.equal(master.options.size, 1);
    assert.equal(master.size, 1);
  });

  it('should set size with json', function(done) {
    master.request({cmd:'set-size', size:1});
    master.once('startWorker', function() {
      assert(workerCount() == 1);
      done();
    });
  });

  describe('should resize', function() {
    it('from a fork before start', function(done) {
      var sawNewWorker = 0;
      cluster.fork();
      master.start({size:3});
      master.once('startWorker', function startWorker(worker) {
        // Make sure our argument is really a worker.
        assert(worker);
        assert(worker.id);
        assert(worker.process.pid);

        sawNewWorker += 1;

        if(sawNewWorker == 2) {
          assert(workerCount() == 3);
          return done();
        }
        master.once('startWorker', startWorker);
      });
    });

    it('from size 1 to 2', function(done) {
      master.start({size:1});
      master.once('startWorker', function() {
        master.setSize(2);
        master.once('startWorker', function() {
          assert(workerCount() == 2);
          done();
        });
      });
    });

    it('from size 1 to 0', function(done) {
      master.start({size:1});
      master.once('startWorker', function() {
        master.setSize(0);
      });

      master.once('stopWorker', function(worker) {
        assert(worker.process.pid, 'worker is valid');
        assert.equal(workerCount(), 0);
        done();
      });
    });

    it('from size 3 to 1', function(done) {
      master.start({size:3});
      master.on('startWorker', function() {
        if(workerCount() == 3) {
          master.setSize(1);
        }
      });

      master.once('stopWorker', function() {
        assert.equal(workerCount(), 2);
        master.once('stopWorker', function() {
          assert.equal(workerCount(), 1);
          done();
        });
      });
    });

    it('to last of concurrent resizes', function(done) {
      master.start({size:10});
      master.on('startWorker', function() {
        if(workerCount() == 3) {
          master.setSize(5);
        }
        if(workerCount() == 5) {
          master.setSize(2);
        }
      });

      master.on('stopWorker', function(worker) {
        if(workerCount() == 3) {
          master.setSize(0);
        }
        if(workerCount() === 0) {
          done();
        }
      });
    });

    it('while workers are forked', function(done) {
      master.start({size:10});
      master.on('startWorker', function() {
        if(workerCount() == 1) {
          cluster.fork();
        }
        if(workerCount() == 3) {
          master.setSize(5);
          cluster.fork();
        }
        if(workerCount() == 5) {
          master.setSize(2);
        }
      });

      master.on('stopWorker', function(worker) {
        if(workerCount() == 3) {
          master.setSize(0);
        }
        if(workerCount() === 0) {
          done();
        }
      });
    });

    it('while too many workers are forked', function(done) {
      master.start({size:5});
      master.on('startWorker', function() {
        if(workerCount() == 3) {
          cluster.fork();
          cluster.fork();
          cluster.fork();
          cluster.fork();
        }
      });
      master.once('resize', function(size) {
        assert.equal(size, 5);
        done();
      });
    });

    it('slowly when workers exit unexpectedly', function(done) {
      // Run for some time, with workers set to error on start. Without
      // throttling, workers get forked faster than dozens per second, with
      // throttling, it should be no more than a couple a second.
      var TIME = 5000;
      var FORKS = TIME/1000 * 2;
      var forks = 0;
      this.timeout(2 * TIME);

      master.start({
        size: 3,
        env: {cmd: 'EXIT'}
      });

      cluster.on('fork', function forkCounter(worker) {
        forks++;
      });

      setTimeout(function() {
        assert(forks < FORKS, 'forked '+forks+' times!');
        return done();
      }, TIME);
    });
  });

  describe('should get resize event on return to configured size', function() {
    function assertClusterResizesToConfiguredSizeAfter(somethingHappens, done) {
      master.start({size:5});
      master.once('resize', function(size) {
        assert.equal(size, 5);
        somethingHappens(checkSizeInvariant);
      });

      function checkSizeInvariant() {
        master.once('resize', function(size) {
          assert.equal(size, master.options.size);
          done();
        });
      }
    }

    it('after worker disconnect', function(done) {
      assertClusterResizesToConfiguredSizeAfter(function(done) {
        pickWorker()
          .once('exit', done)
          .disconnect();
      }, done);
    });

    it('after worker kill', function(done) {
      assertClusterResizesToConfiguredSizeAfter(function(done) {
        pickWorker()
          .once('exit', done)
          .kill('SIGKILL');
      }, done);
    });

    it('after worker exit', function(done) {
      this.timeout(5000); // exit is abnormal, and triggers throttling
      assertClusterResizesToConfiguredSizeAfter(function(done) {
        pickWorker()
          .once('exit', done)
          .send({ cmd: 'EXIT' });
      }, done);
    });

    it('after worker fork', function(done) {
      assertClusterResizesToConfiguredSizeAfter(function(done) {
        cluster.fork();
        cluster.once('online', done);
      }, done);
    });
  });

  describe('should shutdown a worker with', function() {
    it('no connections', function(done) {
      var worker = cluster.fork();
      cluster.once('online', shutdown);

      function shutdown() {
        master.setSize(0);
        worker.once('exit', function(code,signal) {
          assert.equal(signal, null);
          assert.equal(code, 0);
          done();
        });
      }
    });

    it('connections', function(done) {
      master.start({shutdownTimeout: 100});

      var worker = cluster.fork();
      cluster.once('online', setBusy);

      function setBusy() {
        worker.send({cmd:'BUSY'});
        worker.on('message', function(msg) {
          if(msg.cmd === 'BUSY') {
            shutdown();
          }
        });
      }

      function shutdown() {
        master.setSize(0);
        worker.once('exit', function(code,signal) {
          // It will catch SIGTERM, and exit
          assert.equal(signal, null);
          assert(code !== null);
          done();
        });
      }
    });
  });

  describe('should kill workers that refuse to die', function() {
    function assertWorkerIsKilledAfter(action, done) {
      master.start({shutdownTimeout: 100, terminateTimeout: 100});

      var worker = cluster.fork();
      cluster.once('online', setBusy);

      function setBusy() {
        worker.send({cmd:'LOOP'});
        worker.on('message', function(msg) {
          if(msg.cmd === 'LOOP') {
            stopWorker();
          }
        });
      }

      function stopWorker() {
        master[action](worker.id);
        worker.once('exit', function(code,signal) {
          debug('exit with',code,signal);
          assert.equal(signal, 'SIGKILL');
          assert.equal(code, null);
          done();
        });
      }
    }

    it('with terminate', function(done) {
      assertWorkerIsKilledAfter('terminate', done);
    });

    it('with shutdown', function(done) {
      assertWorkerIsKilledAfter('shutdown', done);
    });
  });

  it('should notify workers they are being shutdown', function(done) {
    var worker = cluster.fork();

    worker.once('online', function() {
      debug('online, send graceful');
      worker.send({cmd: 'GRACEFUL'});
    });

    worker.once('listening', function (address) {
      debug('master, listening on address', address);
      net.connect(address.port, onceConnected);
    });

    // We know we are done when the child sends us 'bye', evidence it has
    // received the notification to do a graceful close, and when the exit
    // status is 0, evidence that the closing of the server connections has
    // allowed the child to disconnect and exit normally.
    var serverBye;
    var serverExit;

    function maybeDone() {
      if(serverBye && serverExit)
        done();
    }

    function onceConnected() {
      debug('master, once connected', this.address());
      // We have a tcp connection, but worker may not have accepted it yet, we
      // have to make sure not to send the shutdown notification until the
      // worker has accepted the connection. We ensure this by pumping data
      // through.
      this.write('X');
      this.once('data', function() {
        // now we are sure the client knows about the connection, shutdown
        this.once('data', function(data) {
          assert.equal(data, 'bye');
          serverBye = true;
          maybeDone();
        });
        master.shutdown(worker.id);
      });
    }

    worker.on('exit', function(code) {
      assert.equal(code, 0);
      serverExit = true;
      maybeDone();
    });
  });

  describe('should restart', function() {
    it('all current workers while new ones stay alive', function(done) {
      var SIZE = 5;
      var DELAY = 200;
      this.timeout(5 * DELAY * SIZE); // try to tune timeout to SIZE, DELAY
      master.start({size: SIZE, throttleDelay: DELAY});
      master.once('resize', function() {
        var oldWorkers = Object.keys(cluster.workers);
        master.restart();
        master.once('restart', function() {
          var stillAlive = _.intersection(oldWorkers, Object.keys(cluster.workers));
          assert.equal(stillAlive.length, 0, 'no old workers are still alive');
          done();
        });
      });
    });

    it('all current workers after new workers stop dieing', function(done) {
      var SIZE = 5;
      this.timeout(SIZE * 4000 + 4000);

      master.start({
        size: SIZE,
        throttleDelay: 200, // default is 2 sec, we'd like test to run faster
      });

      master.once('resize', function() {
        debug('after resize, cmd workers to exit');
        var oldWorkers = Object.keys(cluster.workers);
        process.env.cmd = 'EXIT';
        master.restart();
        master.once('restart', function() {
          assert(!process.env.cmd, 'restart should not finish until workers stop dieing');
          var stillAlive = _.intersection(oldWorkers, Object.keys(cluster.workers));
          debug('on restart, orig:', oldWorkers);
          debug('on restart, aliv:', stillAlive);
          assert.equal(stillAlive.length, 0, 'no old workers are still alive');
          done();
        });

        // Run until twice the current number of workers have been forked,
        // and check that some of the originals are still around.
        var forks = 0;
        cluster.once('fork', checkDone);
        function checkDone() {
          forks++;
          if(forks > 2 * SIZE ) {
            var stillAlive = _.intersection(oldWorkers, Object.keys(cluster.workers));
            debug('after a while, orig:', oldWorkers);
            debug('after a while, aliv:', stillAlive);
            // Note, exactly how many remain alive depends on relationship
            // between how long it takes a child to spawn and exit, and what the
            // throttleDelay is. If the numbers are too close, workers will be
            // thought to be alive even if they aren't. So, the SIZE-2 is
            // arbitrary, a bit, but seems to be true for reasonable throttle
            // delays.
            assert(stillAlive.length >= SIZE-2, 'most old workers are still alive');
            delete process.env.cmd;
          } else {
            cluster.once('fork', checkDone);
          }
        }
      });
    });
  });
});
