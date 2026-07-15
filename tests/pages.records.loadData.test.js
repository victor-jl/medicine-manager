// Tests for pages/records/records.js → loadData
// The page reverses medicines / records / cases when displaying them
// and reads three storage keys. These tests guard against off-by-one
// reordering and missing-key fallbacks.

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWx, resetWx } = require('./helpers/wx-mock');
const { installPage, makeContext } = require('./helpers/page-mock');

function loadPageFresh(storageData = {}) {
  installWx({ storage: storageData });
  delete require.cache[require.resolve('../pages/records/records')];
  const captured = installPage();
  require('../pages/records/records');
  return { config: captured[0] };
}

test('loadData: empty storage yields three empty lists', () => {
  const { config } = loadPageFresh({});
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.deepEqual(ctx.data.medicines, []);
  assert.deepEqual(ctx.data.records, []);
  assert.deepEqual(ctx.data.cases, []);
});

test('loadData: medicines are reversed to newest-first', () => {
  const { config } = loadPageFresh({
    medicines: [
      { id: 1, name: 'oldest' },
      { id: 2, name: 'middle' },
      { id: 3, name: 'newest' }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.deepEqual(
    ctx.data.medicines.map(m => m.name),
    ['newest', 'middle', 'oldest']
  );
});

test('loadData: records are reversed to newest-first', () => {
  const { config } = loadPageFresh({
    records: [
      { id: 1, medicineName: 'r-oldest' },
      { id: 2, medicineName: 'r-middle' },
      { id: 3, medicineName: 'r-newest' }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.deepEqual(
    ctx.data.records.map(r => r.medicineName),
    ['r-newest', 'r-middle', 'r-oldest']
  );
});

test('loadData: cases are reversed to newest-first', () => {
  const { config } = loadPageFresh({
    cases: [
      { id: 1, content: 'c-oldest' },
      { id: 2, content: 'c-newest' }
    ]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.deepEqual(
    ctx.data.cases.map(c => c.content),
    ['c-newest', 'c-oldest']
  );
});

test('loadData: handles only some keys present (other keys are missing)', () => {
  // Only `medicines` is populated. The other two reads should fall back
  // to []. After reverse(), [] is still [].
  const { config } = loadPageFresh({
    medicines: [{ id: 1, name: 'only' }]
  });
  const ctx = makeContext(config.data);
  config.loadData.call(ctx);
  assert.equal(ctx.data.medicines.length, 1);
  assert.equal(ctx.data.records.length, 0);
  assert.equal(ctx.data.cases.length, 0);
});

test.afterEach(() => {
  resetWx();
  delete require.cache[require.resolve('../pages/records/records')];
});
