// tests/pages/add.test.js
// Tests for pages/add/add.js — save/record validation and storage writes.
// NOTE: pages/add/add.js imports '../../utils/ai' which currently does not
// exist in the source tree. We inject a stub via require.cache so the rest
// of the page logic (which is unrelated to AI parsing) can be exercised.
// This stub is *test infrastructure only* — see the regression note in the
// summary for the production-side fix.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const { installWxMock, installPageCapture } = require('../helpers/wx-mock');

// Stub installer: pages/add/add.js requires '../../utils/ai' but the source
// tree does not contain utils/ai.js. We install a resolver hook that returns
// a virtual module id for that specific request, then put the stub in the
// require cache. After the test, both the hook and the cache are restored.
function injectAiStub() {
  const Module = require('node:module');
  const path = require('node:path');
  const addPath = path.resolve(__dirname, '../../pages/add/add.js');
  const stubPath = path.resolve(path.dirname(addPath), '../../utils/ai.js');

  const stubModule = new Module(stubPath);
  stubModule.filename = stubPath;
  stubModule.loaded = true;
  stubModule.exports = {
    analyzeMedicineInfo: () => ({
      name: '',
      expiryDate: '',
      specification: '',
      manufacturer: '',
      usage: '',
      approvalNumber: '',
      storage: '',
      ingredients: ''
    }),
    formatExpiryDate: (s) => s || ''
  };
  require.cache[stubPath] = stubModule;

  // Hook the resolver so any require of '../../utils/ai' (relative to the
  // add page) maps to our cached stub. We capture only the specific request
  // string to keep the hook tight and safe to leave during the test run.
  const realResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, ...rest) {
    if (
      parent &&
      parent.filename === addPath &&
      (request === '../../utils/ai' || request === '../../utils/ai.js')
    ) {
      return stubPath;
    }
    return realResolve.call(this, request, parent, ...rest);
  };

  return () => {
    Module._resolveFilename = realResolve;
    delete require.cache[stubPath];
    delete require.cache[require.resolve(addPath)];
  };
}

function loadAddPage(wxMock) {
  // Important: restore the resolver hook ONLY after the add page has been
  // required. Otherwise the page's nested require for '../../utils/ai' would
  // bypass the hook.
  global.wx = wxMock;
  const restore = injectAiStub();
  const capture = installPageCapture();
  try {
    require('../../pages/add/add.js');
  } finally {
    restore();
  }
  return capture.buildInstance();
}

test('saveMedicine: rejects when name is empty', () => {
  const wx = installWxMock({ medicines: [] });
  const page = loadAddPage(wx);
  page.saveMedicine();
  // Storage is not modified.
  assert.equal((wx.getStorageSync('medicines') || []).length, 0);
  const titles = wx.__shown.toast.map((t) => t.title);
  assert.ok(titles.includes('请输入药品名称'), `toast titles: ${titles.join(',')}`);
});

test('saveMedicine: writes a complete medicine record and triggers navigation', () => {
  const wx = installWxMock({ medicines: [] });
  // Make post-save setTimeout synchronous so the navigateBack is observable.
  const realSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => { fn(); return 0; };
  try {
    const page = loadAddPage(wx);
    page.setData({
      name: '阿莫西林胶囊',
      expiryDate: '2027-12-31',
      description: '',
      specification: '0.25g*24粒',
      manufacturer: '某药厂',
      usage: '口服',
      approvalNumber: 'H10960012',
      storage: '密封',
      ingredients: '阿莫西林',
      photos: []
    });
    page.saveMedicine();
    const meds = wx.getStorageSync('medicines');
    assert.equal(meds.length, 1);
    const m = meds[0];
    assert.equal(m.name, '阿莫西林胶囊');
    assert.equal(m.expiryDate, '2027-12-31');
    assert.equal(m.specification, '0.25g*24粒');
    assert.equal(m.manufacturer, '某药厂');
    assert.equal(m.usage, '口服');
    assert.equal(m.approvalNumber, 'H10960012');
    assert.equal(m.storage, '密封');
    assert.equal(m.ingredients, '阿莫西林');
    assert.equal(typeof m.id, 'number');
    assert.equal(typeof m.createTime, 'string');
    assert.equal(wx.__shown.toast.at(-1).title, '保存成功');
    assert.equal(wx.__navigations.at(-1).type, 'navigateBack');
  } finally {
    global.setTimeout = realSetTimeout;
  }
});

test('saveMedicine: appends to existing medicines rather than overwriting', () => {
  const wx = installWxMock({
    medicines: [{ id: 1, name: 'Existing' }]
  });
  const realSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => { fn(); return 0; };
  try {
    const page = loadAddPage(wx);
    page.setData({
      name: 'New',
      expiryDate: '2027-01-01',
      description: '',
      specification: '',
      manufacturer: '',
      usage: '',
      approvalNumber: '',
      storage: '',
      ingredients: '',
      photos: []
    });
    page.saveMedicine();
    const meds = wx.getStorageSync('medicines');
    assert.equal(meds.length, 2);
    assert.equal(meds[0].name, 'Existing');
    assert.equal(meds[1].name, 'New');
  } finally {
    global.setTimeout = realSetTimeout;
  }
});

test('recordTake: requires a medicine name to be set first', () => {
  const wx = installWxMock({ records: [] });
  const page = loadAddPage(wx);
  page.recordTake();
  assert.equal((wx.getStorageSync('records') || []).length, 0);
  const titles = wx.__shown.toast.map((t) => t.title);
  assert.ok(titles.includes('请先添加药品'), `toast titles: ${titles.join(',')}`);
});

test('recordTake: appends a new record with the current medicine name', () => {
  const wx = installWxMock({ records: [] });
  const RealDate = global.Date;
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) super('2026-02-01T00:00:00Z');
      else super(...args);
    }
    static now() {
      return new RealDate('2026-02-01T00:00:00Z').getTime();
    }
  };
  try {
    const page = loadAddPage(wx);
    page.setData({ name: 'Aspirin' });
    page.recordTake();
    const recs = wx.getStorageSync('records');
    assert.equal(recs.length, 1);
    assert.equal(recs[0].medicineName, 'Aspirin');
    assert.equal(typeof recs[0].id, 'number');
    assert.equal(typeof recs[0].takeTime, 'string');
  } finally {
    global.Date = RealDate;
  }
});

test('saveApiConfig: persists baidu API key/secret to storage', () => {
  const wx = installWxMock({});
  const page = loadAddPage(wx);
  page.setData({ baiduApiKey: 'NEW_KEY', baiduSecretKey: 'NEW_SECRET' });
  page.saveApiConfig();
  assert.equal(wx.getStorageSync('baiduApiKey'), 'NEW_KEY');
  assert.equal(wx.getStorageSync('baiduSecretKey'), 'NEW_SECRET');
  assert.equal(wx.__shown.toast.at(-1).title, '配置已保存');
});
