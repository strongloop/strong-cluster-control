// ctl: start/stop the control channel server
//
// It accepts json requests, passes them to master object to be handled, and
// returns json responses. Currently a singleton.

var assert = require('assert');
var fs = require('fs');
var net = require('net');
var path = require('path');
var util = require('util');

var cmd = require('./cmd');
var debug = require('./debug');
var toPipe = require('./pipe').toPipe;

var ADDR = 'clusterctl';
var server;
var unlinkAddr;

function start(master, options) {
  options = util._extend({}, options);

  var addr = options.addr || ADDR;

  addr = toPipe(addr);

  debug('ctl - start on', addr, 'master', this);

  assert(!server, 'ctl is already started');


  unlinkAddr = function unlinkAddr() {
    if(process.platform === 'win32') {
      return;
    }
    try {
      fs.unlinkSync(addr);
    } catch(er) {
      debug('ctl - ignoring unlink', addr, 'error:', er.message);
    }
  };

  unlinkAddr();

  net.createServer(function (sock) {
    debug('ctl - accept connection, remoteAddress:', sock.remoteAddress);
    master.emit('connection', sock);

    sock.on('error', function(er) {
      // We just don't care if we fail to recv a request, or send a response.
      debug('ctl - destroy client on error', er.stack);
      sock.destroy();
    });

    sock.on('close', function(had_error) {
      debug('ctl - connection close, had_error?', had_error);
    });

    cmd.recv(sock, function(req) {
      debug('ctl - request', req);
      master.request(req, function(rsp) {
        debug('ctl - response', rsp);
        cmd.send(sock, rsp);
      });
    });

  }).on('error', function(er) {
    debug('ctl - channel error', er);
    master.emit('error', er);
  }).on('close', function() {
    debug('ctl - server close');
    server = undefined;
  }).listen(addr, function () {
    server = this; // because it isn't valid to close a server until it is listening
    debug('ctl - listen on', server.address());
    master.emit('listening', this);
  });

  process.once('exit', unlinkAddr);
}

function stop(callback) {
  var _ = server;

  debug('master - stopping control, server exists?', !!server);

  if(server) {
    server.close(function() {
      debug('master - server closed');
      unlinkAddr();
      process.removeListener('exit', unlinkAddr);
      callback();
    });
  } else {
    process.nextTick(callback);
  }

  server = undefined;

  return _;
}

exports.start = start;
exports.stop = stop;
exports.ADDR = ADDR;
