// client: create a client socket, sending a single client request over it, and
// calling back with the response. the socket is returned so it can be listened
// to for events, such as 'error'

var net = require('net');

var cmd = require('./cmd');

function Client(addr, request, callback) {
  var ctl = net.connect(addr, connect);

  function connect() {
    cmd.send(this, request);
    cmd.recv(this, callback);
  }

  return ctl;
}

module.exports = Client;
