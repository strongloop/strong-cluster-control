#!/usr/bin/env node

var ADDR = require('../lib/ctl').ADDR;
var Client = require('../lib/client');
var cmd = require('../lib/cmd');
var net = require('net');
var program = require('commander');
var version = require('../package.json').version;

var request = {
  cmd: 'status'
};

program
  .version(version)
  .option('-t, --to <socket>', 'cluster ctl socket to connect to, default to $CWD/clusterctl')
  ;

program
  .command('status')
  .description('status of cluster, default command')
  .action(function() {
    request.cmd = 'status';
  });

// XXX temporary, for testing
program
  .command('disconnect')
  .action(function() {
    request.cmd = 'disconnect';
  });

program
  .command('fork')
  .action(function() {
    request.cmd = 'fork';
  });

//   - set-workers N
//   - get-workers
//   - add-workers [1]
//   - sub-workers [1]

program.to = ADDR;

program.parse(process.argv);

var client = new Client(program.to, request, response)
  .on('end', function() {
    console.log('cli - on end');
  })
  .on('error', function(er) {
    console.log('cli - on error', er);
    process.exit(1);
  });

function response(rsp) {
  console.log('cli - response', rsp);
}
