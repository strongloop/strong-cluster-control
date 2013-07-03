// require('JSONStream');

var assert = require('assert');
var fs = require('fs');
var net = require('net');
var path = require('path');

var ADDR = path.resolve('clusterctl');

var server;

function start(master /*,options*/) {
  var addr = ADDR;

  console.log('ctl - start on', addr, 'master', this);

  assert(!server);

  server = net.createServer(function (sock) {
    console.log('ctl - connection from', sock.remoteAddress);

    sock.on('end', function () {
      console.log('ctl - on end, .end()');
      sock.end();
    });
    
    sock.on('error', function () {
      console.log('ctl - on error, .destroy()');
      sock.destroy();
    });

    sock.on('data', function(data) {
      master.echo(data, function(echo) {
        sock.write(echo);
      });
    });
    master.emit('connection');
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
