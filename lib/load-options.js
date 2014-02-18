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

  // size is API name in options object, but cluster makes more sense as a
  // command-line or json configuration file name
  if(rc.size === undefined) {
    rc.size = rc.cluster;
  }

  // --cluster, --cluster=cpu, --cluster=CPUs
  if(rc.size === true || /cpu/i.test(rc.size)) {
    rc.size = os.cpus().length;
    rc.clustered = true;
  }
  // --cluster=N, N is 0, 1, ...
  else if(/^[0-9]+$/.test(rc.size)) {
    rc.size = +rc.size;
    rc.clustered = true;
  // (no options), --no-cluster, --cluster=off
  } else {
    rc.clustered = false;
  }

  if(!rc.clustered) {
    return extendWithRole({clustered: false});
  }

  rc.clustered = 'master';

  return extendWithRole(rc);
}

