#!/usr/bin/env node

var cli = require('..').cli;
var version = require('../package.json').version;

cli(process.argv, version, function(erMsg) {
  if(erMsg) {
    console.error(erMsg);
    process.exit(1);
  }
});
