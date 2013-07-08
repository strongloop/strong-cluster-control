// master: cluster control occurs in the master process

var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;

var ctl = require('./ctl.js');

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

master.request = request;
master.start = start;
master.stop = stop;

function request(req, callback) {
  console.log('master - request', req);

  var cmd = req.cmd;
  var rsp = {
  };

  if(cmd === 'status') {
    rsp.workers = [];

    for (var id in cluster.workers) {
      var w = cluster.workers[id];
      rsp.workers.push({
        id: id,
        pid: w.process.pid,
      });
    }

  } else if(cmd === 'disconnect') {
    // XXX temporary, for testing
    cluster.disconnect();

  } else if(cmd === 'fork') {
    // XXX temporary, for testing
    cluster.fork();

  } else {
    rsp.error = 'unsupported command ' + req.cmd;
  }

  process.nextTick(callback.bind(null, rsp));

  return this;
}

function start() {
  var self = master;
  console.log('master - start');
  ctl.start(self);
  self.once('listening', self.emit.bind(self, 'start'));
  return self;
}

function stop() {
  var self = master;
  ctl.stop(self.emit.bind(self, 'stop'));
}

module.exports = master;
