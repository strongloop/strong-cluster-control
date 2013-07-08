// client: create a client socket, sending a single client request over it, and
// calling back with the response. the socket is returned so it can be listened
// to for events, such as 'error'

var net = require('net');

var cmd = require('./cmd');
var ctl = require('./ctl');
var debug = require('./debug');

function Client(addr, request, callback) {
  addr = addr || ctl.ADDR;

  debug('client - connect to', addr);

  var sock = net.connect(addr, connect);

  function connect() {
    cmd.send(this, request);
    cmd.recv(this, callback);
  }

  return sock;
}

Client.ADDR = ctl.ADDR;

module.exports = Client;
