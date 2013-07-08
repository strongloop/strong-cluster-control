try {
  var master = require('cluster-control');
} catch(er) {
  var master = require('../index.js');
}

master.start();
