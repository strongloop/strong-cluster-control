#!/usr/bin/env node

version = require('../package.json').version;
program = require('commander');

program.version(version);

program.parse(process.argv);
