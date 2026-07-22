// tests/app.test.js
// Unit tests for app.js — verifies the three storage keys are
// initialized to empty arrays without clobbering existing data.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { wx, setStorage, getStorage } = require('./helpers/wx-stub');
const { captureApp } = require('./helpers/load-page');

global.wx = wx;
const appOptions = captureApp(path.resolve(__dirname, '../app.js'));

test('onLaunch seeds empty arrays for medicines/records/cases when storage is empty', () => {
  setStorage({});
  appOptions.onLaunch();
  assert.deepEqual(getStorage().medicines, []);
  assert.deepEqual(getStorage().records, []);
  assert.deepEqual(getStorage().cases, []);
});

test('onLaunch does not overwrite existing medicines', () => {
  const existing = [{ id: 1, name: 'Aspirin' }];
  setStorage({ medicines: existing, records: [], cases: [] });
  appOptions.onLaunch();
  assert.deepEqual(getStorage().medicines, existing);
});

test('onLaunch does not overwrite existing records', () => {
  const existing = [{ id: 1, medicineId: 1, takeTime: 'x' }];
  setStorage({ medicines: [], records: existing, cases: [] });
  appOptions.onLaunch();
  assert.deepEqual(getStorage().records, existing);
});

test('onLaunch does not overwrite existing cases', () => {
  const existing = [{ id: 1, content: 'case 1' }];
  setStorage({ medicines: [], records: [], cases: existing });
  appOptions.onLaunch();
  assert.deepEqual(getStorage().cases, existing);
});

test('globalData is exposed with default userInfo: null', () => {
  assert.ok(appOptions.globalData);
  assert.equal(appOptions.globalData.userInfo, null);
});
