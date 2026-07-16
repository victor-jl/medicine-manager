// tests/pages/index.test.js
// Tests for pages/index/index.js::loadData
// Focus: 30-day expiry window boundary conditions and today-record filter.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWxMock, installPageCapture } = require('../helpers/wx-mock');
const { withFixedTime } = require('../helpers/fake-time');

// Re-require the page module fresh for each subtest so module-level state
// (e.g. cached Page config) does not leak between cases.
function loadIndexPage(wxMock) {
  // Clear require cache for the page so it re-evaluates under the new wx.
  delete require.cache[require.resolve('../../pages/index/index.js')];
  global.wx = wxMock;
  const capture = installPageCapture();
  require('../../pages/index/index.js');
  return capture.buildInstance();
}

function isoDaysFromNow(days) {
  const base = new Date('2026-01-15T08:00:00Z');
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString();
}

test('loadData: shows medicines expiring within 30 days as expiring', () => {
  const wx = installWxMock({
    medicines: [
      { id: 1, name: 'A', expiryDate: isoDaysFromNow(15) },
      { id: 2, name: 'B', expiryDate: isoDaysFromNow(29) }
    ],
    records: []
  });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 2);
    assert.deepEqual(
      page.data.expiringMedicines.map((m) => m.id).sort(),
      [1, 2]
    );
  } finally {
    restore();
  }
});

test('loadData: a medicine expiring exactly today is included', () => {
  const wx = installWxMock({
    medicines: [{ id: 1, name: 'A', expiryDate: '2026-01-15T08:00:00Z' }],
    records: []
  });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 1);
  } finally {
    restore();
  }
});

test('loadData: a medicine expiring exactly 30 days from now is included', () => {
  const wx = installWxMock({
    medicines: [{ id: 1, name: 'A', expiryDate: isoDaysFromNow(30) }],
    records: []
  });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    // expiryDate is 30 days out; comparison is <= 30 days later, so this is
    // on the boundary and must be included.
    assert.equal(page.data.expiringMedicines.length, 1);
  } finally {
    restore();
  }
});

test('loadData: a medicine expiring 31 days from now is excluded', () => {
  const wx = installWxMock({
    medicines: [{ id: 1, name: 'A', expiryDate: isoDaysFromNow(31) }],
    records: []
  });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 0);
  } finally {
    restore();
  }
});

test('loadData: an already-expired medicine is excluded from expiring list', () => {
  const wx = installWxMock({
    medicines: [{ id: 1, name: 'A', expiryDate: isoDaysFromNow(-1) }],
    records: []
  });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 0);
  } finally {
    restore();
  }
});

test('loadData: medicines with no expiryDate are excluded from expiring list', () => {
  const wx = installWxMock({
    medicines: [
      { id: 1, name: 'A', expiryDate: '' },
      { id: 2, name: 'B' /* undefined expiryDate */ }
    ],
    records: []
  });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 0);
  } finally {
    restore();
  }
});

test('loadData: a medicine with an unparseable expiryDate is excluded', () => {
  // 'not-a-date' -> new Date(...) -> Invalid Date -> comparisons return false.
  const wx = installWxMock({
    medicines: [{ id: 1, name: 'A', expiryDate: 'not-a-date' }],
    records: []
  });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    assert.equal(page.data.expiringMedicines.length, 0);
  } finally {
    restore();
  }
});

test('loadData: only records taken today appear in todayRecords', () => {
  const wx = installWxMock({
    medicines: [],
    records: [
      { id: 1, medicineId: 1, medicineName: 'A', takeTime: '2026-01-15T07:00:00Z' },
      { id: 2, medicineId: 1, medicineName: 'A', takeTime: '2026-01-15T23:30:00Z' },
      { id: 3, medicineId: 1, medicineName: 'A', takeTime: '2026-01-14T23:30:00Z' },
      { id: 4, medicineId: 1, medicineName: 'A', takeTime: '2026-01-16T00:30:00Z' }
    ]
  });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    assert.equal(page.data.todayRecords.length, 2);
    const ids = page.data.todayRecords.map((r) => r.id).sort();
    assert.deepEqual(ids, [1, 2]);
  } finally {
    restore();
  }
});

test('loadData: medicines list is capped at the first 5 entries', () => {
  const meds = [];
  for (let i = 0; i < 12; i++) {
    meds.push({ id: i, name: `M${i}`, expiryDate: isoDaysFromNow(100) });
  }
  const wx = installWxMock({ medicines: meds, records: [] });
  const restore = withFixedTime('2026-01-15T08:00:00Z');
  try {
    const page = loadIndexPage(wx);
    page.loadData();
    assert.equal(page.data.medicines.length, 5);
    // Page uses slice(0, 5) — original order is preserved.
    assert.deepEqual(
      page.data.medicines.map((m) => m.id),
      [0, 1, 2, 3, 4]
    );
  } finally {
    restore();
  }
});
