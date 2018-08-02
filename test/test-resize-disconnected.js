// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

"use strict";

var cluster = require("cluster");
var controlGenerator = require("../");
var debug = require("debug")("strong-cluster-control:test");
var fmt = require("util").format;

if (cluster.isWorker) {
  debug("worker starting");
  return;
}

var tap = require("tap");
var control = controlGenerator();

tap.test("resize disconnected", function(t) {
  control.start({ size: 1 });

  control.once("resize", function() {
    debug("reached size: ", summary());

    cluster.workers[1].disconnect();
    debug("disconnected:", summary());
    control.setSize(0);
    debug("resizing:", summary());
  });

  control.on("resize", function() {
    if (size() === 0) {
      return control.stop(t.end);
    }
  });

  function summary() {
    return Object.keys(cluster.workers)
      .map(function(id) {
        return fmt("%d:suicide=%j", id, cluster.workers[id].suicide);
      })
      .join(" ");
  }

  function size() {
    return Object.keys(cluster.workers).length;
  }
});
