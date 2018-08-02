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

tap.test("should stop workers it started", function(t) {
  process.throwDeprecation = true;
  master.start({ size: 1 }, function() {
    master.once("resize", function() {
      master.stop(function() {
        t.equal(workerCount(), 0);
        t.end();
      });
    });
  });
});

tap.test("should not stop workers it did not start", function(t) {
  master.start(function() {
    cluster.fork();
    cluster.once("online", function() {
      t.equal(workerCount(), 1);
      master.stop(function() {
        t.equal(workerCount(), 1);
        cluster.disconnect();
        t.end();
      });
    });
  });
});
