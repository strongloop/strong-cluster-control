// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

"use strict";

var cluster = require("cluster");
var masterGenerator = require("../lib/master");
var tap = require("tap");
var workerCount = require("./helpers").workerCount;

var master = masterGenerator();

cluster.setupMaster({
  exec: "test/workers/null.js"
});

tap.test("from size 1 to 0", function(t) {
  master.start({ size: 1 });
  master.once("startWorker", function() {
    master.setSize(0);
  });

  master.once("stopWorker", function(worker) {
    t.assert(worker.process.pid, "worker is valid");
    master.once("resize", function() {
      t.equal(workerCount(), 0);
      master.stop(t.end);
    });
  });
});
