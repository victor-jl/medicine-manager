// tests/helpers/date-mock.js
// Freeze the clock so date-arithmetic in loadData is deterministic.

function withFixedDate(isoString, fn) {
  const RealDate = global.Date;
  const fixedMs = new RealDate(isoString).getTime();

  class MockDate extends RealDate {
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

  global.Date = MockDate;
  try {
    return fn();
  } finally {
    global.Date = RealDate;
  }
}

module.exports = { withFixedDate };
