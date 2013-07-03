#!/usr/bin/env node

var ADDR = require('../lib/ctl').ADDR;
var cmd = require('../lib/cmd');
var net = require('net');
var program = require('commander');
var version = require('../package.json').version;

program
  .version(version)
  .option('-t, --to <socket>', 'cluster ctl socket to connect to, default to $CWD/clusterctl')
  ;

program
  .command('status')
  .description('status of cluster, default command')
  .action(function() {
    req.cmd = 'status';
  });

// XXX temporary, for testing
program
  .command('disconnect')
  .action(function() {
    req.cmd = 'disconnect';
  });

program
  .command('fork')
  .action(function() {
    req.cmd = 'fork';
  });

//   - set-workers N
//   - get-workers
//   - add-workers [1]
//   - sub-workers [1]

program.to = ADDR;

program.parse(process.argv);

var request = {
  cmd: 'status'
};

var ctl = net.connect(program.to, connect)
  .on('end', function() {
    console.log('cli - on end');
  })
  .on('error', function(er) {
    console.log('cli - on error', er);
    process.exit(1);
  });

function connect() {
  console.log('cli - connect from', this.address(), 'to', this.remoteAddress);

  cmd.send(this, request);
  cmd.recv(this, response);
}

function response(rsp) {
  console.log('cli - response', rsp);
}
