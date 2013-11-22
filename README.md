# Run-Time Management of a Node Cluster

Module for run-time management of a node cluster.
It is an extension of the node cluster module, not a replacement.

For full documentation, see 
[StrongLoop Suite Documentation - Clustering applications](http://docs.strongloop.com/display/DOC/Clustering+applications).

- runs `size` workers (optionally), and monitors them for unexpected death
- run-time control of cluster through command line and API
- soft shutdown as well as hard termination of workers
- throttles worker restart rate if they are exiting abnormally

It can be added to an existing application using the node cluster module without
modifying how that application is currently starting up or using cluster, and
still make use of additional features.

The controller module allows the cluster to be controlled through the

- clusterctl command line, or
- API calls on the module


## Install

    npm install --save strong-cluster-control

The command line:

    npm install -g strong-cluster-control
    clusterctl --help


## Example

To instantiate cluster-control:

```javascript
var cluster = require('cluster');
var control = require('strong-cluster-control');

// global setup here...

control.start({
    size: control.CPUS
}).on('error', function(er) {
    console.error(er);
});

if(cluster.isWorker) {
    // do work here...
}
```

To control the cluster, assuming `my-server` is running in `/apps/`:

    clusterctl --path /apps/my-server/clusterctl set-size 4
    clusterctl --path /apps/my-server/clusterctl status
    worker count: 4
    worker id 0: { pid: 11454 }
    worker id 1: { pid: 11471 }
    worker id 2: { pid: 11473 }
    worker id 3: { pid: 11475 }

For more in-depth examples, see the [chat server example](https://github.com/strongloop/slnode-examples/tree/master/chat),
and the
[in-source example](https://github.com/strongloop/strong-cluster-control/blob/master/bin/example-master.js).


## clusterctl: Command Line Interface

The `clusterctl` command line utility can be used to control a cluster at
run-time. It defaults to communicating over the `clusterctl` named socket
in the current working directory, but an explicit path or port can be
provided.

It provides the following commands:

- status: reports the status of the cluster workers
- set-size: set cluster size to some number of workers
- disconnect: disconnect all workers
- fork: fork one worker

`disconnect` and `fork` cause the cluster size to change, so new workers will
probably be started or stopped to return the cluster to the set size. They are
primarily for testing and development.
