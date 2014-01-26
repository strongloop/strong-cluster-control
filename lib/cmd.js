// cmd: send or recv a single json cmd object over a stream, followed by a
// stream .end() (commands are single-shot). This json-followed-by-end protocol
// is used by both client and server.

var debug = require('./debug');
var util = require('util');

function send(stream, obj) {
  var json = JSON.stringify(obj);
  stream.write(json);
  stream.write('\n');
}

function recv(stream, callback) {
  var chunks = [];
  stream
    .on('end', function() {
      this.end();
    })
    .on('data', function(chunk) {
      chunks.push(chunk);

      if(!/\n$/.test(chunk)) {
        return; // Wait for more
      }
      var data = chunks.join('');
      chunks = [];
      try {
        callback(JSON.parse(data));
      } catch(er) {
        stream.emit('error', er);
        stream.destroy();
      }
    })
    ;
}

exports.send = send;
exports.recv = recv;
