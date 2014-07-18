# Run-Time Management of a Node Cluster

Module for run-time management of a node cluster.

It is an extension of the node cluster module, not a replacement.

An alternative to integrating strong-cluster-control into an application using
the API is to use
[strong-supervisor](https://github.com/strongloop/strong-supervisor), a
runner-based wrapper that requires no code changes.

For full documentation, see 
[StrongLoop Documentation](http://docs.strongloop.com/display/SLC/Application+clustering).

- runs `size` workers (optionally), and monitors them for unexpected death
- run-time control of cluster through command line and API
- soft shutdown as well as hard termination of workers
- throttles worker restart rate if they are exiting abnormally

It can be added to an existing application using the node cluster module without
modifying how that application is currently starting up or using cluster, and
still make use of additional features.


## Install

    npm install --save strong-cluster-control


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

For more in-depth examples, see the
[in-source example](https://github.com/strongloop/strong-cluster-control/blob/master/bin/example-master.js),
or use [strong-supervisor](https://github.com/strongloop/strong-supervisor).
