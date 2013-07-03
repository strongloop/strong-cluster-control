var ctl = require('./ctl.js');
var EventEmitter = require('events').EventEmitter;

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

master.request = request;
master.start = start;

function request(req, callback) {
  console.log('master - request', req);

  // XXX echo request for now
  process.nextTick(callback.bind(null, req));
  return this;
}

function start() {
  console.log('master - start');
  var self = master; // Probably not called on an object, so force it.
  ctl.start(self);
  return self;
}

module.exports = master;
