// Tests for pages/index/index.js → loadData
// Validates the "expiring within 30 days" filter and the
// "today's records" filter. Boundary conditions (expired, exactly
// 30 days out, missing expiry) are the regression hot spots.

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWx, resetWx, makeStorage } = require('./helpers/wx-mock');
const { installPage, makeContext } = require('./helpers/page-mock');

function loadPage(storageData = {}) {
  // Each test re-installs wx + Page, then requires the page module
  // so the captured config is the one returned by the most recent
  // Page() call.
  installWx({ storage: storageData });
  delete require.cache[require.resolve('../pages/index/index')];
  const captured = installPage();
  require('../pages/index/index');
  resetWx();
  return { config: captured[0], storageImpl: globalThis.wx.getStorageSync ? null : null };
}

function loadPageFresh(storageData = {}) {
  const { storageImpl } = installWx({ storage: storageData });
  delete require.cache[require.resolve('../pages/index/index')];
  const captured = installPage();
  require('../pages/index/index');
  return { config: captured[0], storageImpl };
}

function dayOffset(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDay(d) {
  // YYYY-MM-DD in local time — what the WXML date picker produces.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

test('loadData: empty storage yields empty arrays', () => {
  const { config } = loadPageFresh({});
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.deepEqual(ctx.data.medicines, []);
  assert.deepEqual(ctx.data.expiringMedicines, []);
  assert.deepEqual(ctx.data.todayRecords, []);
});

test('loadData: medicine expiring within 30 days is included', () => {
  const { config } = loadPageFresh({
    medicines: [
      { id: 1, name: 'A', expiryDate: isoDay(dayOffset(5)) },
      { id: 2, name: 'B', expiryDate: isoDay(dayOffset(15)) },
      { id: 3, name: 'C', expiryDate: isoDay(dayOffset(29)) }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.expiringMedicines.length, 3);
});

test('loadData: medicine expired (in the past) is excluded', () => {
  const { config } = loadPageFresh({
    medicines: [
      { id: 1, name: 'ExpiredA', expiryDate: isoDay(dayOffset(-1)) },
      { id: 2, name: 'ExpiredB', expiryDate: isoDay(dayOffset(-30)) }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.expiringMedicines.length, 0);
});

test('loadData: medicine expiring more than 30 days out is excluded', () => {
  const { config } = loadPageFresh({
    medicines: [
      { id: 1, name: 'Future', expiryDate: isoDay(dayOffset(31)) },
      { id: 2, name: 'FarFuture', expiryDate: isoDay(dayOffset(365)) }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.expiringMedicines.length, 0);
});

test('loadData: medicine without expiryDate is excluded', () => {
  const { config } = loadPageFresh({
    medicines: [
      { id: 1, name: 'NoExpiry' /* no expiryDate */ }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.expiringMedicines.length, 0);
});

test('loadData: medicine with invalid expiryDate string is excluded', () => {
  // new Date('not-a-date') returns Invalid Date. Date comparisons with
  // NaN are always false in both directions, so the filter rejects it.
  // This verifies we do not accidentally throw on bad data.
  const { config } = loadPageFresh({
    medicines: [
      { id: 1, name: 'Bad', expiryDate: 'not-a-date' }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.expiringMedicines.length, 0);
});

test('loadData: medicines are sliced to the first 5 for the home list', () => {
  const { config } = loadPageFresh({
    medicines: Array.from({ length: 8 }, (_, i) => ({
      id: i,
      name: `med-${i}`
    }))
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.medicines.length, 5);
});

test('loadData: today record is included in todayRecords', () => {
  const { config } = loadPageFresh({
    records: [
      { id: 1, medicineId: 1, medicineName: 'A', takeTime: new Date().toLocaleString() }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.todayRecords.length, 1);
});

test('loadData: yesterday record is excluded from todayRecords', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const { config } = loadPageFresh({
    records: [
      { id: 1, medicineName: 'A', takeTime: yesterday.toLocaleString() }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.todayRecords.length, 0);
});

test('loadData: mixed expiry statuses pick only the in-window items', () => {
  const { config } = loadPageFresh({
    medicines: [
      { id: 1, name: 'expired', expiryDate: isoDay(dayOffset(-1)) },
      { id: 2, name: 'soon', expiryDate: isoDay(dayOffset(7)) },
      { id: 3, name: 'far', expiryDate: isoDay(dayOffset(90)) },
      { id: 4, name: 'noDate' },
      { id: 5, name: 'edge30', expiryDate: isoDay(dayOffset(30)) }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  const names = ctx.data.expiringMedicines.map(m => m.name).sort();
  assert.deepEqual(names, ['edge30', 'soon']);
});

test.afterEach(() => {
  resetWx();
  delete require.cache[require.resolve('../pages/index/index')];
});
