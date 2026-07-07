// Tests for the 30-day expiry filter inside pages/index/index.js.
//
// `loadData()` decides which medicines appear under "即将过期" on the
// home screen. The filter is a simple `expiry <= thirtyDaysLater &&
// expiry >= now` check, but it has several boundary cases that are
// easy to get wrong (off-by-one on the 30-day cut-off, missing
// expiryDate, already-expired medicines, unparseable dates). This
// file pins those cases down with dates computed relative to "now"
// so the tests stay deterministic across timezones.

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadPage } = require('./helpers');

const DAY = 24 * 60 * 60 * 1000;

/** ISO timestamp `offset` milliseconds from now. */
function isoOffset(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString();
}

/** ISO date-only string `offset` milliseconds from now (YYYY-MM-DD). */
function dateOffset(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString().slice(0, 10);
}

function setup() {
  const { page, fakeWx } = loadPage('../pages/index/index.js');
  return { page, fakeWx };
}

test('expiry filter: empty storage yields no expiring medicines', () => {
  const { page } = setup();
  page.loadData();
  assert.deepEqual(page.data.expiringMedicines, []);
});

test('expiry filter: medicines without expiryDate are excluded', () => {
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: '阿莫西林' },                         // no expiryDate
    { id: 2, name: '布洛芬', expiryDate: '' },           // empty string
  ];
  page.loadData();
  assert.equal(page.data.expiringMedicines.length, 0);
});

test('expiry filter: medicine that expired yesterday is excluded', () => {
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: '过期药', expiryDate: isoOffset(-1 * DAY) },
  ];
  page.loadData();
  assert.equal(page.data.expiringMedicines.length, 0,
    'already-expired medicine must not appear under 即将过期');
});

test('expiry filter: medicine expiring today is included', () => {
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: '今日到期', expiryDate: isoOffset(0) },
  ];
  page.loadData();
  assert.equal(page.data.expiringMedicines.length, 1);
  assert.equal(page.data.expiringMedicines[0].id, 1);
});

test('expiry filter: medicine expiring in 1 day is included', () => {
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: '明天到期', expiryDate: isoOffset(1 * DAY) },
  ];
  page.loadData();
  assert.equal(page.data.expiringMedicines.length, 1);
});

test('expiry filter: medicine expiring in 29 days is included', () => {
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: '29天后到期', expiryDate: isoOffset(29 * DAY) },
  ];
  page.loadData();
  assert.equal(page.data.expiringMedicines.length, 1);
});

test('expiry filter: medicine expiring in exactly 30 days is included (boundary)', () => {
  // The filter is `expiry <= thirtyDaysLater && expiry >= now`, so
  // an expiry equal to the 30-day mark must be included.
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: '30天到期', expiryDate: isoOffset(30 * DAY) },
  ];
  page.loadData();
  assert.equal(page.data.expiringMedicines.length, 1,
    '30-day boundary must be inclusive');
});

test('expiry filter: medicine expiring in 31 days is excluded', () => {
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: '31天后到期', expiryDate: isoOffset(31 * DAY) },
  ];
  page.loadData();
  assert.equal(page.data.expiringMedicines.length, 0);
});

test('expiry filter: medicine with unparseable expiryDate is excluded', () => {
  // `new Date('not a date')` yields Invalid Date. Comparisons with
  // Invalid Date return false, so the medicine must drop out.
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: '损坏日期', expiryDate: 'not-a-date' },
  ];
  page.loadData();
  assert.equal(page.data.expiringMedicines.length, 0);
});

test('expiry filter: mixed list keeps only those in the [now, now+30d] window', () => {
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = [
    { id: 1, name: 'A-过去',   expiryDate: isoOffset(-2 * DAY) },
    { id: 2, name: 'B-今天',   expiryDate: isoOffset(0) },
    { id: 3, name: 'C-15天',   expiryDate: isoOffset(15 * DAY) },
    { id: 4, name: 'D-30天',   expiryDate: isoOffset(30 * DAY) },
    { id: 5, name: 'E-31天',   expiryDate: isoOffset(31 * DAY) },
    { id: 6, name: 'F-无日期' },
    { id: 7, name: 'G-100天',  expiryDate: isoOffset(100 * DAY) },
  ];
  page.loadData();

  const ids = page.data.expiringMedicines.map(m => m.id).sort();
  assert.deepEqual(ids, [2, 3, 4],
    'only B (today), C (15d), D (30d) should be in the window');
});

test('loadData caps medicines list at 5 items', () => {
  const { page, fakeWx } = setup();
  fakeWx.storage.medicines = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `药${i + 1}`,
    expiryDate: isoOffset(60 * DAY), // outside the expiring window
  }));
  page.loadData();
  assert.equal(page.data.medicines.length, 5);
  assert.equal(page.data.medicines[0].id, 1);
  assert.equal(page.data.medicines[4].id, 5);
});

test('todayRecords includes only records with takeTime on today\'s date', () => {
  const { page, fakeWx } = setup();
  const todayIso = new Date().toISOString();
  fakeWx.storage.records = [
    { id: 1, takeTime: todayIso },
    { id: 2, takeTime: isoOffset(-1 * DAY) },     // yesterday
    { id: 3, takeTime: isoOffset(1 * DAY) },      // tomorrow
  ];
  page.loadData();
  assert.equal(page.data.todayRecords.length, 1);
  assert.equal(page.data.todayRecords[0].id, 1);
});

test('loadData with completely empty storage leaves all collections empty', () => {
  // No `medicines` or `records` keys at all -> the `|| []` fallback
  // must kick in. Regression guard for the storage init in app.js.
  const { page, fakeWx } = setup();
  assert.equal(fakeWx.storage.medicines, undefined);
  assert.equal(fakeWx.storage.records, undefined);
  page.loadData();
  assert.deepEqual(page.data.medicines, []);
  assert.deepEqual(page.data.expiringMedicines, []);
  assert.deepEqual(page.data.todayRecords, []);
});
