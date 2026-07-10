'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

/**
 * Test the WeChat Mini Program page logic by injecting a minimal `wx` and
 * `Page` shim into the global scope, then `require()`-ing the page module
 * with a fresh cache entry each test.
 *
 * Why this matters:
 *   pages/index/index.js :: loadData() runs business-critical date math
 *   (expiring-medicine window, "today's records" filter). The boundaries
 *   here (exactly 30 days away, already-expired, missing expiryDate) are
 *   easy to break in a refactor and previously had zero coverage.
 */

// Fixed "now" anchor: any stable date works; we only care about relative
// offsets and locale-stable comparisons.
const ANCHOR = new Date('2026-06-15T10:00:00Z').getTime();

function dayOffset(days) {
  return new Date(ANCHOR + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Build an isolated environment, load the page module fresh, run `body`
 * with the page object, and restore the environment.
 *
 * The body runs while `Date` is still pinned to ANCHOR so that any
 * `new Date()` inside page methods produces deterministic values.
 */
function withFreshPage(storage, body) {
  // Wipe the cached page so `Page({...})` runs again with the new shim.
  const pageKey = path.resolve(__dirname, '..', 'pages', 'index', 'index.js');
  delete require.cache[pageKey];

  // Pin Date to a fixed instant so the page's `new Date()` is deterministic.
  const RealDate = globalThis.Date;
  class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(ANCHOR);
      else super(...args);
    }
    static now() { return ANCHOR; }
  }
  globalThis.Date = FixedDate;

  const storage_ = { ...storage };
  let pageObj;
  globalThis.wx = {
    getStorageSync(key) {
      return Object.prototype.hasOwnProperty.call(storage_, key) ? storage_[key] : '';
    },
    setStorageSync(key, value) { storage_[key] = value; },
    navigateTo() {}, switchTab() {}, showToast() {},
    showLoading() {}, hideLoading() {}, showModal() {}, chooseMedia() {}
  };
  globalThis.Page = (cfg) => {
    pageObj = Object.assign({ data: {}, setData(u) { Object.assign(this.data, u); } }, cfg);
    return pageObj;
  };
  globalThis.App = () => {};
  globalThis.getApp = () => ({ globalData: {} });

  try {
    require(pageKey);
  } catch (e) {
    globalThis.Date = RealDate;
    throw e;
  }
  // Run the test body while Date is still pinned, then restore.
  let result;
  try {
    result = body(pageObj);
  } finally {
    globalThis.Date = RealDate;
  }
  return result;
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

test('index.loadData: medicines without expiryDate are excluded from the expiring list', () => {
  withFreshPage({
    medicines: [
      { id: 1, name: 'NoDate', expiryDate: '' },
      { id: 2, name: 'NoField' /* no expiryDate */ }
    ],
    records: []
  }, (page) => {
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 0, 'medicines missing expiryDate must be filtered out');
  });
});

test('index.loadData: already-expired medicines are excluded from the expiring list', () => {
  withFreshPage({
    medicines: [
      { id: 1, name: 'Yesterday', expiryDate: dayOffset(-1) },
      { id: 2, name: 'LastMonth', expiryDate: dayOffset(-30) }
    ],
    records: []
  }, (page) => {
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 0, 'past-expiry medicines must not appear as "expiring"');
  });
});

test('index.loadData: medicines expiring within 30 days are included', () => {
  withFreshPage({
    medicines: [
      { id: 1, name: 'InOneDay', expiryDate: dayOffset(1) },
      { id: 2, name: 'InFifteen', expiryDate: dayOffset(15) },
      { id: 3, name: 'InTwentyNine', expiryDate: dayOffset(29) }
    ],
    records: []
  }, (page) => {
    page.loadData();
    const names = page.data.expiringMedicines.map(m => m.name);
    assert.deepEqual(names.sort(), ['InFifteen', 'InOneDay', 'InTwentyNine']);
  });
});

test('index.loadData: a medicine expiring exactly 30 days from now is included (boundary)', () => {
  withFreshPage({
    medicines: [
      { id: 1, name: 'Boundary30', expiryDate: dayOffset(30) }
    ],
    records: []
  }, (page) => {
    page.loadData();
    // The predicate is `expiry <= thirtyDaysLater && expiry >= now`.
    // At offset=30 the upper bound is exactly thirtyDaysLater, so it must
    // be included. This pins the off-by-one risk in `+30 * 24h * 60 * 60 * 1000`.
    assert.equal(page.data.expiringMedicines.length, 1);
    assert.equal(page.data.expiringMedicines[0].name, 'Boundary30');
  });
});

test('index.loadData: a medicine expiring more than 30 days out is excluded', () => {
  withFreshPage({
    medicines: [
      { id: 1, name: 'Future', expiryDate: dayOffset(31) },
      { id: 2, name: 'WayFuture', expiryDate: dayOffset(365) }
    ],
    records: []
  }, (page) => {
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 0);
  });
});

test('index.loadData: a medicine expiring "now" is included (lower-boundary)', () => {
  // expiry at "now" (offset 0) must still be considered "expiring" because
  // the predicate is `expiry >= now`.
  withFreshPage({
    medicines: [
      { id: 1, name: 'ExpiringNow', expiryDate: dayOffset(0) }
    ],
    records: []
  }, (page) => {
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 1);
    assert.equal(page.data.expiringMedicines[0].name, 'ExpiringNow');
  });
});

test('index.loadData: medicines list is truncated to the first five entries', () => {
  const medicines = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Med${i + 1}`,
    expiryDate: dayOffset(100) // far in the future, not "expiring"
  }));
  withFreshPage({ medicines, records: [] }, (page) => {
    page.loadData();
    assert.equal(page.data.medicines.length, 5, 'home page should show at most 5 medicines');
    assert.deepEqual(page.data.medicines.map(m => m.name), ['Med1', 'Med2', 'Med3', 'Med4', 'Med5']);
  });
});

test('index.loadData: only records whose takeTime falls on "today" are returned', () => {
  withFreshPage({
    medicines: [],
    records: [
      { id: 1, medicineId: 1, medicineName: 'X', takeTime: new Date(ANCHOR).toISOString() }, // today
      { id: 2, medicineId: 1, medicineName: 'X', takeTime: dayOffset(-1) }, // yesterday
      { id: 3, medicineId: 1, medicineName: 'X', takeTime: dayOffset(1) }  // tomorrow
    ]
  }, (page) => {
    page.loadData();
    assert.equal(page.data.todayRecords.length, 1);
    assert.equal(page.data.todayRecords[0].id, 1);
  });
});

test('index.loadData: missing medicines/records storage entries are tolerated', () => {
  // The page calls `wx.getStorageSync('medicines') || []` defensively, but
  // we still want to verify the page does not throw on cold start.
  withFreshPage({}, (page) => {
    assert.doesNotThrow(() => page.loadData());
    assert.deepEqual(page.data.expiringMedicines, []);
    assert.deepEqual(page.data.todayRecords, []);
    assert.deepEqual(page.data.medicines, []);
  });
});

test('index.loadData: records with invalid takeTime are excluded from today', () => {
  withFreshPage({
    medicines: [],
    records: [
      { id: 1, medicineId: 1, medicineName: 'X', takeTime: 'not a date' },
      { id: 2, medicineId: 1, medicineName: 'X', takeTime: '' }
    ]
  }, (page) => {
    page.loadData();
    // Both records produce `Invalid Date`; `toDateString()` of an Invalid
    // Date is 'Invalid Date', which never equals a real today's string.
    assert.equal(page.data.todayRecords.length, 0);
  });
});
