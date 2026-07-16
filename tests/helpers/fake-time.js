// tests/helpers/fake-time.js
// Controlled "now" for tests that depend on real-time-based logic.
// Use with:   const restore = withFixedTime('2026-01-15T08:00:00Z');

'use strict';

function withFixedTime(isoString) {
  const RealDate = global.Date;
  const fixedMs = new RealDate(isoString).getTime();

  class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(fixedMs);
      } else {
        super(...args);
      }
    }
    static now() {
      return fixedMs;
    }
    static parse(s) {
      return RealDate.parse(s);
    }
    static UTC(...args) {
      return RealDate.UTC(...args);
    }
  }

  global.Date = FixedDate;
  return () => {
    global.Date = RealDate;
  };
}

module.exports = { withFixedTime };
