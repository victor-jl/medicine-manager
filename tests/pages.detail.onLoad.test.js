// Tests for pages/detail/detail.js → onLoad
// Verifies that the detail page correctly resolves a medicine by its
// id (parsed from the query string) and filters records to that
// medicine. Also covers the "no match" branch where onLoad silently
// leaves the page empty.

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWx, resetWx } = require('./helpers/wx-mock');
const { installPage, makeContext } = require('./helpers/page-mock');

function loadPageFresh(storageData = {}) {
  installWx({ storage: storageData });
  delete require.cache[require.resolve('../pages/detail/detail')];
  const captured = installPage();
  require('../pages/detail/detail');
  return { config: captured[0] };
}

test('onLoad: sets medicine and filtered records for a valid id', () => {
  const { config } = loadPageFresh({
    medicines: [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    ],
    records: [
      { id: 100, medicineId: 1, medicineName: 'A', takeTime: 'first' },
      { id: 101, medicineId: 2, medicineName: 'B', takeTime: 'second' },
      { id: 102, medicineId: 1, medicineName: 'A', takeTime: 'third' }
    ]
  });
  const ctx = makeContext(config.data);
  config.onLoad.call(ctx, { id: '1' });
  assert.equal(ctx.data.medicine.name, 'A');
  // Two records belong to medicine id=1; they're reversed so the
  // "third" (later) record comes first.
  assert.deepEqual(
    ctx.data.records.map(r => r.takeTime),
    ['third', 'first']
  );
});

test('onLoad: parses string id via parseInt', () => {
  const { config } = loadPageFresh({
    medicines: [{ id: 42, name: 'forty-two' }],
    records: []
  });
  const ctx = makeContext(config.data);
  config.onLoad.call(ctx, { id: '42' });
  assert.equal(ctx.data.medicine.name, 'forty-two');
});

test('onLoad: missing medicine leaves page empty (no setData call)', () => {
  const { config } = loadPageFresh({
    medicines: [{ id: 1, name: 'A' }],
    records: []
  });
  const ctx = makeContext(config.data);
  // Stub setData to detect accidental writes.
  let setDataCalled = false;
  ctx.setData = () => { setDataCalled = true; };
  config.onLoad.call(ctx, { id: '999' });
  assert.equal(ctx.data.medicine, null);
  assert.equal(setDataCalled, false, 'onLoad should not setData on a miss');
});

test('onLoad: records are filtered strictly by medicineId equality', () => {
  // Edge case: a record with medicineId == '1' (string) should not match
  // an integer id of 1, because === is strict. This documents the
  // current behavior so any future change to the comparison is a
  // deliberate one.
  const { config } = loadPageFresh({
    medicines: [{ id: 1, name: 'A' }],
    records: [
      { id: 1, medicineId: '1', medicineName: 'string-id', takeTime: 'a' },
      { id: 2, medicineId: 1, medicineName: 'number-id', takeTime: 'b' }
    ]
  });
  const ctx = makeContext(config.data);
  config.onLoad.call(ctx, { id: '1' });
  assert.equal(ctx.data.records.length, 1);
  assert.equal(ctx.data.records[0].medicineName, 'number-id');
});

test.afterEach(() => {
  resetWx();
  delete require.cache[require.resolve('../pages/detail/detail')];
});
