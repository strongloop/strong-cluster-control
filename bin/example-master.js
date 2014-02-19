var control = require('../index');
var options = control.loadOptions();

console.log('cluster options:', options);

if(options.clustered && options.isMaster) {
  return control.start(options);
}

function whoAmI() {
  var cluster = require('cluster');
  if(cluster.isMaster)
    var name = 'master';
  else
    var name = 'worker id ' + cluster.worker.id;

  return name + ' pid ' + process.pid;
}

console.log(whoAmI(), 'example does no work... bye');
