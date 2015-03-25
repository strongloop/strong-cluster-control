# strong-cluster-control

node cluster API wrapper and extensions

It is an extension of the node cluster module, not a replacement.

- runs `size` workers (optionally), and monitors them for unexpected death
- soft shutdown as well as hard termination of workers
- throttles worker restart rate if they are exiting abnormally

It can be added to an existing application using the node cluster module without
modifying how that application is currently starting up or using cluster, and
still make use of additional features.

This is a component of the StrongLoop process manager, see http://strong-pm.io.


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


## API

See http://apidocs.strongloop.com/strong-cluster-control/


## License

strong-cluster-control uses a dual license model.

You may use this library under the terms of the [Artistic 2.0 license][],
or under the terms of the [StrongLoop Subscription Agreement][].

[Artistic 2.0 license]: http://opensource.org/licenses/Artistic-2.0
[StrongLoop Subscription Agreement]: http://strongloop.com/license
