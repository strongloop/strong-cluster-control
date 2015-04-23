## Overview

The controller is exported by the `strong-cluster-control` module.

    control = require('strong-cluster-control')

## Methods

### control.start([options],[callback])

Start the controller.

* `options`: {Object} An options object, see below for supported properties,
  no default, and options object is not required.
* `callback`: {Function} A callback function, it is set as a listener for
  the `'start'` event.

The options are:

* `size`: {Integer} Number of workers that should be running, the default
  is to *not* control the number of workers, see `setSize()`

* `env`: {Object} Environment properties object passed to `cluster.fork()` if
  the controller has to start a worker to resize the cluster, default is null.

* `shutdownTimeout`: {Milliseconds} Number of milliseconds to wait after
  shutdown before terminating a worker, the default is 5 seconds, see
  `.shutdown()`
* `terminateTimeout`: {Milliseconds} Number of milliseconds to wait after
  terminate before killing a worker, the default is 5 seconds, see
  `.terminate()`
* `throttleDelay`: {Milliseconds} Number of milliseconds to delay restarting
   workers after they are exiting abnormally.  Abnormal is defined as
   as *not* suicide, see `worker.suicide` in
   [cluster docs](http://nodejs.org/docs/latest/api/cluster.html)

For convenience during setup, it is not necessary to wrap `.start()` in a protective
conditional `if(cluster.isMaster) {control.start()}`, when called in workers it quietly
does nothing but call its callback.

The 'start' event is emitted after the controller is started.

### control.stop([callback])

Stop the controller, after stopping workers (if the size is being controlled,
see `setSize()`).

Remove event listeners that were set on the `cluster` module.

* `callback`: {Function} A callback function, it is set as a listener for
  the `'stop'` event.

The 'stop' event is emitted after the controller is stopped.

When there are no workers or listeners, node will exit, unless the application
has non-cluster handles open. Open handles can be closed in the 'stop' event
callback to allow node to shutdown gracefully, or `process.exit()` can be
called, as appropriate for the application.

### control.restart()

Restart workers one by one, until all current workers have been restarted.

This can be used to do a rolling upgrade, if the underlying code has changed.

Old workers will be restarted only if the last worker to be restarted stays
alive for more than `throttleDelay` milliseconds, ensuring that the current
workers will not all be killed while the new workers are failing to start.

### control.status()

Returns the current cluster status. Its properties include:

 - `master`: {Object}
   - `pid`: The pid of the Master process.
 - `workers`: {Array} An Array of Objects containing the following properties:
    - `id`: The id of the Worker within the Master.
    - `pid`: The pid of the Worker process.
    - `uptime`: The age of the Worker process in milliseconds.
    - `startTime`: The time the Worker was started in milliseconds since epoh.

### control.setSize(N)

Set the size of the cluster.

* `N`: {Integer or null} The size of the cluster is the number of workers
  that should be maintained online. A size of `null` clears the size, and
  disables the size control feature of the controller.

The cluster size can be set explicitly with `setSize()`, or implicitly through
the `options` provided to `.start()`, or through the control channel.

The size cannot be set until the controller has been started, and will not be
maintained after the cluster has stopped.

Once set, the controller will listen on cluster `fork` and `exit` events,
and resize the cluster back to the set size if necessary. After the cluster has
been resized, the 'resize' event will be emitted.

When a resize is necessary, workers will be started or stopped one-by-one until
the cluster is the set size.

Cluster workers are started with `cluster.fork(control.options.env)`, so the
environment can be set, but must be the same for each worker. After a worker has
been started, the 'startWorker' event will be emitted.

Cluster workers are stopped with `.shutdown()`. After a worker has been stopped,
the 'stopWorker' event will be emitted.

### control.shutdown(id)

Disconnect worker `id` and take increasingly agressive action until it exits.

* `id` {Number} Cluster worker ID, see `cluster.workers` in
  [cluster docs](http://nodejs.org/docs/latest/api/cluster.html)

The effect of disconnect on a worker is to close all the servers in the worker,
wait for them to close, and then exit. This process may not occur in a timely
fashion if, for example, the server connections do not close. In order to
gracefully close any open connections, a worker may listen to the `SHUTDOWN`
message, see `control.cmd.SHUTDOWN`.

Sends a `SHUTDOWN` message to the identified worker, calls
`worker.disconnect()`, and sets a timer for `control.options.shutdownTimeout`.
If the worker has not exited by that time, calls `.terminate()` on the worker.

### control.terminate(id)

Terminate worker `id`, taking increasingly aggressive action until it exits.

* `id` {Number} Cluster worker ID, see `cluster.workers` in
  [cluster docs](http://nodejs.org/docs/latest/api/cluster.html)

The effect of sending SIGTERM to a node process should be to cause it to exit.
This may not occur in a timely fashion if, for example, the process is ignoring
SIGTERM, or busy looping.

Calls `worker.kill("SIGTERM")` on the identified worker, and sets a timer for
`control.options.terminateTimeout`. If the worker has not exited by that time,
calls `worker.("SIGKILL")` on the worker.

## Properties

### control.options

A copy of the options set by calling `.start()`.

It will have any default values set in it, and will be kept synchronized with
changes made via explicit calls, such as to `.setSize()`.

Visible for diagnostic and logging purposes.  Do *not* modify the options
directly.

### control.cmd.SHUTDOWN

* {String} `'CLUSTER_CONTROL_shutdown'`

The `SHUTDOWN` message is sent by `.shutdown()` before disconnecting the worker,
and can be used to gracefully close any open connections before the
`control.options.shutdownTimeout` expires.

All connections will be closed at the TCP level when the worker exits or is
terminated, but this message gives the opportunity to close at a more
application-appropriate time, for example, after any outstanding requests have
been completed.

The message format is:

    { cmd: control.cmd.SHUTDOWN }

It can be received in a worker by listening for a `'message'` event with a
matching `cmd` property:

    process.on('message', function(msg) {
        if(msg.cmd === control.cmd.SHUTDOWN) {
            // Close any open connections as soon as they are idle...
        }
    });

### control.CPUS

The number of CPUs reported by node's `os.cpus().length`, this is a good default
for the cluster size, in the absence of application specific analysis of what
would be an optimal number of workers.

## Events

### 'start'

Event emitted after control has started. Control is considered started
after the 'listening' event has been emitted.

Starting of workers happens in the background, if you are specifically
interested in knowing when all the workers have started, see the 'resize'
event.

### 'stop'

Event emitted after control has stopped, see `.stop()`.

### 'error'

* {Error Object}

Event emitted when an error occurs. The only current source of errors is the control
protocol, which may require logging of the errors, but should not effect the
operation of the controller.

### 'setSize'

* {Integer} size, the number of workers requested (will always
  be the same as `cluster.options.size`)

Event emitted after `setSize()` is called.

### 'resize'

* {Integer} size, the number of workers now that resize is complete (will always
  be the same as `cluster.options.size`)

Event emitted after a resize of the cluster is complete. At this point, no more
workers will be forked or shutdown by the controller until either the size is
changed or workers fork or exit, see `setSize()`.

### 'startWorker'

* `worker` {Worker object}

Event emitted after a worker which was started during a resize comes online, see the
node API documentation for description of `worker` and "online".

### 'startRestart'

* `workers` {Array of worker IDs} Workers that are going to be restarted.

Event emitted after `restart()` is called with array of worker IDs that will be
restarted.

### 'restart'

Event emitted after after all the workers have been restarted.

### 'stopWorker'

* `worker` {Worker object}
* `code` {Number} the exit code, if it exited normally.
* `signal` {String} the name of the signal if it exited due to signal

Event emitted after a worker which was shutdown during a resize exits, see the node
API documentation for a description of `worker`.

The values of `code` and `signal`, as well as of `worker.suicide`, can be used
to determine how gracefully the worker was stopped. See `.terminate()`.
