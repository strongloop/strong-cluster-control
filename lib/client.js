// client: send a client request, callback with an answer

var cmd = require('./cmd');
var net = require('net');

function Client(addr, request, callback) {
  var ctl = net.connect(addr, connect);

  function connect() {
    cmd.send(this, request);
    cmd.recv(this, callback);
  }

  return ctl;
}

module.exports = Client;
