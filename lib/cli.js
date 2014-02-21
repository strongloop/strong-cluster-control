// cli: the cluster control cli, as a callable funcdtion

module.exports = cli;

function cli(argv, version, cb) {
  // Modify the command name to reflect the environment, so that commander
  // reports this as being an slc sub-command (when it is).
  if(process.env.SLC_COMMAND) {
    process.argv[1] = 'slc ' + process.env.SLC_COMMAND;
  }

  var program = require('commander');

  var ADDR = require('../lib/ctl').ADDR;
  var client = require('../lib/client');
  var debug = require('../lib/debug');

  var request = {
    cmd: 'status'
  };
  var display = displayStatusResponse;

  debug('version %s argv:', version, argv);

  if(version != null) {
    program.version(version);
  }

  program
  .option('-p,--path,--port <path>', 'name of control socket, defaults to ' + client.ADDR)
  .option('-r,--remote <ssh-user@ssh-host>', 'remote server where strong-cluster-control socket is')
  ;

  program
  .command('status')
  .description('report status of cluster workers, the default command')
  .action(function() {
    request.cmd = 'status';
    display = displayStatusResponse;
  });

  function displayStatusResponse(rsp) {
    if(rsp.master) {
      console.log('master pid: %d', rsp.master.pid);
    }
    console.log('worker count:', rsp.workers.length);
    for(var i = 0; i < rsp.workers.length; i++) {
      var worker = rsp.workers[i];
      var id = worker.id;
      delete worker.id;
      console.log('worker id', id +':', worker);
    }
  }

  program
  .command('set-size')
  .description('set-size N, set cluster size to N workers')
  .action(function(size) {
    request.cmd = 'set-size';
    request.size = parseInt(size, 10);
    display = function(){};
  });

  program
  .command('stop')
  .description('stop, shutdown all workers and stop controller')
  .action(function() {
    request.cmd = 'stop';
    display = function(){};
  });

  program
  .command('restart')
  .description('restart, restart all workers')
  .action(function() {
    request.cmd = 'restart';
    display = function(){};
  });

  program
  .command('disconnect')
  .description('disconnect all workers')
  .action(function() {
    request.cmd = 'disconnect';
    display = console.log;
  });

  program
  .command('fork')
  .description('fork one worker')
  .action(function() {
    request.cmd = 'fork';
    display = console.log;
  });

  program
  .on('*', function(name) {
    return cb('unknown command: ' + name);
  });

  program.parse(argv);

  client.request(program.path, program.remote, request, response)
  .on('error', function(er) {
    return cb('Communication error (' + er.message + '), check master is listening');
  });

  function response(rsp) {
    if(rsp.error) {
      return cb('command', request.cmd, 'failed with', rsp.error);
    }
    display(rsp);
  }
}
