var cluster = require('cluster');
var ctl = require('./ctl.js');
var EventEmitter = require('events').EventEmitter;

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

master.request = request;
master.start = start;

function request(req, callback) {
  console.log('master - request', req);

  var cmd = req.cmd;
  var rsp = {
  };

  if(cmd === 'status') {
    rsp.workers = [];

    cluster.workers.forEach(function(w,i) {
      rsp.workers[i] = {
        id: w.id,
        pid: w.process.pid,
      };
    });

  } else if(cmd === 'disconnect') {
    // XXX temporary, for testing
    cluster.disconnect();

  } else if(cmd === 'fork') {
    // XXX temporary, for testing
    cluster.fork();

  } else {
    rsp.error = 'unsupported command '+req.cmd
  }

  process.nextTick(callback.bind(null, rsp));

  return this;
}

function start() {
  console.log('master - start');
  var self = master; // Probably not called on an object, so force it.
  ctl.start(self);
  return self;
}

module.exports = master;
