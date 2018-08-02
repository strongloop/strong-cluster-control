// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-cluster-control
// This file is licensed under the Artistic License 2.0.
// License text available at https://opensource.org/licenses/Artistic-2.0

var _ = require("lodash");
var controlGenerator = require("../index");
var masterGenerator = require("../lib/master");
var tap = require("tap");

var master = masterGenerator();
var control = controlGenerator();

tap.test("require", function(t) {
  t.test("should expose master", function(t) {
    t.equal(control.start, master.start);
    t.equal(control.stop, master.stop);
    t.equal(control.ADDR, master.ADDR);
    t.end();
  });

  t.test("should set the master process startTime", function(t) {
    t.assert(_.isFinite(master.startTime));
    t.end();
  });

  t.end();
});
