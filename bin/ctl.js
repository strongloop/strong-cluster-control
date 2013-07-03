#!/usr/bin/env node

var net = require('net');
var version = require('../package.json').version;
var program = require('commander');

program
  .version(version)
  ;

program.parse(process.argv);

var addr = require('../lib/ctl').ADDR;

var ctl = net.connect(addr, connect)
  .on('end', function() {
    console.log('cli - on end');
  })
  .on('error', function(er) {
    console.log('cli - on error', er);
  });

function connect() {
  console.log('cli - connect from', this.address(), 'to', this.remoteAddress);

  this.end();
}
