var control = require('../index');
var options = control.loadOptions();

if(options.clustered && options.isMaster) {
  return control.start(options);
}

console.log('example master does nothing in worker...');
