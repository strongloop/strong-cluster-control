// ctl: start/stop the control channel server
//
// It accepts json requests, passes them to master object to be handled, and
// returns json responses. Currently a singleton.

var assert = require('assert');
var cmd = require('./cmd');
var fs = require('fs');
var net = require('net');
var path = require('path');
var util = require('util');

var ADDR = path.resolve('clusterctl');
var server;

function start(master, options) {
  options = util._extend({addr:ADDR}, options);

  var addr = options.addr;

  console.log('ctl - start on', addr, 'master', this);

  assert(!server, 'ctl is already started');

  fs.unlink(addr, function () {
    net.createServer({allowHalfOpen: true}, function (sock) {
      console.log('ctl - accept connection', sock.remoteAddress);
      master.emit('connection', sock);

      sock.on('error', function(er) {
        // We just don't care if we fail to recv a request, or send a response.
        console.log('ctl - ignoring error', er.stack);
      });

      cmd.recv(sock, function(req) {
        master.request(req, function(rsp) {
          console.log('ctl - response', rsp);
          cmd.send(sock, rsp);
        });
      });

    }).on('error', function(er) {
      console.log('ctl - listen failed', er);
      master.emit('error', er);
    }).on('close', function() {
      server = undefined;
    }).listen(addr, function () {
      server = this; // because it isn't valid to close a server until it is listening
      console.log('ctl - listen on', server.address());
      master.emit('listening');
    });
  });

  process.on('exit', function() {
    try {
      fs.unlinkSync(addr);
    } catch (er) {
    }
  });

  return server;
}

function stop(callback) {
  var _ = server;

  if(server) {
    server.close(callback);
  } else {
    process.nextTick(callback);
  }

  server = undefined;

  return _;
}

exports.start = start;
exports.stop = stop;
exports.ADDR = ADDR;
