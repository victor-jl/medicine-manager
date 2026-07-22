// tests/pages/index.test.js
// Unit tests for the business-critical 30-day expiry filter and
// today-records filter in pages/index/index.js#loadData.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { wx, setStorage } = require('../helpers/wx-stub');
const { capturePage, makePageContext } = require('../helpers/load-page');
const { withFixedDate } = require('../helpers/date-mock');

// Inject wx BEFORE requiring the page module so its module-level
// Page() call doesn't crash on undefined globals.
global.wx = wx;

const pageOptions = capturePage(path.resolve(__dirname, '../../pages/index/index.js'));

function buildContext() {
  return makePageContext(pageOptions, {
    medicines: [],
    expiringMedicines: [],
    todayRecords: []
  });
}

function isoDaysFromNow(nowIso, offsetDays) {
  // offsetDays can be negative (past) or positive (future).
  const base = new Date(nowIso);
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString();
}

test('loadData returns empty arrays when storage is empty', () => {
  withFixedDate('2026-07-22T12:00:00Z', () => {
    setStorage({});
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.deepEqual(ctx.data.medicines, []);
    assert.deepEqual(ctx.data.expiringMedicines, []);
    assert.deepEqual(ctx.data.todayRecords, []);
  });
});

test('loadData excludes medicines whose expiryDate is missing', () => {
  withFixedDate('2026-07-22T12:00:00Z', () => {
    setStorage({
      medicines: [
        { id: 1, name: 'NoDate' },
        { id: 2, name: 'HasDate', expiryDate: isoDaysFromNow('2026-07-22T12:00:00Z', 5) }
      ],
      records: []
    });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.equal(ctx.data.expiringMedicines.length, 1);
    assert.equal(ctx.data.expiringMedicines[0].id, 2);
  });
});

test('loadData includes medicines expiring exactly 30 days from now (boundary)', () => {
  withFixedDate('2026-07-22T12:00:00Z', () => {
    setStorage({
      medicines: [
        { id: 30, name: 'Edge30', expiryDate: isoDaysFromNow('2026-07-22T12:00:00Z', 30) }
      ],
      records: []
    });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.equal(ctx.data.expiringMedicines.length, 1, '30-day edge should be included (<=)');
    assert.equal(ctx.data.expiringMedicines[0].id, 30);
  });
});

test('loadData excludes medicines expiring 31+ days from now', () => {
  withFixedDate('2026-07-22T12:00:00Z', () => {
    setStorage({
      medicines: [
        { id: 31, name: 'Edge31', expiryDate: isoDaysFromNow('2026-07-22T12:00:00Z', 31) },
        { id: 100, name: 'FarFuture', expiryDate: isoDaysFromNow('2026-07-22T12:00:00Z', 100) }
      ],
      records: []
    });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.equal(ctx.data.expiringMedicines.length, 0);
  });
});

test('loadData excludes already-expired medicines (yesterday)', () => {
  withFixedDate('2026-07-22T12:00:00Z', () => {
    setStorage({
      medicines: [
        { id: -1, name: 'Yesterday', expiryDate: isoDaysFromNow('2026-07-22T12:00:00Z', -1) },
        { id: -30, name: 'LastMonth', expiryDate: isoDaysFromNow('2026-07-22T12:00:00Z', -30) }
      ],
      records: []
    });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.equal(ctx.data.expiringMedicines.length, 0);
  });
});

test('loadData includes a medicine expiring later today (lower boundary)', () => {
  withFixedDate('2026-07-22T12:00:00Z', () => {
    setStorage({
      medicines: [
        { id: 0, name: 'LaterToday', expiryDate: '2026-07-22T23:00:00Z' }
      ],
      records: []
    });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.equal(ctx.data.expiringMedicines.length, 1);
  });
});

test('loadData filters today records using toDateString equality', () => {
  withFixedDate('2026-07-22T15:00:00Z', () => {
    setStorage({
      medicines: [],
      records: [
        { id: 1, takeTime: '2026-07-22T08:00:00Z' },       // today
        { id: 2, takeTime: '2026-07-22T23:30:00Z' },       // today (later)
        { id: 3, takeTime: '2026-07-21T23:59:00Z' },       // yesterday
        { id: 4, takeTime: '2026-07-23T00:01:00Z' }        // tomorrow
      ]
    });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.equal(ctx.data.todayRecords.length, 2);
    const ids = ctx.data.todayRecords.map(r => r.id).sort();
    assert.deepEqual(ids, [1, 2]);
  });
});

test('loadData slices medicines to at most 5 entries for the home card', () => {
  withFixedDate('2026-07-22T12:00:00Z', () => {
    const medicines = [];
    for (let i = 0; i < 8; i++) {
      medicines.push({ id: i, name: 'M' + i });
    }
    setStorage({ medicines, records: [] });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.equal(ctx.data.medicines.length, 5);
    // Slice preserves original order; ids 0..4.
    assert.deepEqual(ctx.data.medicines.map(m => m.id), [0, 1, 2, 3, 4]);
  });
});

test('loadData treats missing records storage key as empty array', () => {
  withFixedDate('2026-07-22T12:00:00Z', () => {
    setStorage({ medicines: [{ id: 1, name: 'A', expiryDate: '2026-07-30T00:00:00Z' }] });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.deepEqual(ctx.data.todayRecords, []);
    assert.equal(ctx.data.expiringMedicines.length, 1);
  });
});

test('loadData treats medicines with invalid expiryDate string as not-expiring (NaN comparison)', () => {
  // new Date('not-a-date') returns Invalid Date; comparisons with <= and >=
  // both return false, so the filter excludes it. Pin this behavior.
  withFixedDate('2026-07-22T12:00:00Z', () => {
    setStorage({
      medicines: [
        { id: 1, name: 'Bad', expiryDate: 'not-a-date' },
        { id: 2, name: 'Good', expiryDate: '2026-07-25T00:00:00Z' }
      ],
      records: []
    });
    const ctx = buildContext();
    pageOptions.onShow.call(ctx);
    assert.equal(ctx.data.expiringMedicines.length, 1);
    assert.equal(ctx.data.expiringMedicines[0].id, 2);
  });
});
