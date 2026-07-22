// tests/pages/add.test.js
// Unit tests for pages/add/add.js#saveMedicine and #recordTake.
// Note: utils/ai.js is referenced by add.js but missing from the repo;
// we inject a stub via require.cache so the page module can load.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { wx, setStorage, getStorage } = require('../helpers/wx-stub');
const { capturePage, makePageContext } = require('../helpers/load-page');
const { installAiStub } = require('../helpers/ai-stub');

installAiStub();
global.wx = wx;
const pageOptions = capturePage(path.resolve(__dirname, '../../pages/add/add.js'));

function buildContext(overrides = {}) {
  return makePageContext(pageOptions, {
    name: '',
    expiryDate: '',
    description: '',
    specification: '',
    manufacturer: '',
    usage: '',
    approvalNumber: '',
    storage: '',
    ingredients: '',
    photos: [],
    isIdentifying: false,
    ...overrides
  });
}

test('saveMedicine refuses to save when name is empty (toast path)', () => {
  setStorage({ medicines: [] });
  const ctx = buildContext({ name: '' });
  // Capture toast calls via a spy on wx.showToast.
  let toast = null;
  const orig = wx.showToast;
  wx.showToast = (opts) => { toast = opts; };
  try {
    pageOptions.saveMedicine.call(ctx);
  } finally {
    wx.showToast = orig;
  }
  assert.ok(toast, 'expected a toast call');
  assert.equal(toast.title, '请输入药品名称');
  // No medicine should have been persisted.
  assert.equal((getStorage().medicines || []).length, 0);
});

test('saveMedicine persists a fully populated medicine object', () => {
  setStorage({ medicines: [] });
  const ctx = buildContext({
    name: '阿莫西林胶囊',
    expiryDate: '2027-01-31',
    description: 'desc',
    specification: '0.25g*24粒',
    manufacturer: '测试制药',
    usage: '口服',
    approvalNumber: '国药准字H10900001',
    storage: '密封',
    ingredients: '阿莫西林',
    photos: ['tmp://photo1']
  });
  pageOptions.saveMedicine.call(ctx);
  const stored = getStorage().medicines;
  assert.equal(stored.length, 1);
  const m = stored[0];
  assert.equal(m.name, '阿莫西林胶囊');
  assert.equal(m.expiryDate, '2027-01-31');
  assert.equal(m.description, 'desc');
  assert.equal(m.specification, '0.25g*24粒');
  assert.equal(m.manufacturer, '测试制药');
  assert.equal(m.usage, '口服');
  assert.equal(m.approvalNumber, '国药准字H10900001');
  assert.equal(m.storage, '密封');
  assert.equal(m.ingredients, '阿莫西林');
  assert.deepEqual(m.photos, ['tmp://photo1']);
  assert.ok(typeof m.id === 'number' && m.id > 0, 'id should be a positive number');
  assert.ok(m.createTime, 'createTime should be set');
});

test('saveMedicine appends to an existing medicines list rather than replacing it', () => {
  setStorage({
    medicines: [{ id: 1, name: 'Existing' }]
  });
  const ctx = buildContext({ name: 'NewDrug' });
  pageOptions.saveMedicine.call(ctx);
  const stored = getStorage().medicines;
  assert.equal(stored.length, 2);
  assert.equal(stored[0].name, 'Existing');
  assert.equal(stored[1].name, 'NewDrug');
});

test('recordTake refuses to record when name is empty', () => {
  setStorage({ records: [] });
  const ctx = buildContext({ name: '' });
  let toast = null;
  const orig = wx.showToast;
  wx.showToast = (opts) => { toast = opts; };
  try {
    pageOptions.recordTake.call(ctx);
  } finally {
    wx.showToast = orig;
  }
  assert.ok(toast);
  assert.equal(toast.title, '请先添加药品');
  assert.equal((getStorage().records || []).length, 0);
});

test('recordTake appends a record tied to the current medicine name', () => {
  setStorage({ records: [] });
  const ctx = buildContext({ name: '阿莫西林胶囊' });
  pageOptions.recordTake.call(ctx);
  const records = getStorage().records;
  assert.equal(records.length, 1);
  assert.equal(records[0].medicineName, '阿莫西林胶囊');
  assert.ok(records[0].medicineId, 'medicineId should be set');
  assert.ok(records[0].takeTime, 'takeTime should be set');
});

test('saveApiConfig persists the configured baidu keys', () => {
  const ctx = buildContext({
    baiduApiKey: 'NEW_KEY',
    baiduSecretKey: 'NEW_SECRET'
  });
  pageOptions.saveApiConfig.call(ctx);
  assert.equal(getStorage().baiduApiKey, 'NEW_KEY');
  assert.equal(getStorage().baiduSecretKey, 'NEW_SECRET');
});

test('toggleApiConfig flips the showApiConfig flag', () => {
  const ctx = buildContext({ showApiConfig: false });
  pageOptions.toggleApiConfig.call(ctx);
  assert.equal(ctx.data.showApiConfig, true);
  pageOptions.toggleApiConfig.call(ctx);
  assert.equal(ctx.data.showApiConfig, false);
});

test('onApiKeyInput updates baiduApiKey in data', () => {
  const ctx = buildContext();
  pageOptions.onApiKeyInput.call(ctx, { detail: { value: 'AAA' } });
  assert.equal(ctx.data.baiduApiKey, 'AAA');
});

test('onSecretKeyInput updates baiduSecretKey in data', () => {
  const ctx = buildContext();
  pageOptions.onSecretKeyInput.call(ctx, { detail: { value: 'BBB' } });
  assert.equal(ctx.data.baiduSecretKey, 'BBB');
});

test('onLoad seeds default baidu keys into storage on first run', () => {
  setStorage({});
  const ctx = buildContext();
  pageOptions.onLoad.call(ctx);
  assert.ok(getStorage().baiduApiKey, 'expected default baiduApiKey');
  assert.ok(getStorage().baiduSecretKey, 'expected default baiduSecretKey');
});
