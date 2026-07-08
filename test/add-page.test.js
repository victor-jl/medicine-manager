// test/add-page.test.js
// pages/add/add.js 的回归测试。
// 重点覆盖不依赖外部 AI 工具的纯业务逻辑：
//   1) onLoad  把硬编码的 API Key 写入 storage
//   2) saveApiConfig  把当前页面输入写到 storage
//   3) saveMedicine   校验名称后写入存储（带新增字段）
//   4) recordTake     校验名称后写入服药记录
//   5) doOCR / callBaiduOCR 的 API 响应解析分支
//
// 注：源码 import 了 '../../utils/ai' 但仓库里没有该文件，会在 Node 加载阶段失败。
// 这里通过 Module._resolveFilename 注入一个最小桩模块，避免在源码中创建无意义的 stub 文件。

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { installWxMock, installModuleStub } = require('./helpers/wx-mock');

const AI_STUB_PATH = path.resolve(__dirname, '../utils/ai.js');
const AI_STUB_EXPORTS = {
  analyzeMedicineInfo: (text) => ({
    name: 'AI_NAME_' + (text || '').slice(0, 5),
    specification: '0.25g*24粒',
    manufacturer: 'AI厂商',
    usage: '口服',
    approvalNumber: 'H12345678',
    storage: '阴凉',
    ingredients: 'AI成分',
    expiryDate: '2025-12-31'
  }),
  formatExpiryDate: (s) => s
};

function loadAddPage() {
  delete require.cache[require.resolve('../pages/add/add.js')];
  require('../pages/add/add.js');
  return global.wx.__registered.pages[global.wx.__registered.pages.length - 1];
}

test.beforeEach(() => {
  installWxMock();
  // 重置 stub：每次测试都重新注入同一个路径，避免前一次测试的 cache 影响
  require.cache[AI_STUB_PATH] = {
    id: AI_STUB_PATH,
    filename: AI_STUB_PATH,
    loaded: true,
    exports: { ...AI_STUB_EXPORTS }
  };
  // 安装一次性的 resolver 钩子，把 '../../utils/ai' 重定向到 AI_STUB_PATH
  installModuleStub('../../utils/ai', AI_STUB_PATH, require.cache[AI_STUB_PATH].exports);
});

test('onLoad: 首次进入时把默认 API Key / Secret 写入 storage', () => {
  const wx = installWxMock();
  const page = loadAddPage();
  page.onLoad();

  assert.equal(wx.getStorageSync('baiduApiKey'), 'AWWs4izOHOWa7jhiKkCASDts');
  assert.equal(wx.getStorageSync('baiduSecretKey'), 'fbxKdLTrl5gz1OmLtTUD9UcOLopQP0ru');
});

test('saveApiConfig: 把页面当前的 Key / Secret 写入 storage 并提示', () => {
  const wx = installWxMock();
  const page = loadAddPage();
  page.setData({ baiduApiKey: 'new-key', baiduSecretKey: 'new-secret' });
  wx.__events.length = 0;

  page.saveApiConfig();

  assert.equal(wx.getStorageSync('baiduApiKey'), 'new-key');
  assert.equal(wx.getStorageSync('baiduSecretKey'), 'new-secret');
  const toasts = wx.__events.filter(e => e.type === 'toast');
  assert.ok(toasts.some(t => t.opt.title === '配置已保存'));
});

test('saveMedicine: 未输入名称时拒绝并提示', () => {
  const wx = installWxMock();
  wx.__seedStorage({ medicines: [] });
  const page = loadAddPage();
  wx.__events.length = 0;

  page.saveMedicine();

  assert.equal(wx.getStorageSync('medicines').length, 0);
  const toasts = wx.__events.filter(e => e.type === 'toast');
  assert.ok(toasts.some(t => t.opt.title === '请输入药品名称'));
});

test('saveMedicine: 输入名称后写入新增字段完整的药品对象', () => {
  const wx = installWxMock();
  wx.__seedStorage({ medicines: [] });
  const page = loadAddPage();
  page.setData({
    name: '维生素C',
    expiryDate: '2025-12-31',
    description: 'desc',
    specification: '0.1g*30',
    manufacturer: '哈药',
    usage: '口服',
    approvalNumber: 'H1234',
    storage: '阴凉',
    ingredients: '抗坏血酸',
    photos: ['mock://a.png']
  });
  wx.__events.length = 0;

  page.saveMedicine();

  const medicines = wx.getStorageSync('medicines');
  assert.equal(medicines.length, 1);
  const m = medicines[0];
  assert.equal(m.name, '维生素C');
  assert.equal(m.expiryDate, '2025-12-31');
  assert.equal(m.specification, '0.1g*30');
  assert.equal(m.manufacturer, '哈药');
  assert.equal(m.usage, '口服');
  assert.equal(m.approvalNumber, 'H1234');
  assert.equal(m.storage, '阴凉');
  assert.equal(m.ingredients, '抗坏血酸');
  assert.deepEqual(m.photos, ['mock://a.png']);
  assert.ok(m.id > 0);
  assert.ok(m.createTime);
});

test('saveMedicine: 保存后调用 setTimeout(navigateBack, 1500)', () => {
  const wx = installWxMock();
  wx.__seedStorage({ medicines: [] });
  const page = loadAddPage();
  page.setData({ name: 'A' });

  // 替换 setTimeout 来即时检查回调
  const realSetTimeout = global.setTimeout;
  const captured = [];
  global.setTimeout = (fn, ms) => {
    captured.push({ fn, ms });
    return 0;
  };
  try {
    page.saveMedicine();
  } finally {
    global.setTimeout = realSetTimeout;
  }

  // 应当存在一个 1500ms 的定时器，调用的是 wx.navigateBack
  const navBack = captured.find(c => c.ms === 1500);
  assert.ok(navBack, 'saveMedicine 应注册 1500ms 的延迟回退');
  navBack.fn();
  const navEvents = wx.__events.filter(e => e.type === 'navigateBack');
  assert.ok(navEvents.length > 0);
});

test('recordTake: 名称为空时拒绝', () => {
  const wx = installWxMock();
  wx.__seedStorage({ records: [] });
  const page = loadAddPage();
  wx.__events.length = 0;

  page.recordTake();

  assert.equal(wx.getStorageSync('records').length, 0);
  const toasts = wx.__events.filter(e => e.type === 'toast');
  assert.ok(toasts.some(t => t.opt.title === '请先添加药品'));
});

test('recordTake: 有名称时写入服药记录', () => {
  const wx = installWxMock();
  wx.__seedStorage({ records: [] });
  const page = loadAddPage();
  page.setData({ name: '阿莫西林' });
  wx.__events.length = 0;

  page.recordTake();

  const records = wx.getStorageSync('records');
  assert.equal(records.length, 1);
  assert.equal(records[0].medicineName, '阿莫西林');
  assert.ok(records[0].takeTime);
  // 提示
  const toasts = wx.__events.filter(e => e.type === 'toast');
  assert.ok(toasts.some(t => t.opt.title === '记录成功'));
});

test('doOCR: OCR 成功时 resolve { text }', () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  const page = loadAddPage();

  // 入队 OCR 响应必须在 doOCR 之前：doOCR 同步触发 wx.request，mock 会立刻消费队列
  wx.__requestQueue.push({
    success: {
      data: {
        words_result: [{ words: '阿莫西林胶囊' }, { words: '0.25g*24粒' }]
      }
    }
  });

  // doOCR 是 callback 风格，包装成 Promise
  const p = new Promise((resolve, reject) => {
    page.doOCR('mock://p', 'tok-1', resolve, reject);
  });

  return p.then((result) => {
    assert.equal(result.text, '阿莫西林胶囊 0.25g*24粒');
  });
});

test('doOCR: OCR 返回 error_msg 时 reject', () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  const page = loadAddPage();

  wx.__requestQueue.push({
    success: { data: { error_msg: 'image format error' } }
  });

  const p = new Promise((resolve, reject) => {
    page.doOCR('mock://p', 'tok-1', resolve, reject);
  });
  return assert.rejects(() => p, /image format error/);
});

test('doOCR: OCR 响应既无 words_result 又无 error_msg 时 reject', () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  const page = loadAddPage();

  wx.__requestQueue.push({ success: { data: {} } });

  const p = new Promise((resolve, reject) => {
    page.doOCR('mock://p', 'tok-1', resolve, reject);
  });
  return assert.rejects(() => p, /未识别到文字/);
});

test('callBaiduOCR: 拿到 access_token 后调用 doOCR 并 resolve', () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  const page = loadAddPage();
  wx.__events.length = 0;

  // token 响应
  wx.__requestQueue.push({ success: { data: { access_token: 'tok-A' } } });
  // OCR 响应
  wx.__requestQueue.push({
    success: { data: { words_result: [{ words: 'OK' }] } }
  });

  return page.callBaiduOCR('mock://p', 'k', 's').then((result) => {
    assert.equal(result.text, 'OK');
    // 共 2 次 request：1 次 token，1 次 OCR
    const requests = wx.__events.filter(e => e.type === 'request');
    assert.equal(requests.length, 2);
  });
});

test('callBaiduOCR: token 响应有 error_description 时 reject', () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  const page = loadAddPage();
  wx.__events.length = 0;

  wx.__requestQueue.push({
    success: { data: { error_description: 'invalid client credentials' } }
  });

  return assert.rejects(
    () => page.callBaiduOCR('mock://p', 'k', 's'),
    /invalid client credentials/
  );
});

test('callBaiduOCR: token 响应无 access_token 也不带 error_description 时 reject', () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  const page = loadAddPage();
  wx.__events.length = 0;

  wx.__requestQueue.push({ success: { data: { random: 'x' } } });

  return assert.rejects(
    () => page.callBaiduOCR('mock://p', 'k', 's'),
    /获取Token失败/
  );
});

test('callBaiduOCR: token 请求网络失败时 reject（带 API 请求失败前缀）', () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  const page = loadAddPage();

  wx.__requestQueue.push({ fail: { errMsg: 'request:fail timeout' } });

  // 源码 fail 回调包装成 new Error('API请求失败: ' + err.errMsg)
  return assert.rejects(
    () => page.callBaiduOCR('mock://p', 'k', 's'),
    /API请求失败: request:fail timeout/
  );
});

test('doIdentify: 缺 API Key 时提示用户去配置且不发起请求', () => {
  const wx = installWxMock();
  // 不 seed API Key
  const page = loadAddPage();
  wx.__events.length = 0;

  page.doIdentify('mock://p');

  // 应当弹 modal
  const modals = wx.__events.filter(e => e.type === 'modal');
  assert.equal(modals.length, 1);
  assert.match(modals[0].opt.content, /请先配置百度OCR/);
  // 不应发起任何网络请求
  const requests = wx.__events.filter(e => e.type === 'request');
  assert.equal(requests.length, 0);
});

test('doIdentify: API Key 缺失 → 用户确认配置 → 打开 showApiConfig 面板', () => {
  const wx = installWxMock();
  const page = loadAddPage();
  wx.__events.length = 0;

  page.doIdentify('mock://p');
  const modal = [...wx.__events].reverse().find(e => e.type === 'modal');
  modal.opt.success({ confirm: true });

  assert.equal(page.data.showApiConfig, true);
});

test('doIdentify: 成功路径 - 用 AI 工具解析识别结果并填回表单', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  // 配置 API key，让 doIdentify 不在缺 key 时直接返回
  wx.setStorageSync('baiduApiKey', 'k');
  wx.setStorageSync('baiduSecretKey', 's');

  const page = loadAddPage();

  // token 响应 + OCR 响应
  wx.__requestQueue.push({ success: { data: { access_token: 'tok' } } });
  wx.__requestQueue.push({
    success: { data: { words_result: [{ words: '维生素C' }, { words: '0.1g*30' }] } }
  });

  await page.doIdentify('mock://p');

  // AI 桩返回的 name 基于 text 前 5 个字符；text 是 "维生素C 0.1g*30"
  // .slice(0,5) = "维生素C " (4 个汉字 + 1 个空格)
  assert.equal(page.data.name, 'AI_NAME_维生素C ');
  assert.equal(page.data.expiryDate, '2025-12-31');
  assert.equal(page.data.specification, '0.25g*24粒');
  assert.equal(page.data.manufacturer, 'AI厂商');
  assert.equal(page.data.usage, '口服');
  assert.equal(page.data.approvalNumber, 'H12345678');
  assert.equal(page.data.storage, '阴凉');
  assert.equal(page.data.ingredients, 'AI成分');
  // description 应当拼接 descParts
  assert.match(page.data.description, /规格: 0\.25g\*24粒/);
  assert.match(page.data.description, /厂家: AI厂商/);
  // 隐藏 loading
  const hideLoading = wx.__events.filter(e => e.type === 'loading:hide');
  assert.ok(hideLoading.length > 0);
  // 成功 toast
  const toasts = wx.__events.filter(e => e.type === 'toast');
  assert.ok(toasts.some(t => t.opt.title === '识别成功'));
});

test('doIdentify: OCR 失败时捕获错误并提示', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  wx.setStorageSync('baiduApiKey', 'k');
  wx.setStorageSync('baiduSecretKey', 's');

  const page = loadAddPage();
  wx.__events.length = 0;

  // token 成功但 OCR 失败
  wx.__requestQueue.push({ success: { data: { access_token: 'tok' } } });
  wx.__requestQueue.push({ success: { data: { error_msg: 'image too large' } } });

  await page.doIdentify('mock://p');

  // isIdentifying 应被关闭
  assert.equal(page.data.isIdentifying, false);
  // 错误 toast
  const toasts = wx.__events.filter(e => e.type === 'toast');
  assert.ok(toasts.some(t => t.opt.title && t.opt.title.includes('识别失败')));
});

test('takePhoto: 选图后写入 photos 并触发 doIdentify（异步）', async () => {
  const wx = installWxMock();
  wx.setStorageSync('baiduApiKey', 'k');
  wx.setStorageSync('baiduSecretKey', 's');
  const page = loadAddPage();
  wx.__fsManager = { readFileSync: () => 'b64' };

  // 替换 chooseMedia：让 WeChat 行为发生（异步触发 success）
  wx.chooseMedia = (opt) => {
    setImmediate(() => {
      if (typeof opt.success === 'function') {
        opt.success({ tempFiles: [{ tempFilePath: 'mock://photo.jpg' }] });
      }
    });
  };

  // doIdentify 会发起 2 次 request（token + OCR），提前入队
  wx.__requestQueue.push({ success: { data: { access_token: 'tok' } } });
  wx.__requestQueue.push({ success: { data: { words_result: [{ words: 'A' }] } } });

  page.takePhoto();

  // 等待 doIdentify 完成（poll 直到 name 被填充）
  for (let i = 0; i < 50 && !page.data.name; i++) {
    await new Promise((r) => setImmediate(r));
  }

  // photos 应被设置
  assert.equal(page.data.photos.length, 1);
  // doIdentify 完成：name 被 AI 桩填充
  assert.match(page.data.name, /^AI_NAME_/);
  // 至少 2 次 request
  const requests = wx.__events.filter(e => e.type === 'request');
  assert.ok(requests.length >= 2, `expected >= 2 requests, got ${requests.length}`);
});
