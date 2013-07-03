#!/usr/bin/env node

var addr = require('../lib/ctl').ADDR;
var cmd = require('../lib/cmd');
var net = require('net');
var program = require('commander');
var version = require('../package.json').version;

program
  .version(version)
  ;

program.parse(process.argv);
// XXX .to(-t,--to)
//
// XXX .command()
//   - status (default)
//   - set-workers N
//   - get-workers
//   - add-workers [1]
//   - sub-workers [1]

var request = {
  cmd: 'status'
};

var ctl = net.connect(addr, connect)
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
