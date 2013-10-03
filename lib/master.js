// master: cluster control occurs in the master process

var assert = require('assert');
var cluster = require('cluster');
var EventEmitter = require('events').EventEmitter;
var os = require('os');
var util = require('util');

var ctl = require('./ctl');
var debug = require('./debug');
var msg = require('./msg');

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

function clusterSize() {
  return Object.keys(cluster.workers).length;
}

var OPTION_DEFAULTS = {
    shutdownTimeout: 5000,
    terminateTimeout: 5000,
    throttleDelay: 2000,
};

master.request = request; // XXX(sam) not public, should be master._request
master.status = status;
master.setSize = setSize;
master._resize = resize;
master._startOne = startOne;
master._stopOne = stopOne;
master.shutdown = shutdown;
master.terminate = terminate;
master.options = util._extend({}, OPTION_DEFAULTS);
master.restart = restart;
master.start = start;
master.stop = stop;
master.loadOptions = require('./load-options');
master.ADDR = ctl.ADDR;
master.CPUS = os.cpus().length;
master.cmd = msg;

function request(req, callback) {
  debug('master - request', req);

  var cmd = req.cmd;
  var rsp = {
  };

  if(cmd === 'status') {
    rsp = master.status();
  } else if(cmd === 'set-size') {
    try {
      master.setSize(req.size);
    } catch(er) {
      rsp.error = er.message;
    }

  } else if(cmd === 'stop') {
    try {
      master.stop();
    } catch(er) {
      rsp.error = er.message;
    }

  } else if(cmd === 'restart') {
    try {
      master.restart();
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

function status() {
  var retval = {};

  retval.workers = [];

  for (var id in cluster.workers) {
    var w = cluster.workers[id];
    retval.workers.push({
      id: id,
      pid: w.process.pid,
    });
  }

  return retval;
}

// TODO(schoon) - Check for valid size with `typeof`, et al or use `is2`.
function setSize(size) {
  var self = this;

  debug('master - set size to', size, 'from', self.size);

  self.options.size = self.size = size;

  process.nextTick(self._resize.bind(self));

  return self;
}

// Remember, suicide is the normal exit path, if a worker dies without suicide
// being set then it is abnormal, and we record the time.
function _recordSuicide(self, worker) {
  if(worker && !worker.suicide) {
    self._lastAbnormalExit = Date.now();
    debug('master - abormal exit by worker %s at time %s', worker.id, self._lastAbnormalExit);
  }
}

// With a few seconds of an abnormal exit, throttle the worker creation rate to
// one per second. We wait for longer than the throttleDelay to see if the new
// worker is going to stay up, or just exit right away.
function _startDelay(self) {
  var throttlePeriod = self.options.throttleDelay * 2;
  if(Date.now() - self._lastAbnormalExit < throttlePeriod) {
    return self.options.throttleDelay;
  }
  return 0;
}

function resize(worker) {
  var self = this;

  _recordSuicide(self, worker);

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
    _startOneAfterDelay(self, _startDelay(self), resized);
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

function _startOneAfterDelay(self, delay, callback) {
  if(delay) {
    debug('master - delay worker start by %s', delay);
    setTimeout(function() {
      self._startOne(callback);
    }, delay);
  } else {
    self._startOne(callback);
  }
}

function startOne(callback) {
  var self = this;
  var worker = cluster.fork(self.options.env);

  debug('master - worker %s forked', worker.id);

  worker.once('online', online);
  worker.once('exit', exit);

  function online() {
    debug('master - worker %s started online', this.id);
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

// shutdown the first worker that has not had .disconnect() called on it already
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
      worker.once('exit', function(code, sig) {
        debug('master - one worker stopped', this.id, 'code', code, 'sig', sig);
        self.emit('stopWorker', worker, code, sig);
        callback();
      });
      self.shutdown(worker.id);
      return;
    }
  }
  debug('master - found no workers to stop');
  process.nextTick(callback);
}

// Return worker by id, ensuring it is annotated with an _control property.
function toWorker(id) {
  var worker = cluster.workers[id];
  assert(worker, 'worker id ' + id + ' invalid');
  worker._control = worker._control || {};
  if(!worker._control.birth) {
    worker._control.birth = Date.now();
  }
  return worker;
}

function setupControl(id) {
  return toWorker(id);
}

function shutdown(id) {
  var worker = toWorker(id);

  debug('master - shutdown', id, 'already?', !!worker._control.exitTimer);

  if(worker._control.exitTimer) {
    return;
  }
  worker.send({cmd: msg.SHUTDOWN});
  worker.disconnect();

  worker._control.exitTimer = setTimeout(function() {
    worker._control.exitTimer = null;
    master.terminate(null, worker);
  }, master.options.shutdownTimeout);

  worker.once('exit', function(code, signal) {
    debug('master - shutdown exit for', worker.id, cluster.workers[id]);
    clearTimeout(worker._control.exitTimer);
    master.emit('shutdown', this, code, signal);
  });

  return master;
}

// The worker arg is because as soon as a worker's comm channel closes, its
// removed from cluster.workers (the timing of this is not documented in node
// API), but it can be some time until exit occurs, or never. since we want to
// catch this, and TERM or KILL the worker, we need to keep a reference to the
// worker object, and pass it to terminate ourself, because we can no longer
// look it up by id.
function terminate(id, shutdownWorker) {
  worker = shutdownWorker || toWorker(id);

  debug('master - terminate', id, 'already?', !!worker._control.exitTimer);

  if(worker._control.exitTimer) {
    return;
  }
  worker.kill();

  worker._control.exitTimer = setTimeout(function() {
    worker.kill('SIGKILL');
  }, master.options.terminateTimeout);

  worker.once('exit', function(code, signal) {
    clearTimeout(worker._control.exitTimer);
    if(!shutdownWorker) {
      master.emit('terminate', this, code, signal);
    }
  });

  return master;
}

function restart() {
  var self = this;
  var oldIds = Object.keys(cluster.workers);
  var id;

  debug('master - restart:', oldIds);

  stopOneAfterResize();

  function stopOneAfterResize() {
    if(self._resizing) {
      return self.once('resize', stopOneAfterResize);
    }
    return restartOne();
  }

  function restartOne() {
    id = oldIds.shift();

    if(id == null) {
      debug('master - restarted old workers');
      return self.emit('restart');
    }

    var worker = cluster.workers[id];

    if(!worker) {
      // Worker could have stopped since restart began, don't bork
      debug('master - old worker %s already stopped', id);
      return restartOne();
    }

    debug('master - restart old worker', id);
    self.shutdown(id);

    self.once('resize', function() {
      setTimeout(stopOneAfterResize, self.options.throttleDelay);
    });

    return self;
  }

  return self;
}

// Functions need to be shared between start and stop, so they can be removed
// from the events on stop.
function onExit(worker, code, signal) {
  debug('master - on worker exit', worker.id,
        'code?', code, 'signal?', signal,
        'suicide?', worker.suicide);
  master._resize(worker);
}

function onFork(worker) {
  debug('master - on worker fork', worker.id);
  setupControl(worker.id);
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

  options = options || {};

  var port = options.port != null ? +options.port : undefined;

  self.options = { addr: options.path || options.port };
  self.options = util._extend(self.options, OPTION_DEFAULTS);
  self.options = util._extend(self.options, options);

  options = self.options;

  debug('master - start', options, callback);

  self.setSize(options.size);

  // When doing a stop/start, forget any previous abnormal exits
  self._lastAbnormalExit = undefined;

  cluster.on('exit', onExit);
  cluster.on('fork', onFork);

  for (var id in cluster.workers) {
    setupControl(id);
  }

  ctl.start(self, {addr: options.addr});

  if(callback) {
    self.once('start', callback);
  }

  self.once('listening', function(server) {
    process.nextTick(function() {
      self.emit('start', server.address());
    });
  });

  self._running = true;

  return self;
}

function stop(callback) {
  var self = master;
  if(callback) {
    self.once('stop', callback);
  }

  if(self._running && self.size != null) {
    // We forked workers, stop should shut them down
    self.setSize(0);
    self.once('resize', function(size) {
      if(size === 0) {
        stopListening();
      }
    });
  } else {
    stopListening();
  }
  return self;

  function stopListening() {
    self.setSize(undefined);
    cluster.removeListener('exit', onExit);
    cluster.removeListener('fork', onFork);
    ctl.stop(self.emit.bind(self, 'stop'));
  }
}

module.exports = master;
