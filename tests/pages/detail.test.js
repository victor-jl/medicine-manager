// tests/pages/detail.test.js
// Tests for pages/detail/detail.js — ID lookup, record association, delete.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWxMock, installPageCapture } = require('../helpers/wx-mock');

function loadDetailPage(wxMock) {
  delete require.cache[require.resolve('../../pages/detail/detail.js')];
  global.wx = wxMock;
  const capture = installPageCapture();
  require('../../pages/detail/detail.js');
  return capture.buildInstance();
}

test('onLoad: resolves the medicine by id', () => {
  const wx = installWxMock({
    medicines: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    ],
    records: []
  });
  const page = loadDetailPage(wx);
  page.onLoad({ id: '2' });
  assert.equal(page.data.medicine.id, 2);
  assert.equal(page.data.medicine.name, 'B');
});

test('onLoad: filters records by medicineId and shows newest first', () => {
  const wx = installWxMock({
    medicines: [{ id: 7, name: 'X' }],
    records: [
      { id: 100, medicineId: 7, takeTime: '2026-01-01T00:00:00Z' },
      { id: 101, medicineId: 9, takeTime: '2026-01-02T00:00:00Z' },
      { id: 102, medicineId: 7, takeTime: '2026-01-03T00:00:00Z' },
      { id: 103, medicineId: 7, takeTime: '2026-01-04T00:00:00Z' }
    ]
  });
  const page = loadDetailPage(wx);
  page.onLoad({ id: '7' });
  assert.equal(page.data.records.length, 3);
  // Implementation does .reverse() on the filtered array.
  assert.deepEqual(
    page.data.records.map((r) => r.id),
    [103, 102, 100]
  );
});

test('onLoad: unknown id leaves medicine as null', () => {
  const wx = installWxMock({
    medicines: [{ id: 1, name: 'A' }],
    records: []
  });
  const page = loadDetailPage(wx);
  page.onLoad({ id: '999' });
  assert.equal(page.data.medicine, null);
});

test('recordTake: appends a new record and updates the view', () => {
  const wx = installWxMock({
    medicines: [{ id: 5, name: 'Aspirin' }],
    records: [{ id: 1, medicineId: 5, medicineName: 'Aspirin', takeTime: '2026-01-01T00:00:00Z' }]
  });
  const page = loadDetailPage(wx);
  page.onLoad({ id: '5' });
  assert.equal(page.data.records.length, 1);

  // Pin Date.now() to a deterministic value for the new record id.
  const RealDate = global.Date;
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super('2026-02-01T00:00:00Z');
      } else {
        super(...args);
      }
    }
    static now() {
      return new RealDate('2026-02-01T00:00:00Z').getTime();
    }
  };
  try {
    page.recordTake();
  } finally {
    global.Date = RealDate;
  }

  // Storage now contains the original + the new record.
  const stored = wx.getStorageSync('records');
  assert.equal(stored.length, 2);
  assert.equal(stored[1].medicineId, 5);
  assert.equal(stored[1].medicineName, 'Aspirin');

  // Page data prepends the new record (newest-first).
  assert.equal(page.data.records.length, 2);
  assert.equal(page.data.records[0].medicineName, 'Aspirin');
  assert.equal(wx.__shown.toast.at(-1).title, '记录成功');
});

test('deleteMedicine: confirms and removes the medicine from storage', () => {
  const wx = installWxMock({
    medicines: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' }
    ],
    records: []
  });
  // Force confirm = true on the modal.
  wx.__pushModalResponse(() => ({ confirm: true }));

  // Fire the post-confirm setTimeout synchronously so the deferred
  // wx.navigateBack() is observable before the test exits.
  const realSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };
  try {
    const page = loadDetailPage(wx);
    page.onLoad({ id: '1' });
    page.deleteMedicine();
    // Storage now has only id 2.
    const meds = wx.getStorageSync('medicines');
    assert.equal(meds.length, 1);
    assert.equal(meds[0].id, 2);
    assert.equal(wx.__shown.toast.at(-1).title, '删除成功');
    assert.equal(wx.__navigations.at(-1).type, 'navigateBack');
  } finally {
    global.setTimeout = realSetTimeout;
  }
});

test('deleteMedicine: cancels on modal dismissal and keeps the medicine', () => {
  const wx = installWxMock({
    medicines: [{ id: 1, name: 'A' }],
    records: []
  });
  // confirm = false -> user cancelled.
  wx.__pushModalResponse(() => ({ confirm: false }));

  const page = loadDetailPage(wx);
  page.onLoad({ id: '1' });
  page.deleteMedicine();
  const meds = wx.getStorageSync('medicines');
  assert.equal(meds.length, 1);
  assert.equal(meds[0].id, 1);
  // No "删除成功" toast should have been shown.
  const titles = wx.__shown.toast.map((t) => t.title);
  assert.ok(!titles.includes('删除成功'), `unexpected toast: ${titles.join(',')}`);
});
