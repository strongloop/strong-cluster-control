// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

"use strict";

var _ = require("lodash");
var cluster = require("cluster");
var debug = require("debug")("strong-cluster-control:test");
var masterGenerator = require("../lib/master");
var tap = require("tap");

var master = masterGenerator();
debug("master", process.pid);

cluster.setupMaster({
  exec: "test/workers/null.js"
});

tap.test("restart all workers", function(t) {
  var SIZE = 5;
  var DELAY = 200;

  t.plan(4);

  master.start({ size: SIZE, throttleDelay: DELAY });
  master.once("resize", function() {
    var oldWorkers = Object.keys(cluster.workers);
    master.restart();
    t.deepEqual(master.getRestarting(), oldWorkers);
    master.once("startRestart", function(workers) {
      t.deepEqual(workers, oldWorkers);
    });
    master.once("restart", function() {
      var stillAlive = _.intersection(oldWorkers, Object.keys(cluster.workers));
      t.equal(stillAlive.length, 0, "no old workers are still alive");
      t.deepEqual(master.getRestarting(), null);
      master.stop();
    });
  });
});
