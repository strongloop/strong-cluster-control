var assert = require('assert');
var cluster = require('cluster');
var master = require('../lib/master');

console.log('master', process.pid);

cluster.setupMaster({
  exec: 'test/workers/null.js'
});

describe('master', function() {
  afterEach(function(done) {
    console.log('afterEach workers', Object.keys(cluster.workers).length);
    cluster.disconnect(done);
  });

  it('should report status 0', function(done) {
    master.request({cmd:'status'}, function(rsp) {
      assert.deepEqual(rsp, {workers:[]});
      done();
    });
  });

  it('should report status 1', function(done) {
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

  it('should report status 2', function(done) {
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

  it('should report status 0, again', function(done) {
    master.request({cmd:'status'}, function(rsp) {
      assert.deepEqual(rsp, {workers:[]});
      done();
    });
  });

});
