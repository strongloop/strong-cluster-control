// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

"use strict";

var _ = require("lodash");
var cluster = require("cluster");
var masterGenerator = require("../lib/master");
var tap = require("tap");

var master = masterGenerator();
cluster.setupMaster({
  exec: "workers/null.js"
});

tap.test("should stop workers it started", function(t) {
  master.start(function() {
    var worker = cluster.fork();
    worker
      .once("fork", function() {
        t.assert(_.isFinite(worker.startTime));
        t.assert(_.isFinite(worker.process.pid));
        worker.process.kill("SIGINT");
      })
      .on("exit", function(code, signal) {
        var SIGINT = 2;
        if (signal) t.equal(signal, "SIGINT");
        // 0.10 exits with 0x80 + signal number
        else t.equal(code - 0x80, SIGINT);
        t.end();
      });
  });
});
