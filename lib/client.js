// client: send a client request, callback with an answer

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
