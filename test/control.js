var assert = require('assert');
var Client = require('../lib/client');
var ctl = require('../lib/ctl');
var EventEmitter = require('events').EventEmitter;
var net = require('net');

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
    var client;

    master.on('listening', function() {
      client = Client(ctl.ADDR, {cmd:'helo'}, response);
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
      client = net.connect(ctl.ADDR)
        .on('connect', function() {
          this.end('{'); // incomplete json
        });
    });

    master.on('connection', function(sock) {
      sock.once('error', function(er) {
        assert(er);
        ctl.stop(done);
      });
    });
  });

  it('should handle listen errors', function(done) {
    var master = new EventEmitter();
    var server = ctl.start(master, {addr:'/a/bad/path'});

    master.once('error', function(er) {
      console.log('er', er);
      assert(er);
      ctl.stop(done);
    });
  });
});
  
