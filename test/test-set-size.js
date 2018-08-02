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

tap.test("set size", function(t) {
  t.test("should set in options when changed", function(t) {
    master.start({ size: 0 });
    t.equal(master.options.size, 0);
    t.equal(master.size, 0);
    t.equal(master.status().master.setSize, 0);
    master.setSize(1);
    t.equal(master.options.size, 1);
    t.equal(master.size, 1);
    t.equal(master.status().master.setSize, 1);
    t.end();
  });

  t.test("should emit when set", function(t) {
    master.start({ size: 0 });
    master.setSize(0);
    master.once("setSize", function(size) {
      t.equal(size, 0);
      t.end();
    });
  });

  t.end();
});
