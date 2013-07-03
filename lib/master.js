var ctl = require('./ctl.js');
var EventEmitter = require('events').EventEmitter;

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

master.echo = echo;
master.start = start;

function echo(data, callback) {
  console.log('master - echo', data);
  nextTick(callback.bind(null, data));
  return this;
}

function start() {
  console.log('master - start');
  var self = master; // Probably not called on an object, so force it.
  ctl.start(self);
  return self;
}

module.exports = master;
