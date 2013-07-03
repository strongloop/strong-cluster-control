// cmd: read or write a SINGLE json cmd object over a stream

var util = require('util');

exports.send = function(stream, obj) {
  var json = JSON.stringify(obj);
  stream.end(json);
};

exports.recv = function(stream, callback) {
  var chunks = [];
  stream
    .on('data', chunks.push.bind(chunks))
    .on('end', function() {
      var data = chunks.join('');
      try {
        callback(JSON.parse(data));
      } catch(er) {
        stream.emit('error', er);
      }
    });
}
