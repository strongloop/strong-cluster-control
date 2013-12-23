var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var net = require('net');
var path = require('path');

var client = require('../lib/client');
var ctl = require('../lib/ctl');
var debug = require('../lib/debug');
var toPipe = require('../lib/pipe').toPipe;

describe('client', function() {
  it('should expose default socket address', function() {
    assert.equal(client.ADDR, ctl.ADDR);
  });
});


describe('control channel', function() {
  it('should start and stop', function(done) {
    var master = new EventEmitter();
    var server = ctl.start(master);
    master.on('listening', function() {
      ctl.stop(done);
    });
  });

  it('should call request on master', function(done) {
    var master = new EventEmitter();

    // echo request as response
    master.request = function(req, callback) {
      process.nextTick(callback.bind(null, req));
    };

    var server = ctl.start(master);
    var request;

    master.on('listening', function() {
      request = client.request(ctl.ADDR, {cmd:'helo'}, response);
    });

    function response(rsp) {
      assert.equal(rsp.cmd, 'helo');
      ctl.stop(done);
    }
  });

  it('should handle invalid requests', function(done) {
    var master = new EventEmitter();
    var server = ctl.start(master);
    var client;

    master.on('listening', function() {
      client = net.connect(toPipe(ctl.ADDR))
        .on('connect', function() {
          this.end('{\n'); // incomplete json
        });
    });

    master.on('connection', function(sock) {
      sock.once('error', function(er) {
        assert(er);
        ctl.stop(done);
      });
    });
  });

  // There does not seem to be a portable way of causing listen to fail. Any
  // string can be used as a path on win32, and multiple listens are OK on
  // unix.
  if(process.platform === 'win32') {
    it('should handle listen errors', function(done) {
      var listening = net.createServer().listen(toPipe(ctl.ADDR))
        .on('listening', failToListen);
      function failToListen() {
        var master = new EventEmitter();
        var server = ctl.start(master);

        master.once('error', function(er) {
          assert(er);
          ctl.stop(function() {
            listening.close(done)
          });
        });
        master.once('listening', function(server) {
          assert(false, server.address());
        });
      }
    });
  } else {
    it('should handle listen errors', function(done) {
      var master = new EventEmitter();
      var server = ctl.start(master, {addr:'/a/bad/path'});

      master.once('error', function(er) {
        assert(er);
        ctl.stop(function() {
          return done();
        });
      });
      master.once('listening', function(server) {
        assert(false, server.address());
      });
    });
  }

  it('should listen on specific path', function(done) {
    this.timeout(4000);
    var master = new EventEmitter();

    ctl.start(master, {addr:'_ctl'});

    master.on('listening', function(server) {
      assert.ok(/\b_ctl$/.test(server.address()), server.address());
      net.connect(toPipe('_ctl'))
        .on('connect', function() {
          this.destroy();
          ctl.stop(function() {
            return done();
          });
        });
    });
  });

});
