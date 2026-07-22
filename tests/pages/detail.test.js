// tests/pages/detail.test.js
// Unit tests for pages/detail/detail.js — id lookup, records
// filtering, and the local record append path.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { wx, setStorage, getStorage } = require('../helpers/wx-stub');
const { capturePage, makePageContext } = require('../helpers/load-page');

global.wx = wx;
const pageOptions = capturePage(path.resolve(__dirname, '../../pages/detail/detail.js'));

function buildContext(initial = {}) {
  return makePageContext(pageOptions, {
    medicine: null,
    records: [],
    ...initial
  });
}

test('onLoad sets medicine when a matching id is found', () => {
  setStorage({
    medicines: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' }
    ],
    records: []
  });
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx, { id: '2' });
  assert.ok(ctx.data.medicine);
  assert.equal(ctx.data.medicine.id, 2);
  assert.equal(ctx.data.medicine.name, 'B');
});

test('onLoad parses string id via parseInt (numeric coercion)', () => {
  setStorage({
    medicines: [{ id: 42, name: 'Aspirin' }],
    records: []
  });
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx, { id: '42' });
  assert.equal(ctx.data.medicine.id, 42);
});

test('onLoad leaves medicine null when no id matches', () => {
  setStorage({
    medicines: [{ id: 1, name: 'A' }],
    records: []
  });
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx, { id: '999' });
  assert.equal(ctx.data.medicine, null);
});

test('onLoad leaves medicine null when options.id is missing (parseInt -> NaN)', () => {
  setStorage({
    medicines: [{ id: 1, name: 'A' }],
    records: []
  });
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx, {});
  // No medicine has id === NaN, so medicine stays null.
  assert.equal(ctx.data.medicine, null);
});

test('onLoad filters records by medicineId and reverses them (latest first)', () => {
  setStorage({
    medicines: [{ id: 5, name: 'X' }],
    records: [
      { id: 100, medicineId: 5, takeTime: '2026-01-01' },
      { id: 101, medicineId: 9, takeTime: '2026-01-02' }, // different medicine
      { id: 102, medicineId: 5, takeTime: '2026-01-03' },
      { id: 103, medicineId: 5, takeTime: '2026-01-04' }
    ]
  });
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx, { id: '5' });
  assert.equal(ctx.data.records.length, 3);
  assert.deepEqual(ctx.data.records.map(r => r.id), [103, 102, 100]);
});

test('onLoad does not touch records when medicine is not found', () => {
  setStorage({
    medicines: [],
    records: [{ id: 1, medicineId: 1 }]
  });
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx, { id: '1' });
  // The early-return branch leaves both data fields untouched.
  assert.equal(ctx.data.medicine, null);
  assert.deepEqual(ctx.data.records, []);
});

test('recordTake prepends a new record to in-memory list and persists it', () => {
  setStorage({
    medicines: [{ id: 7, name: 'Aspirin' }],
    records: [
      { id: 1, medicineId: 7, takeTime: '2026-01-01', medicineName: 'Aspirin' }
    ]
  });
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx, { id: '7' });
  const before = ctx.data.records.length;
  pageOptions.recordTake.call(ctx);
  const stored = getStorage().records;
  assert.equal(stored.length, before + 1);
  assert.equal(stored[stored.length - 1].medicineId, 7);
  assert.equal(stored[stored.length - 1].medicineName, 'Aspirin');
  // The in-memory list is updated by prepending the new record.
  assert.equal(ctx.data.records.length, before + 1);
  assert.equal(ctx.data.records[0].medicineId, 7);
});
