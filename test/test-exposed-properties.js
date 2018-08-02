// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

"use strict";

var _ = require("lodash");
var masterGenerator = require("../lib/master");
var tap = require("tap");
var os = require("os");

var master = masterGenerator();

tap.test("master should expose", function(t) {
  t.test("cpu count, for easy use as a default size", function(t) {
    t.equal(master.CPUS, os.cpus().length);
    t.end();
  });

  t.test("master process start time", function(t) {
    t.assert(_.isFinite(master.startTime));
    t.end();
  });

  t.test("message cmd names in master", function(t) {
    t.equal(master.cmd.SHUTDOWN, "CLUSTER_CONTROL_shutdown");
    t.end();
  });

  t.end();
});
