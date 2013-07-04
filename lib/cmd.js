// cmd: send or recv a single json cmd object over a stream

var util = require('util');

function send(stream, obj) {
  var json = JSON.stringify(obj);
  stream.end(json);
};

function recv(stream, callback) {
  var chunks = [];
  stream
    .on('data', chunks.push.bind(chunks))
    .on('end', function() {
      var data = chunks.join('');
      try {
        callback(JSON.parse(data));
      } catch(er) {
        stream.emit('error', er);
        stream.destroy();
      }
    });
}

exports.send = send;
exports.recv = recv;
