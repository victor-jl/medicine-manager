// tests/index-page.test.js
// 覆盖 pages/index/index.js 中 loadData 的两个核心过滤：
//   1) 30 天内即将过期的药品窗口
//   2) 今日服药记录的 toDateString 比较
// 两者均涉及日期算术与边界条件，是首页展示正确性的关键路径。
// 通过在 require 之前注入 wx / Page 桩来让 Page 模块可在 Node 下加载。

const test = require('node:test');
const assert = require('node:assert/strict');

// 共享桩：每个用例独立一份 storage；为避免跨用例干扰，每次 require 前重置
function installStubs(initialStorage) {
  const storage = Object.assign({ medicines: [], records: [] }, initialStorage);
  global.wx = {
    getStorageSync(key) {
      return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : '';
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    showToast() {},
    showLoading() {},
    hideLoading() {},
    navigateTo() {},
    switchTab() {}
  };
  let pageConfig = null;
  global.Page = (config) => {
    pageConfig = config;
  };
  global.App = () => {};
  global.getApp = () => ({});
  global.getCurrentPages = () => [];

  // 清理模块缓存，让最新 stubs 生效
  delete require.cache[require.resolve('../pages/index/index.js')];
  require('../pages/index/index.js');

  if (!pageConfig) {
    throw new Error('Page 配置未被注册，请检查 stubs 是否正确注入');
  }

  // 构造一个最小可用的 page 实例（带 setData）
  const instance = Object.create(pageConfig);
  instance.data = JSON.parse(JSON.stringify(pageConfig.data));
  instance.setData = function (patch) {
    Object.assign(this.data, patch);
  };

  return { instance, storage };
}

function isoDaysFromNow(deltaDays) {
  const d = new Date();
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().substring(0, 10);
}

test('loadData: 空存储下三个列表均为空', () => {
  const { instance } = installStubs({ medicines: [], records: [] });
  instance.loadData();
  assert.deepEqual(instance.data.medicines, []);
  assert.deepEqual(instance.data.expiringMedicines, []);
  assert.deepEqual(instance.data.todayRecords, []);
});

test('loadData: 已过期的药品不会进入 30 天过期窗口', () => {
  const { instance, storage } = installStubs({});
  storage.medicines = [
    { id: 1, name: '已过期', expiryDate: isoDaysFromNow(-5) }
  ];
  instance.loadData();
  assert.deepEqual(instance.data.expiringMedicines, []);
});

test('loadData: 10 天后过期的药品会进入 30 天过期窗口', () => {
  const { instance, storage } = installStubs({});
  storage.medicines = [
    { id: 1, name: '10天后过期', expiryDate: isoDaysFromNow(10) }
  ];
  instance.loadData();
  assert.equal(instance.data.expiringMedicines.length, 1);
  assert.equal(instance.data.expiringMedicines[0].name, '10天后过期');
});

test('loadData: 31 天后过期的药品不会进入 30 天过期窗口', () => {
  const { instance, storage } = installStubs({});
  storage.medicines = [
    { id: 1, name: '31天后过期', expiryDate: isoDaysFromNow(31) }
  ];
  instance.loadData();
  assert.equal(instance.data.expiringMedicines.length, 0);
});

test('loadData: 缺失 expiryDate 字段的药品被排除', () => {
  const { instance, storage } = installStubs({});
  storage.medicines = [
    { id: 1, name: '无有效期' },
    { id: 2, name: '10天后过期', expiryDate: isoDaysFromNow(10) }
  ];
  instance.loadData();
  assert.equal(instance.data.expiringMedicines.length, 1);
  assert.equal(instance.data.expiringMedicines[0].name, '10天后过期');
});

test('loadData: 30 天过期窗口包含首尾边界（30 天整）', () => {
  const { instance, storage } = installStubs({});
  storage.medicines = [
    { id: 1, name: '临界30天', expiryDate: isoDaysFromNow(30) }
  ];
  instance.loadData();
  // 30 天整应被纳入（<= thirtyDaysLater 的边界包含等号）
  assert.equal(instance.data.expiringMedicines.length, 1);
});

test('loadData: 药品列表被截断为前 5 条', () => {
  const { instance, storage } = installStubs({});
  storage.medicines = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `药品${i + 1}`
  }));
  instance.loadData();
  assert.equal(instance.data.medicines.length, 5);
  assert.equal(instance.data.medicines[0].name, '药品1');
  assert.equal(instance.data.medicines[4].name, '药品5');
});

test('loadData: 今日服药记录会出现在 todayRecords', () => {
  const { instance, storage } = installStubs({});
  const now = new Date().toLocaleString();
  storage.records = [
    { id: 1, medicineId: 1, medicineName: '今日', takeTime: now }
  ];
  instance.loadData();
  assert.equal(instance.data.todayRecords.length, 1);
  assert.equal(instance.data.todayRecords[0].medicineName, '今日');
});

test('loadData: 昨日服药记录不会出现在 todayRecords', () => {
  const { instance, storage } = installStubs({});
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString();
  storage.records = [
    { id: 1, medicineId: 1, medicineName: '昨日', takeTime: yesterday }
  ];
  instance.loadData();
  assert.equal(instance.data.todayRecords.length, 0);
});

test('loadData: 多条记录中只保留今天那一条', () => {
  const { instance, storage } = installStubs({});
  const today = new Date().toLocaleString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString();
  const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleString();
  storage.records = [
    { id: 1, medicineName: '今日A', takeTime: today },
    { id: 2, medicineName: '昨日', takeTime: yesterday },
    { id: 3, medicineName: '未来', takeTime: future }
  ];
  instance.loadData();
  assert.equal(instance.data.todayRecords.length, 1);
  assert.equal(instance.data.todayRecords[0].medicineName, '今日A');
});

test('loadData: takeTime 为非法日期时不会进入今日记录', () => {
  const { instance, storage } = installStubs({});
  storage.records = [
    { id: 1, medicineName: '坏数据', takeTime: 'not-a-date' },
    { id: 2, medicineName: '今日', takeTime: new Date().toLocaleString() }
  ];
  instance.loadData();
  // 'not-a-date' 解析为 Invalid Date，toDateString 返回 'Invalid Date'，不匹配今天
  assert.equal(instance.data.todayRecords.length, 1);
  assert.equal(instance.data.todayRecords[0].medicineName, '今日');
});
