// master: cluster control occurs in the master process

var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var ctl = require('./ctl');
var debug = require('./debug');

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

master.request = request;
master.setSize = setSize;
master.start = start;
master.stop = stop;
master.ADDR = ctl.ADDR;

function request(req, callback) {
  debug('master - request', req);

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

function setSize(size) {
  var self = this;

  self.size = size;

  if(size == null) {
    return;
  }

  if(cluster.workers.length < self.size) {

  }
}

function start(options) {
  var self = master;
  options = util._extend({}, options);
  options.addr = options.path || options.port;

  debug('master - start');

  self.setSize(options.size);

  ctl.start(self, {addr:options.addr});

  self.once('listening', function(server) {
    self.emit('start', server.address());
  });

  return self;
}

function stop() {
  var self = master;
  ctl.stop(self.emit.bind(self, 'stop'));
}

module.exports = master;
