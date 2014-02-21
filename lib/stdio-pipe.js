// Simple pipe connector

var net = require('net');

// Use last CLI argument as path to pipe/socket
var addr = process.argv.pop();

// Connect to pipe/socket
var sock = net.connect(addr);

// Connect socket to stdio
sock.pipe(process.stdout);
process.stdin.pipe(sock);
