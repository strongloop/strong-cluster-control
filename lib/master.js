// Copyright IBM Corp. 2013,2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

// master: cluster control occurs in the master process

/* eslint consistent-this: 0 */

var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var assert = require('assert');
var cluster = require('cluster');
var clusterSize = require('./util').clusterSize;
var debug = require('debug')('strong-cluster-control:master');
var liveWorkerIds = require('./util').liveWorkerIds;
var msg = require('./msg');
var nextTick = setImmediate;
var os = require('os');
var util = require('util');

// Master is a singleton, as is the cluster master
var master = new EventEmitter();

var OPTION_DEFAULTS = {
  shutdownTimeout: 5000,
  terminateTimeout: 5000,
  throttleDelay: 2000,
};

master.status = status;
master.setSize = setSize;
master._resize = resize;
master._startOne = startOne;
master._stopOne = stopOne;
master.shutdown = shutdown;
master.terminate = terminate;
master.options = util._extend({}, OPTION_DEFAULTS);
master.restart = restart;
master.getRestarting = getRestarting;
master.start = start;
master.stop = stop;
master.CPUS = os.cpus().length;
master.cmd = msg;
master.startTime = Date.now();

function status() {
  var retval = {};

  retval.master = {
    pid: process.pid,
    setSize: this.options.size,
    startTime: master.startTime,
  };

  retval.workers = [];

  var now = Date.now();

  for (var id in cluster.workers) {
    var w = toWorker(id);
    retval.workers.push({
      id: id,
      pid: w.process.pid,
      uptime: now - w.startTime,
      startTime: w.startTime,
    });
  }

  debug('status: %j', retval);

  return retval;
}

// cluster-control will set the size up and down in the process of restarting
// the cluster. During this time, we want the 'advertised target size' of the
// cluster to remain stable, since that is the size the cluster will be once the
// restart is complete. If invisible is set, cluster will go to `size`, but that
// size will not be stored in self.options.size, or returned by status().
function setSize(size, invisible) {
  var self = this;

  debug('set size to %d from %d', size, self.size);

  self.size = size;

  if (!invisible)
    self.options.size = size;

  nextTick(self.emit.bind(self, 'setSize', self.options.size));
  nextTick(self._resize.bind(self));

  return self;
}

// Remember, suicide is the normal exit path, if a worker dies without suicide
// being set then it is abnormal, and we record the time.
function _recordSuicide(self, worker) {
  if (worker && !worker.suicide) {
    self._lastAbnormalExit = Date.now();
    debug(
      'abormal exit by worker %s at time %s',
      worker.id, self._lastAbnormalExit);
  }
}

// With a few seconds of an abnormal exit, throttle the worker creation rate to
// one per second. We wait for longer than the throttleDelay to see if the new
// worker is going to stay up, or just exit right away.
function _startDelay(self) {
  var throttlePeriod = self.options.throttleDelay * 2;
  if (Date.now() - self._lastAbnormalExit < throttlePeriod) {
    return self.options.throttleDelay;
  }
  return 0;
}

function resize(worker) {
  var self = this;

  if (worker)
    debug('_resize: worker %s', worker.id);

  _recordSuicide(self, worker);

  if (self.size === null || self.size === undefined) {
    return self;
  }

  if (self._resizing) {
    // don't start doing multiple resizes in parallel, the events get listened
    // on by both sets, and get multi-counted
    return self;
  }

  var currentSize = clusterSize();

  debug('resize to %d from %d (apparent size %d)',
        self.size, currentSize, self.options.size);

  self._resizing = true;

  if (currentSize < self.size) {
    _startOneAfterDelay(self, _startDelay(self), resized);
  } else if (currentSize > self.size) {
    self._stopOne(resized);
  } else {
    debug('worker count resized to %j', self.size);
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
  if (delay) {
    debug('delay worker start by %s', delay);
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

  worker.once('online', online);
  worker.once('exit', exit);

  function online() {
    debug('worker %s online', this.id);
    self.emit('startWorker', worker);
    worker.removeListener('exit', exit);
    callback(worker);
  }

  function exit() {
    // XXX TODO handle failure to start, this will currently busy loop
    debug('one worker %s started exit suicide? %j', this.id, this.suicide);
    worker.removeListener('online', online);
    callback();
  }
}

// shutdown the first worker that has not had .disconnect() called on it already
function stopOne(callback) {
  var self = this;
  // XXX(sam) picks by key order, semi random? should it sort by id, and
  // disconnect the lowest? or sort by age, when I have it, and do the oldest?
  var workerIds = liveWorkerIds();
  for (var i = 0; i < workerIds.length; i++) {
    var id = workerIds[i];
    var worker = cluster.workers[id];
    var connected = !worker.suicide; // suicide is set after .disconnect()

    debug('considering worker %s for stop connected?', id, connected);

    if (connected) {
      self.shutdown(worker.id);
    }
    worker.once('exit', function(code, sig) {
      debug('one worker stopped: %d reason %j', this.id, sig || code);
      self.emit('stopWorker', worker, code, sig);
      callback();
    });
    return;
  }
  debug('found no workers to stop');
  nextTick(callback);
}

// Return worker by id, ensuring it is annotated with an _control property.
function toWorker(id) {
  var worker = cluster.workers[id];
  assert(worker, 'worker id ' + id + ' invalid');
  worker._control = worker._control || {};
  worker.startTime = worker.startTime || Date.now();
  return worker;
}

function setupControl(id) {
  return toWorker(id);
}

function shutdown(id) {
  var worker = toWorker(id);

  debug('shutdown %s already?', id, !!worker._control.exitTimer);

  if (worker._control.exitTimer) {
    return master;
  }
  worker.send({cmd: msg.SHUTDOWN});
  worker.disconnect();

  worker._control.exitTimer = setTimeout(function() {
    worker._control.exitTimer = null;
    master.terminate(null, worker);
  }, master.options.shutdownTimeout);

  worker.once('exit', function(code, signal) {
    debug('shutdown exit for worker %j', worker.id);
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
  var worker = shutdownWorker || toWorker(id);

  debug('terminate %s already?', id, !!worker._control.exitTimer);

  if (worker._control.exitTimer) {
    return master;
  }
  worker.kill();

  worker._control.exitTimer = setTimeout(function() {
    worker.kill('SIGKILL');
  }, master.options.terminateTimeout);

  worker.once('exit', function(code, signal) {
    clearTimeout(worker._control.exitTimer);
    if (!shutdownWorker) {
      master.emit('terminate', this, code, signal);
    }
  });

  return master;
}

// Increase size (invisibly) to one past the current configured size. Once the
// new worker has started, set the size back to the current configured size, the
// oldest worker will be killed and the new one will remain. Repeat until all
// old workers have been restarted.
function restart() {
  var self = this;
  var wasRestarting = self._restartIds;

  self._restartIds = _.union(self._restartIds, liveWorkerIds());

  debug('restart from size %d of %j', self.options.size, self._restartIds);

  nextTick(function() {
    self.emit('startRestart', self._restartIds);
  });

  if (wasRestarting)
    return self;

  nextTick(_restart);

  function _restart() {
    self._restartIds = _.intersection(self._restartIds, liveWorkerIds());

    if (self._restartIds.length === 0 || self.options.size === 0) {
      self._restartIds = null;
      return self.emit('restart');
    }

    startOne();
  }

  function startOne() {
    self.setSize(self.options.size + 1, true);

    self.once('resize', stopOne);
  }

  function stopOne() {
    waitForStability(function() {
      self.setSize(self.options.size);
      self.once('resize', _restart);
    });
  }

  function waitForStability(callback) {
    // Stable when the last abnormal exit was sufficiently long ago.
    setTimeout(check, self.options.throttleDelay).unref();

    function check() {
      if (unstable())
        return setTimeout(check, 1000).unref();
      return callback();
    }

    function unstable() {
      var uptime = Date.now() - self._lastAbnormalExit;
      var undersized = clusterSize() < self.size;
      var unstable = undersized || uptime < self.options.throttleDelay;
      debug('unstable? %j undersized? %j uptime %d ms',
            unstable, undersized, uptime);
      return unstable;
    }
  }

  return self;
}

function getRestarting() {
  return _.clone(this._restartIds);
}

// Functions need to be shared between start and stop, so they can be removed
// from the events on stop.
function onExit(worker, code, signal) {
  var reason = signal || code;
  debug('on worker %s exit by %s suicide? %j',
        worker.id, reason, worker.suicide);
  master._resize(worker);
}

function onFork(worker) {
  debug('on worker %s fork', worker.id);
  setupControl(worker.id);
  master._resize();
  master.emit('fork', worker);
  // emits on worker itself, _after_ it has been setup for control
  worker.emit('fork');
}

function start(options, callback) {
  var self = master;

  // both options and callback are optional, adjust position based on type
  if (typeof callback === 'undefined') {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
  }

  options = options || {};

  self.options = {};
  self.options = util._extend(self.options, OPTION_DEFAULTS);
  self.options = util._extend(self.options, options);

  options = self.options;

  debug('start %j cb? %s', options, callback);

  self.setSize(options.size);

  // When doing a stop/start, forget any previous abnormal exits
  self._lastAbnormalExit = undefined;

  cluster.on('exit', onExit);
  cluster.on('fork', onFork);

  for (var id in cluster.workers) {
    setupControl(id);
  }

  if (callback) {
    self.once('start', callback);
  }

  nextTick(function() {
    self.emit('start');
  });

  self._running = true;

  return self;
}

function stop(callback) {
  var self = master;
  if (callback) {
    self.once('stop', callback);
  }

  if (self._running && self.size != null) {
    // We forked workers, stop should shut them down
    self.setSize(0);
    self.once('resize', function(size) {
      if (size === 0) {
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
    nextTick(self.emit.bind(self, 'stop'));
  }
}

module.exports = master;
