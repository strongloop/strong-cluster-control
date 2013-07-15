// null worker... it should not exit until explicitly disconnected

var assert = require('assert');
var cluster = require('cluster');
var net = require('net');

var debug = require('../../lib/debug');

debug('worker start', process.pid, process.argv);

assert(!cluster.isMaster);

process.send({
  env:process.env,
  argv:process.argv
});

process.on('message', function(msg) {
  if(msg.cmd === 'EXIT') {
    process.exit(msg.code);
  }
  if(msg.cmd === 'BUSY') {
    makeBusy(function() {
      process.send({cmd:'BUSY'});
    });
  }
  if(msg.cmd === 'LOOP') {
    makeUnexitable(function() {
      process.send({cmd:'LOOP'});
    });
  }
});

process.on('disconnect', function() {
  debug('worker disconnect', process.pid);
});

process.on('exit', function() {
  debug('worker exit', process.pid);
});

function makeUnexitable(callback) {
  process.on('SIGTERM', function() { }); // Ignore SIGTERM
  process.on('exit', function() { while(true){} });
  process.nextTick(callback);
}

// disconnect does not take place until all servers are closed, which doesn't
// happen until all connections to servers are closed, so create a connection to
// self and don't close
function makeBusy(callback) {
  var server, client, port;

  server = net.createServer()
    .listen(0, function() {
      port = server.address().port;
      debug('worker: listen on port', port);
      createClient();
    })
    .on('connection', acceptClient)
    .on('close', function() {
      debug('worker: on server/close');
    });


  function acceptClient(accept) {
    debug('worker: accept', accept.address());

    accept.on('close', function() {
      debug('worker: on accept/close');
    });
    accept.on('end', function() {
      debug('worker: on accept/end, .end() our side');
      accept.end();
    });
  }

  function createClient() {
    debug('worker: connect to port', port);
    client = net.connect(port)
      .on('connect', function() {
        debug('worker: on client/connect, send ONLINE to master');
        callback();
      });
  }
}
