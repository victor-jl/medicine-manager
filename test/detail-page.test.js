// test/detail-page.test.js
// pages/detail/detail.js 的回归测试。
// 重点覆盖：
//   1) onLoad  根据 id 找到药品，并反序展示 records
//   2) recordTake  在详情页里写记录
//   3) deleteMedicine  删除当前药品（确认 / 取消）

const test = require('node:test');
const assert = require('node:assert/strict');
const { installWxMock } = require('./helpers/wx-mock');

function loadDetailPage() {
  delete require.cache[require.resolve('../pages/detail/detail.js')];
  require('../pages/detail/detail.js');
  return global.wx.__registered.pages[global.wx.__registered.pages.length - 1];
}

test.beforeEach(() => {
  installWxMock();
});

test('onLoad: 找不到对应 id 时不修改 data', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: 'A' }],
    records: []
  });

  const page = loadDetailPage();
  page.onLoad({ id: '999' });

  assert.equal(page.data.medicine, null);
  assert.deepEqual(page.data.records, []);
});

test('onLoad: 找到药品时设置 medicine 和反序的 records', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: 'A', expiryDate: '2025-01-01' }],
    records: [
      { id: 10, medicineId: 1, takeTime: 'a' },
      { id: 11, medicineId: 1, takeTime: 'b' },
      { id: 20, medicineId: 2, takeTime: 'c' } // 其它药品的记录应被过滤掉
    ]
  });

  const page = loadDetailPage();
  page.onLoad({ id: '1' });

  assert.equal(page.data.medicine.id, 1);
  // 源码: records.filter(r => r.medicineId === id); records.reverse()
  assert.deepEqual(page.data.records.map(r => r.id), [11, 10]);
});

test('recordTake: 在详情页写入服药记录并更新页面状态', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: '维生素C' }],
    records: [{ id: 10, medicineId: 1, takeTime: 'old' }]
  });

  const page = loadDetailPage();
  page.onLoad({ id: '1' });
  // 清理 events 以便后续断言
  wx.__events.length = 0;

  page.recordTake();

  const records = wx.getStorageSync('records');
  // 新记录被 push
  assert.equal(records.length, 2);
  assert.equal(records[1].medicineId, 1);
  assert.equal(records[1].medicineName, '维生素C');
  // 页面 records 也更新，且新记录排在最前
  assert.equal(page.data.records[0].medicineName, '维生素C');
  assert.equal(page.data.records.length, 2);
  // 提示
  const toasts = wx.__events.filter(e => e.type === 'toast');
  assert.ok(toasts.length > 0);
  assert.equal(toasts[0].opt.title, '记录成功');
});

test('deleteMedicine: 用户确认时从存储移除并延迟返回上一页', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
    records: []
  });

  const page = loadDetailPage();
  page.onLoad({ id: '1' });
  wx.__events.length = 0;

  page.deleteMedicine();
  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  lastModal.opt.success({ confirm: true });

  const medicines = wx.getStorageSync('medicines');
  assert.deepEqual(medicines.map(m => m.id), [2]);
  // toast 提示
  const toasts = wx.__events.filter(e => e.type === 'toast');
  assert.ok(toasts.some(t => t.opt.title === '删除成功'));
});

test('deleteMedicine: 用户取消时不删除', () => {
  const wx = installWxMock();
  wx.__seedStorage({
    medicines: [{ id: 1, name: 'A' }],
    records: []
  });

  const page = loadDetailPage();
  page.onLoad({ id: '1' });
  wx.__events.length = 0;

  page.deleteMedicine();
  const lastModal = [...wx.__events].reverse().find(e => e.type === 'modal');
  lastModal.opt.success({ confirm: false });

  const medicines = wx.getStorageSync('medicines');
  assert.equal(medicines.length, 1);
});
