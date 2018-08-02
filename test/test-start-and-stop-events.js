// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

"use strict";

var cluster = require("cluster");
var masterGenerator = require("../lib/master");
var tap = require("tap");

var master = masterGenerator();

cluster.setupMaster({
  exec: "test/workers/null.js"
});

tap.test("should start and stop", function(t) {
  t.test("notifying with events", function(t) {
    master.start();
    master.once("start", function() {
      master.stop();
      master.once("stop", t.end);
    });
  });

  t.test("notifying with callbacks", function(t) {
    master.start(function() {
      master.stop(t.end);
    });
  });

  t.end();
});
