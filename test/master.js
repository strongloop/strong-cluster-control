var assert = require('assert');
var cluster = require('cluster');
var path = require('path');

var client = require('../lib/client');
var debug = require('../lib/debug');
var master = require('../lib/master');

debug('master', process.pid);

function workerCount() {
  return Object.keys(cluster.workers).length;
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

  it('should expose default socket address', function() {
    assert.equal(master.ADDR, 'clusterctl');
  });
  it('should report status array for 0 workers', function(done) {
    master.request({cmd:'status'}, function(rsp) {
      assert.deepEqual(rsp, {workers:[]});
      done();
    });
  });

  it('should report status array for 1 workers', function(done) {
    cluster.fork();
    cluster.once('fork', function() {
      master.request({cmd:'status'}, function(rsp) {
        assert.equal(rsp.workers.length, 1);
        var w0 = rsp.workers[0];
        assert(w0.id);
        assert(w0.pid > 0);
        done();
      });
    });
  });

  it('should report status array for 2 workers', function(done) {
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

  it('should report status array for 0 workers, after resize', function(done) {
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

  it('should start and stop, notifying with events', function(done) {
    master.start();
    master.once('start', function() {
      master.stop();
      master.once('stop', done);
    });
  });

  it('should start and stop, notifying with callbacks', function(done) {
    master.start(function() {
      master.stop(done);
    });
  });

  it('should start on path', function(done) {
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

  it('should start on port', function(done) {
    master.start({port:4321});
    master.once('start', connect);

    function connect(addr) {
      assert.equal(addr.port, 4321);
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

  it('should return error for unsupported requests', function(done) {
    master.request({cmd:'no-such-command'}, function(rsp) {
      assert(/no-such-command/.test(rsp.error));
      done();
    });
  });

  it('should resize up', function(done) {
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

  it('should set size up', function(done) {
    master.start({size:1});
    master.once('startWorker', function() {
      master.setSize(2);
      master.once('startWorker', function() {
        assert(workerCount() == 2);
        done();
      });
    });
  });

  it('should set size with json', function(done) {
    master.request({cmd:'set-size', size:1});
    master.once('startWorker', function() {
      assert(workerCount() == 1);
      done();
    });
  });

  it('should start at 1, and resize to 0', function(done) {
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

  it('should start at 3, and resize to 1', function(done) {
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

  it('should resize while being resized', function(done) {
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

  it('should resize while workers are forked', function(done) {
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

  it('should resize while too many workers are forked', function(done) {
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

});
