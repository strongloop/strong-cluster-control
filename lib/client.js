// client: make requests of the cluster controller

var net = require('net');

var cmd = require('./cmd');
var ctl = require('./ctl');
var debug = require('./debug');
var toPipe = require('./pipe').toPipe;

var remote_net = require('./client_ssh');

// make a single request, response is passed to the callback, and the socket is
// returned so it can be listened to for the 'error' event
function client(addr, remote, request, callback) {
  addr = addr || ctl.ADDR;
  addr = toPipe(addr);

  debug('client - connect to', addr);

  var sock = remote ? remote_net.connect(remote, addr, connect) : net.connect(addr, connect);

  function connect() {
    debug('client - send request', request);
    cmd.send(this, request);
    cmd.recv(this, function (response) {
      debug('client - receive response', response);
      sock.end();
      return callback(response);
    });
  }

  return sock;
}

exports.request = client;
exports.ADDR = ctl.ADDR;
