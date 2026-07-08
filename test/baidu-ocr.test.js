// test/baidu-ocr.test.js
// utils/baidu-ocr.js 的回归测试。
// 覆盖 extractMedicineName（窗口 -5/+10 不同于 ocr.js）和 recognizeText
// 的成功 / 错误码 / 无效响应 / 网络失败 4 个分支。

const test = require('node:test');
const assert = require('node:assert/strict');
const { installWxMock } = require('./helpers/wx-mock');

function loadBaiduOcr() {
  delete require.cache[require.resolve('../utils/baidu-ocr.js')];
  return require('../utils/baidu-ocr.js');
}

test.beforeEach(() => {
  installWxMock();
});

// ---------- extractMedicineName ----------

test('extractMedicineName: 空输入返回空字符串', () => {
  const ocr = loadBaiduOcr();
  assert.equal(ocr.extractMedicineName(''), '');
  assert.equal(ocr.extractMedicineName(null), '');
  assert.equal(ocr.extractMedicineName(undefined), '');
});

test('extractMedicineName: 命中关键词时使用 -5/+10 窗口', () => {
  const ocr = loadBaiduOcr();
  // 选「布洛芬」（仅在 baidu-ocr 的关键词表中出现，不在 ocr.js 中）
  const text = '本产品为感冒灵，搭配:布洛芬片一盒';
  const result = ocr.extractMedicineName(text);
  assert.match(result, /布洛芬/);
  // 窗口大小：-5/+10 => 5 + 3 + 10 = 18
  assert.ok(result.length <= 5 + '布洛芬'.length + 10);
  // 窗口应包含关键词
  assert.ok(result.includes('布洛芬'));
});

test('extractMedicineName: 关键词在文本开头时不越界', () => {
  const ocr = loadBaiduOcr();
  const result = ocr.extractMedicineName('布洛芬片 200mg');
  assert.match(result, /布洛芬/);
  assert.equal(result.indexOf('布洛芬'), 0);
});

test('extractMedicineName: 关键词在文本末尾时不越界', () => {
  const ocr = loadBaiduOcr();
  const text = '批准文号: 国药准字H10960012  对乙酰氨基酚';
  const result = ocr.extractMedicineName(text);
  assert.match(result, /对乙酰氨基酚/);
  // 不应越界，关键词在末尾
  assert.ok(result.endsWith('对乙酰氨基酚'));
});

test('extractMedicineName: 没有命中任何关键词时回退到首个非空行', () => {
  const ocr = loadBaiduOcr();
  const text = '\n\n神秘化合物XYZ\n第二行内容';
  const result = ocr.extractMedicineName(text);
  // 应当跳过空行返回第一个非空行
  assert.equal(result, '神秘化合物XYZ');
});

test('extractMedicineName: 输入只有空白行时回退到前 20 字符', () => {
  const ocr = loadBaiduOcr();
  // 只有换行符，没有任何非空行
  const text = '\n\n';
  const result = ocr.extractMedicineName(text);
  // 实际行为：lines.filter 后为空数组，触发 20 字符回退
  assert.equal(result, '\n\n');
});

test('extractMedicineName: 无中文关键词时回退到首行（不截断）', () => {
  const ocr = loadBaiduOcr();
  // 关键词表全为中文，因此任何纯英文文本都不会命中，走首行回退
  const text1 = 'Vitamin C 100mg';
  const text2 = 'vitamin c 100mg';
  // 都没有命中关键词，都回退到完整首行（不截断到 20；20 截断仅在无任何非空行时触发）
  assert.equal(ocr.extractMedicineName(text1), 'Vitamin C 100mg');
  assert.equal(ocr.extractMedicineName(text2), 'vitamin c 100mg');
  // 首行原样保留大小写（toLowerCase 只用于匹配，不用于返回）
  assert.notEqual(ocr.extractMedicineName(text1), ocr.extractMedicineName(text2));
});

// ---------- recognizeText ----------

test('recognizeText: 完整成功路径（token + OCR 都成功）', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => Buffer.from('img').toString('base64') };

  // token 接口
  wx.__requestQueue.push({ success: { data: { access_token: 'tok-1' } } });
  // OCR 接口
  wx.__requestQueue.push({
    success: {
      data: {
        words_result: [
          { words: '阿莫西林胶囊' },
          { words: '0.25g*24粒' }
        ]
      }
    }
  });

  const ocr = loadBaiduOcr();
  const result = await ocr.recognizeText('mock://photo');

  assert.equal(result.success, true);
  assert.deepEqual(result.words, ['阿莫西林胶囊', '0.25g*24粒']);
  assert.equal(result.text, '阿莫西林胶囊 0.25g*24粒');
});

test('recognizeText: 命中 token 缓存时不调用 token 接口', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  // 填入尚未过期的 token
  wx.setStorageSync('baidu_access_token', 'cached-tok');
  wx.setStorageSync('baidu_token_expires', Date.now() + 60_000);

  // 只入队 1 个响应
  wx.__requestQueue.push({
    success: { data: { words_result: [{ words: 'OK' }] } }
  });

  const ocr = loadBaiduOcr();
  const result = await ocr.recognizeText('mock://photo');

  assert.equal(result.text, 'OK');
  // 只应发 1 次请求（OCR 端）
  const requests = wx.__events.filter(e => e.type === 'request');
  assert.equal(requests.length, 1);
  assert.match(requests[0].opt.url, /access_token=cached-tok/);
});

test('recognizeText: token 已过期时会重新获取', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  // 过期 token
  wx.setStorageSync('baidu_access_token', 'stale-tok');
  wx.setStorageSync('baidu_token_expires', Date.now() - 1000);

  // 2 个响应：先 token 后 OCR
  wx.__requestQueue.push({ success: { data: { access_token: 'fresh-tok' } } });
  wx.__requestQueue.push({ success: { data: { words_result: [{ words: 'OK' }] } } });

  const ocr = loadBaiduOcr();
  const result = await ocr.recognizeText('mock://photo');

  assert.equal(result.text, 'OK');
  // 缓存应被更新
  assert.equal(wx.getStorageSync('baidu_access_token'), 'fresh-tok');
});

test('recognizeText: 缓存 25 天而非 30 天（token 实际有效期是 30 天）', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };
  // 不预置缓存
  wx.__requestQueue.push({ success: { data: { access_token: 'tok-X' } } });
  wx.__requestQueue.push({ success: { data: { words_result: [{ words: 'Y' }] } } });

  const ocr = loadBaiduOcr();
  await ocr.recognizeText('mock://photo');

  const expires = wx.getStorageSync('baidu_token_expires');
  const now = Date.now();
  // 期望缓存接近 25 天（误差 < 1 分钟）
  const expectedMs = 25 * 24 * 60 * 60 * 1000;
  const diff = Math.abs(expires - now - expectedMs);
  assert.ok(diff < 60_000, `expected expires ~25d, got diff ${diff}ms`);
});

test('recognizeText: OCR 返回 error_code 时 reject 并附 error_msg', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  wx.__requestQueue.push({ success: { data: { access_token: 'tok' } } });
  wx.__requestQueue.push({
    success: { data: { error_code: '216201', error_msg: 'image format error' } }
  });

  const ocr = loadBaiduOcr();
  await assert.rejects(
    () => ocr.recognizeText('mock://photo'),
    /OCR识别失败: image format error/
  );
});

test('recognizeText: OCR 返回空响应时 reject', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  wx.__requestQueue.push({ success: { data: { access_token: 'tok' } } });
  wx.__requestQueue.push({ success: { data: {} } });

  const ocr = loadBaiduOcr();
  await assert.rejects(
    () => ocr.recognizeText('mock://photo'),
    /未返回有效数据/
  );
});

test('recognizeText: OCR 网络失败时 reject', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  wx.__requestQueue.push({ success: { data: { access_token: 'tok' } } });
  wx.__requestQueue.push({ fail: { errMsg: 'request:fail timeout' } });

  const ocr = loadBaiduOcr();
  await assert.rejects(
    () => ocr.recognizeText('mock://photo'),
    (err) => err && err.errMsg === 'request:fail timeout'
  );
});

test('recognizeText: token 响应缺少 access_token 时 reject', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  wx.__requestQueue.push({ success: { data: { error: 'invalid_client' } } });

  const ocr = loadBaiduOcr();
  await assert.rejects(
    () => ocr.recognizeText('mock://photo'),
    /获取token失败/
  );
});
