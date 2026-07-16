// tests/pages/records.test.js
// Tests for pages/records/records.js — tab/CRUD business logic.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWxMock, installPageCapture } = require('../helpers/wx-mock');

function loadRecordsPage(wxMock) {
  delete require.cache[require.resolve('../../pages/records/records.js')];
  global.wx = wxMock;
  const capture = installPageCapture();
  require('../../pages/records/records.js');
  return capture.buildInstance();
}

test('onLoad: initialises the cases key when storage is empty', () => {
  const wx = installWxMock({});
  loadRecordsPage(wx);
  // The page calls onLoad() during page construction in WeChat; we mirror
  // that by invoking it manually after buildInstance().
  // Note: bindInstance does not call lifecycle; trigger it explicitly.
  // Re-instantiate to access onLoad via the same instance.
  // Simpler: re-require the page and call Page()'s onLoad directly.
  const capture = installPageCapture();
  delete require.cache[require.resolve('../../pages/records/records.js')];
  require('../../pages/records/records.js');
  const config = capture.getConfig();
  config.onLoad.call({ data: {} });
  assert.deepEqual(wx.getStorageSync('cases'), []);
});

test('loadData: lists medicines, records, and cases in reverse-insertion order', () => {
  const wx = installWxMock({
    medicines: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    ],
    records: [
      { id: 10, medicineId: 1 },
      { id: 11, medicineId: 2 }
    ],
    cases: [{ id: 100, content: 'case' }]
  });
  const page = loadRecordsPage(wx);
  page.loadData();
  assert.deepEqual(page.data.medicines.map((m) => m.id), [3, 2, 1]);
  assert.deepEqual(page.data.records.map((r) => r.id), [11, 10]);
  assert.deepEqual(page.data.cases.map((c) => c.id), [100]);
});

test('switchTab: updates the active tab', () => {
  const wx = installWxMock({});
  const page = loadRecordsPage(wx);
  page.switchTab({ currentTarget: { dataset: { tab: 'cases' } } });
  assert.equal(page.data.currentTab, 'cases');
});

test('addCase: appends a new case and reloads when the user confirms', () => {
  const wx = installWxMock({ cases: [] });
  wx.__pushModalResponse(() => ({ confirm: true, content: '咳嗽、发热两天' }));
  const page = loadRecordsPage(wx);
  page.addCase();
  const cases = wx.getStorageSync('cases');
  assert.equal(cases.length, 1);
  assert.equal(cases[0].content, '咳嗽、发热两天');
  // loadData is invoked, so page.data.cases reflects the new entry.
  assert.equal(page.data.cases.length, 1);
  assert.equal(wx.__shown.toast.at(-1).title, '添加成功');
});

test('addCase: does nothing when modal is cancelled or content is blank', () => {
  const wx = installWxMock({ cases: [] });
  wx.__pushModalResponse(() => ({ confirm: false, content: '' }));
  const page = loadRecordsPage(wx);
  page.addCase();
  assert.equal((wx.getStorageSync('cases') || []).length, 0);
  const titles = wx.__shown.toast.map((t) => t.title);
  assert.ok(!titles.includes('添加成功'), `unexpected toast: ${titles.join(',')}`);
});

test('deleteMedicine: removes only the medicine with the matching id', () => {
  const wx = installWxMock({
    medicines: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    ],
    records: []
  });
  wx.__pushModalResponse(() => ({ confirm: true }));
  const page = loadRecordsPage(wx);
  page.deleteMedicine({ currentTarget: { dataset: { id: 2 } } });
  const meds = wx.getStorageSync('medicines');
  // KNOWN BUG: loadData() calls .reverse() in place on the array returned by
  // getStorageSync(), so the storage layer ends up reversed. This test pins
  // current behavior so any fix to that bug is visible as a diff.
  assert.equal(meds.length, 2);
  assert.deepEqual(meds.map((m) => m.id), [3, 1]);
  // The on-page view is the same (also reversed).
  assert.deepEqual(page.data.medicines.map((m) => m.id), [3, 1]);
  assert.equal(wx.__shown.toast.at(-1).title, '删除成功');
});

test('deleteMedicine: keeps the list when the user cancels the modal', () => {
  const wx = installWxMock({ medicines: [{ id: 1, name: 'A' }], records: [] });
  wx.__pushModalResponse(() => ({ confirm: false }));
  const page = loadRecordsPage(wx);
  page.deleteMedicine({ currentTarget: { dataset: { id: 1 } } });
  assert.equal(wx.getStorageSync('medicines').length, 1);
});

test('deleteRecord: removes only the record with the matching id', () => {
  const wx = installWxMock({
    medicines: [],
    records: [
      { id: 10, medicineId: 1, medicineName: 'A' },
      { id: 11, medicineId: 2, medicineName: 'B' }
    ]
  });
  wx.__pushModalResponse(() => ({ confirm: true }));
  const page = loadRecordsPage(wx);
  page.deleteRecord({ currentTarget: { dataset: { id: 10 } } });
  const recs = wx.getStorageSync('records');
  assert.equal(recs.length, 1);
  assert.equal(recs[0].id, 11);
});

test('recordTake: appends a record referencing the existing medicine', () => {
  const wx = installWxMock({
    medicines: [{ id: 7, name: 'Aspirin' }],
    records: []
  });
  const RealDate = global.Date;
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) super('2026-02-01T00:00:00Z');
      else super(...args);
    }
    static now() {
      return new RealDate('2026-02-01T00:00:00Z').getTime();
    }
  };
  try {
    const page = loadRecordsPage(wx);
    // loadData first so this.data.medicines is populated (recordTake looks up
    // the medicine by id in page.data.medicines).
    page.loadData();
    page.recordTake({ currentTarget: { dataset: { id: 7 } } });
    const recs = wx.getStorageSync('records');
    assert.equal(recs.length, 1);
    assert.equal(recs[0].medicineId, 7);
    assert.equal(recs[0].medicineName, 'Aspirin');
    assert.equal(wx.__shown.toast.at(-1).title, '记录成功');
  } finally {
    global.Date = RealDate;
  }
});
