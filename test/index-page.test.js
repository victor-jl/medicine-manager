// test/index-page.test.js
// pages/index/index.js 的回归测试。
// 重点覆盖 loadData 中两个关键过滤：
//   1) 30 天内即将过期的药品
//   2) 今日服药记录
// 这两条规则决定了用户看到的"提醒"和"当日记录"是否准确，是产品稳定性的关键路径。

const test = require('node:test');
const assert = require('node:assert/strict');
const { installWxMock } = require('./helpers/wx-mock');

function loadIndexPage() {
  delete require.cache[require.resolve('../pages/index/index.js')];
  require('../pages/index/index.js');
  return global.wx.__registered.pages[global.wx.__registered.pages.length - 1];
}

test.beforeEach(() => {
  installWxMock();
});

// 工具：把 ISO 日期偏移 N 天后的 yyyy-mm-dd 字符串
function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // 复用小程序 picker 用的 yyyy-mm-dd 格式
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

test('loadData: 缺药品和记录时返回空数据', () => {
  const page = loadIndexPage();
  page.onShow();
  const data = page.data;
  assert.deepEqual(data.medicines, []);
  assert.deepEqual(data.expiringMedicines, []);
  assert.deepEqual(data.todayRecords, []);
});

test('loadData: 即将在 10 天后过期的药品会进入 expiringMedicines', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [
      { id: 1, name: '维生素C', expiryDate: dateOffset(10) },
      { id: 2, name: '钙片', expiryDate: dateOffset(60) }
    ],
    records: []
  });

  const page = loadIndexPage();
  page.onShow();

  assert.equal(page.data.expiringMedicines.length, 1);
  assert.equal(page.data.expiringMedicines[0].id, 1);
});

test('loadData: 30 天临界值（恰好 30 天）算作即将过期', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [
      { id: 1, name: 'A', expiryDate: dateOffset(30) }
    ],
    records: []
  });

  const page = loadIndexPage();
  page.onShow();

  // 30 天后 <= 30 天后成立 => 包含在即将过期列表
  assert.equal(page.data.expiringMedicines.length, 1);
});

test('loadData: 31 天后才过期不会被算作即将过期', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [
      { id: 1, name: 'A', expiryDate: dateOffset(31) }
    ],
    records: []
  });

  const page = loadIndexPage();
  page.onShow();

  assert.equal(page.data.expiringMedicines.length, 0);
});

test('loadData: 已过期的药品不会出现在"即将过期"列表', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [
      { id: 1, name: '已过期', expiryDate: dateOffset(-1) }
    ],
    records: []
  });

  const page = loadIndexPage();
  page.onShow();

  assert.equal(page.data.expiringMedicines.length, 0);
});

test('loadData: 没有 expiryDate 的药品不会被算作即将过期', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [
      { id: 1, name: '无日期', expiryDate: '' },
      { id: 2, name: 'null日期', expiryDate: null },
      { id: 3, name: 'undefined日期', expiryDate: undefined }
    ],
    records: []
  });

  const page = loadIndexPage();
  page.onShow();

  assert.equal(page.data.expiringMedicines.length, 0);
});

test('loadData: 药品列表截断到前 5 条（最新 5 条会先出现）', () => {
  const wx = installWxMock();
  const meds = [];
  for (let i = 0; i < 10; i++) {
    meds.push({ id: i, name: 'med-' + i, expiryDate: dateOffset(60) });
  }
  wx.__seedStorage({ medicines: meds, records: [] });

  const page = loadIndexPage();
  page.onShow();

  // 按源码 medicines.slice(0, 5) 直接取前 5 条
  assert.equal(page.data.medicines.length, 5);
  assert.equal(page.data.medicines[0].id, 0);
  assert.equal(page.data.medicines[4].id, 4);
});

test('loadData: 今日服药记录会被筛选出来', () => {
  const wx = installWxMock();
  const today = new Date();
  const todayStr = today.toLocaleString(); // 源码用 new Date().toLocaleString()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toLocaleString();

  wx.__seedStorage({
    medicines: [],
    records: [
      { id: 1, medicineId: 1, medicineName: 'A', takeTime: todayStr },
      { id: 2, medicineId: 1, medicineName: 'A', takeTime: yesterday }
    ]
  });

  const page = loadIndexPage();
  page.onShow();

  assert.equal(page.data.todayRecords.length, 1);
  assert.equal(page.data.todayRecords[0].id, 1);
});

test('loadData: 跨年的过期日仍按时间比较', () => {
  const wx = installWxMock();
  // 构造一个绝对时间：now + 5 天
  const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const y = future.getFullYear();
  const m = String(future.getMonth() + 1).padStart(2, '0');
  const d = String(future.getDate()).padStart(2, '0');
  const expiry = `${y}-${m}-${d}`;

  wx.__seedStorage({
    medicines: [{ id: 1, name: 'X', expiryDate: expiry }],
    records: []
  });

  const page = loadIndexPage();
  page.onShow();

  assert.equal(page.data.expiringMedicines.length, 1);
});

test('loadData: 多个即将过期的药品都包含进来', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [
      { id: 1, name: 'A', expiryDate: dateOffset(1) },
      { id: 2, name: 'B', expiryDate: dateOffset(15) },
      { id: 3, name: 'C', expiryDate: dateOffset(29) },
      { id: 4, name: 'D', expiryDate: dateOffset(100) } // 不应包含
    ],
    records: []
  });

  const page = loadIndexPage();
  page.onShow();

  assert.equal(page.data.expiringMedicines.length, 3);
  const ids = page.data.expiringMedicines.map(m => m.id);
  assert.deepEqual(ids.sort(), [1, 2, 3]);
});
