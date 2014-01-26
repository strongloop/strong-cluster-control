var cluster = require('cluster');
var extend = require('util')._extend;
var os = require('os');

module.exports = loadOptions;

function loadOptions(defaultOptions) {
  var clusterRole = {
    isWorker: cluster.isWorker,
    isMaster: cluster.isMaster
  };
  function extendWithRole(rc) {
    return extend(rc, clusterRole);
  }

  if(cluster.isWorker) {
    return extendWithRole({clustered: 'worker'});
  }

  var rc = require('rc')('cluster', defaultOptions);

  /*
  // XXX(sam) Candy, maybe add later, don't overly complicate this now.
  // --size is a pretty generic argument, override with workers if present
  if(rc.workers !== undefined) {
  rc.size = rc.workers;
  }
  */

  if(rc.size != null) {
    if(/^default$/i.test(rc.size) || /cpu/i.test(rc.size)) {
      rc.size = os.cpus().length;
      rc.clustered = true;
    } else if(/^[0-9]+$/.test(rc.size)) {
      rc.size = +rc.size;
      rc.clustered = true;
    } else {
      rc.clustered = false;
    }
  } else {
    rc.clustered = false;
  }

  if(!rc.clustered) {
    return extendWithRole({clustered: false});
  }

  rc.clustered = 'master';

  return extendWithRole(rc);
}

