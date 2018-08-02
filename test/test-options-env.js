// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

"use strict";

var cluster = require("cluster");
var masterGenerator = require("../lib/master");
var tap = require("tap");

var master = masterGenerator();

tap.test("should use options.env with fork", function(t) {
  cluster.setupMaster({
    exec: "test/workers/null.js"
  });

  t.on("end", master.stop);

  master.start({
    size: 1,
    env: { SOME_VAR: "MY VALUE" }
  });

  master.once("startWorker", function(worker) {
    worker.once("message", function(msg) {
      t.equal(msg.env.SOME_VAR, "MY VALUE");
      t.end();
    });
  });
});
