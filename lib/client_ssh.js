var Connection = require('ssh2');

function parseRemote(str) {
  var parts = str.split('@');
  return {
    username: parts[0],
    host: parts[1],
    agent: process.env.SSH_AUTH_SOCK
  };
}

function connect(remote, path, cb) {
  var remote_pipe = [
    process.execPath,
    require.resolve('./stdio-pipe.js'), // PoC: assumes same path as local
    path
  ].join(' ');

  var ssh = new Connection();

  remote = parseRemote(remote);

  ssh.on('ready', function() {
    ssh.exec(remote_pipe, function(err, node) {
      if (err) throw err;
      cb.call(node);
    });
  });

  ssh.connect(remote);

  // acts enough like a socket for ./client.js
  return ssh;
}

module.exports.connect = connect;
