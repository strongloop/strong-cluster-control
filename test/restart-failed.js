// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

"use strict";

var _ = require("lodash");
var debug = require("debug")("strong-cluster-control:test");
var cluster = require("cluster");
var controlGenerator = require("../");

var SIZE = global.SIZE;

if (cluster.isWorker) {
  if (cluster.worker.id > SIZE) process.exit(3);
  return;
}

var tap = require("tap");
var control = controlGenerator();

tap.test("good workers are not killed", function(t) {
  var ended;

  control.start({ size: SIZE });

  control.once("resize", function() {
    debug("reached size, restart");
    control.restart();
  });

  cluster.on("exit", function(w) {
    if (ended) return;

    debug("w %d died: alive %d", w.id, _.size(cluster.workers));

    if (_.size(cluster.workers) < SIZE) {
      t.fail("good workers died");
      end();
    } else if (w.id > SIZE + 3) {
      t.pass("good workers survived");
      end();
    }
  });

  function end() {
    if (!ended) {
      control.stop();
      t.end();
    }
    ended = true;
  }
});
