// require('JSONStream');

var assert = require('assert');
var cmd = require('./cmd');
var fs = require('fs');
var net = require('net');
var path = require('path');

var ADDR = path.resolve('clusterctl');

var server;

function start(master /*,options*/) {
  var addr = ADDR;

  console.log('ctl - start on', addr, 'master', this);

  assert(!server);

  server = net.createServer({allowHalfOpen: true}, function (sock) {
    console.log('ctl - connection from', sock.remoteAddress);
    master.emit('connection');

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
    server = undefined;
  });

  fs.unlink(addr, function (er) {
    if (er && er.code !== 'ENOENT') {
      master.emit('error', er);
    }
    server.listen(addr, function () {
      console.log('ctl - listen on', server.address());
      master.emit('listening');
    })
  });

  process.on('exit', function() {
    try {
      fs.unlinkSync(addr)
    } catch (er) {
    }
  })
}

exports.start = start;
exports.ADDR = ADDR;
