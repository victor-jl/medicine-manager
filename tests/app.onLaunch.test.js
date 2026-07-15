// Tests for app.js → onLaunch
// onLaunch initializes three storage keys (medicines, records, cases)
// to empty arrays when they are missing. This guards against a
// regression where, for example, the records initialization is dropped
// during a refactor — without that line, downstream reads in
// pages/records would store `''` instead of `[]`.

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWx, resetWx } = require('./helpers/wx-mock');
const { installPage, getPage } = require('./helpers/page-mock');

function loadAppFresh(storageData = {}) {
  installWx({ storage: storageData });
  delete require.cache[require.resolve('../app')];
  const captured = installPage();
  require('../app');
  return { config: captured[0], storageImpl: globalThis.wx.getStorageSync ? null : null };
}

function loadApp(storageData = {}) {
  const { storageImpl } = installWx({ storage: storageData });
  delete require.cache[require.resolve('../app')];
  const captured = installPage();
  require('../app');
  return { config: captured[0], storageImpl };
}

test('onLaunch: writes [] for all three keys when storage is empty', () => {
  const { config, storageImpl } = loadApp({});
  config.onLaunch();
  const dump = storageImpl._dump();
  assert.deepEqual(dump.medicines, []);
  assert.deepEqual(dump.records, []);
  assert.deepEqual(dump.cases, []);
});

test('onLaunch: does NOT overwrite existing non-empty values', () => {
  const { config, storageImpl } = loadApp({
    medicines: [{ id: 1, name: 'A' }],
    records: [{ id: 1, medicineName: 'A' }],
    cases: [{ id: 1, content: 'x' }]
  });
  config.onLaunch();
  const dump = storageImpl._dump();
  assert.equal(dump.medicines.length, 1);
  assert.equal(dump.records.length, 1);
  assert.equal(dump.cases.length, 1);
  assert.equal(dump.medicines[0].name, 'A');
});

test('onLaunch: only writes for the missing/empty keys', () => {
  // medicines is already populated; the other two should be
  // initialized but medicines must be left alone.
  const { config, storageImpl } = loadApp({
    medicines: [{ id: 1, name: 'A' }]
  });
  config.onLaunch();
  const dump = storageImpl._dump();
  assert.equal(dump.medicines.length, 1);
  assert.deepEqual(dump.records, []);
  assert.deepEqual(dump.cases, []);
});

test('onLaunch: also initializes keys whose value is the empty string', () => {
  // wx.getStorageSync returns '' for missing keys. The current code
  // treats both '' and missing as "not present" because both
  // are falsy, so '' also triggers initialization to [].
  const { config, storageImpl } = loadApp({
    medicines: '',
    records: '',
    cases: ''
  });
  config.onLaunch();
  const dump = storageImpl._dump();
  assert.deepEqual(dump.medicines, []);
  assert.deepEqual(dump.records, []);
  assert.deepEqual(dump.cases, []);
});

test.afterEach(() => {
  resetWx();
  delete require.cache[require.resolve('../app')];
});
