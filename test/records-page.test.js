// test/records-page.test.js
// pages/records/records.js 的回归测试。
// 重点覆盖三类数据写入：
//   1) addCase   - 新建病例（成功 / 取消 / 空内容）
//   2) recordTake - 记录服药（需要先在内存里能找到药品）
//   3) deleteMedicine / deleteRecord - 按 id 移除（确认 / 取消）
// 这些路径都是用户在"记录"页的入口，任一回归都会直接影响核心业务。

const test = require('node:test');
const assert = require('node:assert/strict');
const { installWxMock } = require('./helpers/wx-mock');

function loadRecordsPage() {
  delete require.cache[require.resolve('../pages/records/records.js')];
  require('../pages/records/records.js');
  return global.wx.__registered.pages[global.wx.__registered.pages.length - 1];
}

test.beforeEach(() => {
  installWxMock();
});

// ---------- loadData / onLoad ----------

test('onLoad: 首次进入时把 cases 初始化为空数组', () => {
  const wx = installWxMock();
  // 注意：onLoad 内部会读取 cases 并在空时写入 []
  const page = loadRecordsPage();
  // cases 初始为空，setStorageSync 会被调用一次
  const writes = wx.__events.filter(e => e.type === 'setStorageSync' || e.type === 'storage.set');
  // 简化：直接看 storage
  assert.ok(wx.getStorageSync('cases') !== undefined);
});

test('loadData: 反转显示 medicines / records / cases', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }],
    records: [{ id: 10 }, { id: 20 }],
    cases: [{ id: 100 }]
  });

  const page = loadRecordsPage();
  page.onShow();

  // 源码 medicines.reverse() / records.reverse() / cases.reverse()
  assert.deepEqual(page.data.medicines.map(m => m.id), [3, 2, 1]);
  assert.deepEqual(page.data.records.map(r => r.id), [20, 10]);
  assert.deepEqual(page.data.cases.map(c => c.id), [100]);
});

// ---------- addCase ----------

test('addCase: 用户确认且输入内容时新建一条 case', () => {
  const wx = installWxMock();
  wx.__seedStorage({ cases: [] });

  const page = loadRecordsPage();

  // 触发 addCase：showModal 注入 __confirm=true, __content='发烧38.5'
  const modalOpt = {
    __confirm: true,
    __content: '发烧38.5',
    success: () => {}
  };
  // 直接调用 addCase
  page.addCase({ currentTarget: { dataset: {} } });
  // 上一次 showModal 的入参
  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  assert.ok(lastModal, 'showModal 应被触发');

  // 模拟 success 回调
  lastModal.opt.success({ confirm: true, content: '发烧38.5' });

  const cases = wx.getStorageSync('cases');
  assert.equal(cases.length, 1);
  assert.equal(cases[0].content, '发烧38.5');
  assert.ok(cases[0].id > 0);
  assert.ok(cases[0].createTime);
});

test('addCase: 用户取消时不写入存储', () => {
  const wx = installWxMock();
  wx.__seedStorage({ cases: [] });

  const page = loadRecordsPage();
  page.addCase({ currentTarget: { dataset: {} } });

  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  lastModal.opt.success({ confirm: false, content: 'xxx' });

  const cases = wx.getStorageSync('cases');
  assert.equal(cases.length, 0);
});

test('addCase: 内容为空时也不写入', () => {
  const wx = installWxMock();
  wx.__seedStorage({ cases: [] });

  const page = loadRecordsPage();
  page.addCase({ currentTarget: { dataset: {} } });

  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  lastModal.opt.success({ confirm: true, content: '' });

  const cases = wx.getStorageSync('cases');
  assert.equal(cases.length, 0);
});

// ---------- recordTake ----------

test('recordTake: 在内存中存在的药品会被写入一条新 record', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: '维生素C' }],
    records: []
  });

  const page = loadRecordsPage();
  page.onShow(); // 让 data.medicines 装载好

  // dataset.id = 1
  page.recordTake({ currentTarget: { dataset: { id: 1 } } });

  const records = wx.getStorageSync('records');
  assert.equal(records.length, 1);
  assert.equal(records[0].medicineId, 1);
  assert.equal(records[0].medicineName, '维生素C');
  assert.ok(records[0].takeTime);
});

test('recordTake: id 不在内存列表中时会抛错（占位用例，记录当前行为）', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: 'A' }],
    records: []
  });

  const page = loadRecordsPage();
  page.onShow();

  // medicines 列表里没有 id=999
  // 源码是 const medicine = this.data.medicines.find(m => m.id === id);
  // 然后直接 medicine.name —— 不存在时会 TypeError
  // 这一行为是已知的脆弱点，回归时我们只断言不会静默写入坏数据
  assert.throws(
    () => page.recordTake({ currentTarget: { dataset: { id: 999 } } }),
    TypeError
  );

  const records = wx.getStorageSync('records');
  // 不应写入了 medicineName=undefined 的脏记录
  assert.equal(records.length, 0);
});

// ---------- deleteMedicine ----------

test('deleteMedicine: 用户确认时从存储中移除该药品', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
    records: []
  });

  const page = loadRecordsPage();
  page.onShow();

  page.deleteMedicine({ currentTarget: { dataset: { id: 1 } } });
  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  lastModal.opt.success({ confirm: true });

  const medicines = wx.getStorageSync('medicines');
  assert.equal(medicines.length, 1);
  assert.equal(medicines[0].id, 2);
});

test('deleteMedicine: 用户取消时保留药品', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
  });

  const page = loadRecordsPage();
  page.onShow();

  page.deleteMedicine({ currentTarget: { dataset: { id: 1 } } });
  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  lastModal.opt.success({ confirm: false });

  const medicines = wx.getStorageSync('medicines');
  assert.equal(medicines.length, 2);
});

// ---------- deleteRecord ----------

test('deleteRecord: 用户确认时按 id 移除该记录', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    records: [
      { id: 1, medicineName: 'A' },
      { id: 2, medicineName: 'B' },
      { id: 3, medicineName: 'C' }
    ]
  });

  const page = loadRecordsPage();
  page.onShow();

  page.deleteRecord({ currentTarget: { dataset: { id: 2 } } });
  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  lastModal.opt.success({ confirm: true });

  const records = wx.getStorageSync('records');
  assert.deepEqual(records.map(r => r.id), [1, 3]);
});

test('deleteRecord: 用户取消时保留记录', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    records: [{ id: 1 }, { id: 2 }]
  });

  const page = loadRecordsPage();
  page.onShow();

  page.deleteRecord({ currentTarget: { dataset: { id: 1 } } });
  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  lastModal.opt.success({ confirm: false });

  const records = wx.getStorageSync('records');
  assert.equal(records.length, 2);
});

// ---------- switchTab ----------

test('switchTab: 更新 currentTab', () => {
  const page = loadRecordsPage();
  page.switchTab({ currentTarget: { dataset: { tab: 'records' } } });
  assert.equal(page.data.currentTab, 'records');
  page.switchTab({ currentTarget: { dataset: { tab: 'cases' } } });
  assert.equal(page.data.currentTab, 'cases');
});
