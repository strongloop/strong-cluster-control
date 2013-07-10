// master: cluster control occurs in the master process

var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var ctl = require('./ctl');
var debug = require('./debug');

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

function clusterSize() {
  return Object.keys(cluster.workers).length;
}

master.request = request;
master.setSize = setSize;
master._resize = resize;
master._startOne = startOne;
master._stopOne = stopOne;
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

  } else if(cmd === 'set-size') {
    try {
      master.setSize(req.size);
    } catch(er) {
      rsp.error = er.message;
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

  if(callback) {
    process.nextTick(callback.bind(null, rsp));
  }

  return this;
}

// XXX how to check for properly formed int?
function setSize(size) {
  var self = this;

  debug('master - set size to', size, 'from', self.size);

  self.size = size;

  process.nextTick(self._resize.bind(self));

  return self;
}

function resize() {
  var self = this;

  if(self.size === null || self.size === undefined) {
    return;
  }

  var currentSize = clusterSize();

  debug('master - resize to', self.size, 'from', currentSize, 'resizing?', self._resizing);

  if(self._resizing) {
    // don't start doing multiple resizes in parallel, the events get listened
    // on by both sets, and get multi-counted
    return;
  }

  self._resizing = true;

  if(currentSize < self.size) {
    self._startOne(resized);
  } else if(currentSize > self.size) {
    self._stopOne(resized);
  } else {
    debug('master - worker count resized to', self.size);
    self._resizing = false;
    self.emit('resize', self.size);
  }

  function resized() {
    self._resizing = false;
    self._resize();
  }

  return self;
}

function startOne(callback) {
  var self = this;
  var worker = cluster.fork(self.options.env);

  debug('master - one worker forked', worker.id);

  worker.once('online', online);
  worker.once('exit', exit);

  function online() {
    debug('master - one worker started online', this.id);
    self.emit('startWorker', worker);
    worker.removeListener('exit', exit);
    callback(worker);
  }

  function exit() {
    // XXX TODO handle failure to start, this will currently busy loop
    debug('master - one worker started exit', this.id, 'suicide?', this.suicide);
    worker.removeListener('online', online);
    callback();
  }
}

// stop via disconnect the first worker that has not had .disconnect() called on
// it already
function stopOne(callback) {
  var self = this;
  // XXX(sam) picks by key order, semi random? should it sort by id, and
  // disconnect the lowest? or sort by age, when I have it, and do the oldest?
  var workerIds = Object.keys(cluster.workers);
  for(var i = workerIds.length - 1; i >= 0; i--) {
    var id = workerIds[i];
    var worker = cluster.workers[id];
    var connected = !worker.suicide; // suicide is set after .disconnect()

    debug('master - considering worker for stop', id, 'connected?', connected);

    if(connected) {
      worker.once('exit', function(code, signal) {
        debug('master - one worker stopped', this.id, 'code?', code, 'signal?', signal);
        self.emit('stopWorker', worker, code, signal);
        callback();
      });
      worker.disconnect();
      return;
    }
  }
  debug('master - found no workers to stop');
  process.nextTick(callback);
}

// Functions need to be shared between start and stop, so they can be removed
// from the events on stop.
function resizeOnExit(worker, code, signal) {
  debug('master - on worker exit', worker.id, 'code?', code, 'signal?', signal);
  master._resize();
}

function resizeOnFork(worker, code, signal) {
  debug('master - on worker fork', worker.id);
  master._resize();
}

function start(options, callback) {
  var self = master;

  // both options and callback are optional, adjust position based on type
  if(typeof callback === 'undefined') {
    if(typeof options === 'function') {
      callback = options;
      options = undefined;
    }
  }

  options = util._extend({}, options);
  options.addr = options.path || options.port;

  debug('master - start', options, callback);

  self.options = options;

  self.setSize(options.size);

  cluster.on('exit', resizeOnExit);
  cluster.on('fork', resizeOnFork);

  ctl.start(self, {addr:options.addr});

  if(callback) {
    self.once('start', callback);
  }

  self.once('listening', function(server) {
    self.emit('start', server.address());
  });

  return self;
}

function stop(callback) {
  var self = master;
  if(callback) {
    self.once('stop', callback);
  }
  cluster.removeListener('exit', resizeOnExit);
  cluster.removeListener('fork', resizeOnFork);
  ctl.stop(self.emit.bind(self, 'stop'));
}

module.exports = master;
