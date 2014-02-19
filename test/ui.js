var assert = require('assert');
var ui = require('../lib/ui');

describe('UI', function() {
  describe('humanizeDuration', function() {
    var tests = [
      { given: 0, expect: '0s' },
      { given: 499, expect: '0s' },
      { given: 999, expect: '1s' },
      { given: 1000000, expect: '16m 40s' },
      { given: 10000000, expect: '2h 46m 40s' },
      { given: 100000000, expect: '1d 3h 46m 40s' },
      { given: 1000000000, expect: '11d 13h 46m 40s' },
      { given: 10000000000, expect: '115d 17h 46m 40s' },
    ];
    tests.forEach(function(t) {
      it('turns ' + t.given + 'ms into ' + t.expect, function() {
        assert.equal(ui.humanizeDuration(t.given), t.expect);
      });
    });
  });
});
