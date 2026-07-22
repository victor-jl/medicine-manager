// tests/pages/records.test.js
// Unit tests for pages/records/records.js — storage initialization,
// reverse-order display of medicines/records/cases, and the modal-driven
// delete/append paths.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { wx, setStorage, getStorage } = require('../helpers/wx-stub');
const { capturePage, makePageContext } = require('../helpers/load-page');

global.wx = wx;
const pageOptions = capturePage(path.resolve(__dirname, '../../pages/records/records.js'));

function buildContext() {
  return makePageContext(pageOptions, {
    currentTab: 'medicines',
    medicines: [],
    records: [],
    cases: []
  });
}

test('onLoad seeds empty cases array when storage has no cases key', () => {
  setStorage({});
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx);
  assert.deepEqual(getStorage().cases, []);
});

test('onLoad does not overwrite an existing non-empty cases array', () => {
  const existing = [{ id: 1, content: 'prior case' }];
  setStorage({ cases: existing });
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx);
  assert.deepEqual(getStorage().cases, existing);
});

test('loadData reverses medicines so the most recent appears first', () => {
  setStorage({
    medicines: [
      { id: 1, name: 'First' },
      { id: 2, name: 'Second' },
      { id: 3, name: 'Third' }
    ],
    records: [],
    cases: []
  });
  const ctx = buildContext();
  pageOptions.onShow.call(ctx);
  assert.deepEqual(ctx.data.medicines.map(m => m.id), [3, 2, 1]);
});

test('loadData reverses records so the latest take-time is first', () => {
  setStorage({
    medicines: [],
    records: [
      { id: 10, takeTime: '2026-01-01' },
      { id: 11, takeTime: '2026-02-01' },
      { id: 12, takeTime: '2026-03-01' }
    ],
    cases: []
  });
  const ctx = buildContext();
  pageOptions.onShow.call(ctx);
  assert.deepEqual(ctx.data.records.map(r => r.id), [12, 11, 10]);
});

test('loadData reverses cases (most recent first)', () => {
  setStorage({
    medicines: [],
    records: [],
    cases: [
      { id: 100, content: 'A' },
      { id: 101, content: 'B' }
    ]
  });
  const ctx = buildContext();
  pageOptions.onShow.call(ctx);
  assert.deepEqual(ctx.data.cases.map(c => c.id), [101, 100]);
});

test('loadData falls back to empty arrays when storage is empty', () => {
  setStorage({});
  const ctx = buildContext();
  pageOptions.onShow.call(ctx);
  assert.deepEqual(ctx.data.medicines, []);
  assert.deepEqual(ctx.data.records, []);
  assert.deepEqual(ctx.data.cases, []);
});

test('switchTab updates currentTab from dataset', () => {
  const ctx = buildContext();
  pageOptions.switchTab.call(ctx, { currentTarget: { dataset: { tab: 'records' } } });
  assert.equal(ctx.data.currentTab, 'records');
});

test('deleteMedicine removes only the targeted id and persists after modal confirm', () => {
  setStorage({
    medicines: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    ],
    records: [],
    cases: []
  });
  const ctx = buildContext();
  pageOptions.onShow.call(ctx);
  // Override showModal to auto-confirm, then call deleteMedicine.
  const origModal = wx.showModal;
  wx.showModal = ({ success }) => success({ confirm: true });
  try {
    pageOptions.deleteMedicine.call(ctx, { currentTarget: { dataset: { id: 2 } } });
  } finally {
    wx.showModal = origModal;
  }
  const stored = getStorage().medicines;
  assert.equal(stored.length, 2);
  assert.deepEqual(stored.map(m => m.id), [1, 3]);
});

test('deleteMedicine does NOT remove anything when modal is cancelled', () => {
  setStorage({
    medicines: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
    records: [],
    cases: []
  });
  const ctx = buildContext();
  const origModal = wx.showModal;
  wx.showModal = ({ success }) => success({ confirm: false });
  try {
    pageOptions.deleteMedicine.call(ctx, { currentTarget: { dataset: { id: 2 } } });
  } finally {
    wx.showModal = origModal;
  }
  assert.equal(getStorage().medicines.length, 2);
});

test('deleteRecord removes only the targeted record and persists', () => {
  setStorage({
    medicines: [],
    records: [
      { id: 1, medicineId: 1, takeTime: 'x' },
      { id: 2, medicineId: 1, takeTime: 'y' }
    ],
    cases: []
  });
  const ctx = buildContext();
  const origModal = wx.showModal;
  wx.showModal = ({ success }) => success({ confirm: true });
  try {
    pageOptions.deleteRecord.call(ctx, { currentTarget: { dataset: { id: 1 } } });
  } finally {
    wx.showModal = origModal;
  }
  const records = getStorage().records;
  assert.equal(records.length, 1);
  assert.equal(records[0].id, 2);
});

test('recordTake appends a record tied to the medicine id and name', () => {
  setStorage({
    medicines: [{ id: 7, name: 'Aspirin' }],
    records: [],
    cases: []
  });
  const ctx = buildContext();
  pageOptions.onShow.call(ctx);
  pageOptions.recordTake.call(ctx, { currentTarget: { dataset: { id: 7 } } });
  const records = getStorage().records;
  assert.equal(records.length, 1);
  assert.equal(records[0].medicineId, 7);
  assert.equal(records[0].medicineName, 'Aspirin');
  assert.ok(records[0].takeTime, 'takeTime should be set');
});

test('addCase persists the modal-edited case into storage', () => {
  setStorage({ medicines: [], records: [], cases: [] });
  const ctx = buildContext();
  const origModal = wx.showModal;
  wx.showModal = ({ success }) => success({ confirm: true, content: 'fever and cough' });
  try {
    pageOptions.addCase.call(ctx);
  } finally {
    wx.showModal = origModal;
  }
  const cases = getStorage().cases;
  assert.equal(cases.length, 1);
  assert.equal(cases[0].content, 'fever and cough');
  assert.ok(cases[0].id > 0);
  assert.ok(cases[0].createTime);
});

test('addCase does NOT persist when user cancels the modal', () => {
  setStorage({ medicines: [], records: [], cases: [] });
  const ctx = buildContext();
  const origModal = wx.showModal;
  wx.showModal = ({ success }) => success({ confirm: false, content: 'ignored' });
  try {
    pageOptions.addCase.call(ctx);
  } finally {
    wx.showModal = origModal;
  }
  assert.equal(getStorage().cases.length, 0);
});

test('addCase does NOT persist an empty modal content', () => {
  setStorage({ medicines: [], records: [], cases: [] });
  const ctx = buildContext();
  const origModal = wx.showModal;
  wx.showModal = ({ success }) => success({ confirm: true, content: '' });
  try {
    pageOptions.addCase.call(ctx);
  } finally {
    wx.showModal = origModal;
  }
  assert.equal(getStorage().cases.length, 0);
});

test('goToDetail navigates to detail with the id from dataset', () => {
  let navUrl = null;
  const origNav = wx.navigateTo;
  wx.navigateTo = ({ url }) => { navUrl = url; };
  try {
    const ctx = buildContext();
    pageOptions.goToDetail.call(ctx, { currentTarget: { dataset: { id: 42 } } });
  } finally {
    wx.navigateTo = origNav;
  }
  assert.equal(navUrl, '/pages/detail/detail?id=42');
});
