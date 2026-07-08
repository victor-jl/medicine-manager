// test/ocr.test.js
// utils/ocr.js 的回归测试。
// 重点覆盖 extractMedicineName 的边界与多种关键字命中情形，
// 以及 recognizeWithBaidu 的 API 响应解析路径（成功 / 错误 / 网络失败）。

const test = require('node:test');
const assert = require('node:assert/strict');
const { installWxMock } = require('./helpers/wx-mock');

function loadOcr() {
  // 每次重新加载，避免模块级缓存导致 wx 状态被串改
  delete require.cache[require.resolve('../utils/ocr.js')];
  return require('../utils/ocr.js');
}

test.beforeEach(() => {
  installWxMock();
});

// ---------- extractMedicineName ----------

test('extractMedicineName: 空输入返回空字符串', () => {
  const ocr = loadOcr();
  assert.equal(ocr.extractMedicineName(''), '');
  assert.equal(ocr.extractMedicineName(null), '');
  assert.equal(ocr.extractMedicineName(undefined), '');
});

test('extractMedicineName: 命中关键词时返回包含关键词的上下文片段', () => {
  const ocr = loadOcr();
  // 文本里只能命中一个表内关键词（且该关键词在表内靠后），
  // 避免「胶囊」等更靠前的关键词先匹配造成干扰。
  const text = '99999阿莫西林一盒;规格0.25g*24粒|包装';
  const result = ocr.extractMedicineName(text);
  // 必须包含关键词本身
  assert.match(result, /阿莫西林/);
  // 返回的子串不超过窗口大小：8 + 关键词长度 + 10
  assert.ok(result.length <= 8 + '阿莫西林'.length + 10);
  // 不应包含远在原文中位于关键词之后的字符串
  assert.ok(result.length < text.length);
  const srcIdx = text.indexOf('阿莫西林');
  const expected = text.substring(Math.max(0, srcIdx - 8), Math.min(text.length, srcIdx + '阿莫西林'.length + 10)).trim();
  assert.equal(result, expected);
});

test('extractMedicineName: 关键词在文本开头时不越界', () => {
  const ocr = loadOcr();
  // 关键词就出现在第 0 位，start = max(0, 0-8) = 0
  const result = ocr.extractMedicineName('布洛芬片 200mg');
  assert.match(result, /布洛芬/);
  assert.equal(result.indexOf('布洛芬'), 0);
});

test('extractMedicineName: 关键词在文本末尾时不越界', () => {
  const ocr = loadOcr();
  const text = '批准文号: 国药准字H10960012  对乙酰氨基酚';
  const result = ocr.extractMedicineName(text);
  assert.match(result, /对乙酰氨基酚/);
  // 提取的片段应包含末尾的关键词
  assert.ok(result.endsWith('对乙酰氨基酚') || result.indexOf('对乙酰氨基酚') >= 0);
});

test('extractMedicineName: 没有命中任何关键词时回退到首行', () => {
  const ocr = loadOcr();
  const text = '神秘化合物XYZ  神秘化合物ABC\n第二行内容';
  const result = ocr.extractMedicineName(text);
  // 不应包含第二行
  assert.ok(!result.includes('第二行'));
  // 应来自第一行
  assert.ok(result.startsWith('神秘化合物XYZ'));
});

test('extractMedicineName: 首行回退会截断到 30 字符', () => {
  const ocr = loadOcr();
  const longFirstLine = '一'.repeat(80);
  const result = ocr.extractMedicineName(longFirstLine);
  assert.equal(result.length, 30);
});

test('extractMedicineName: 多个关键词时按定义顺序返回首个命中', () => {
  const ocr = loadOcr();
  // 关键词表顺序：'胶囊'(0) ... '阿莫西林'(9)
  // 文本中 '阿莫西林' 在 idx=5，'胶囊' 在 idx=20，'胶囊' 的 -8/+10 窗口
  // 不会覆盖到 idx=5-9 的 '阿莫西林'。函数应优先按表内顺序匹配到 '胶囊'。
  const text = '99999阿莫西林一盒@@远端@@@胶囊粒';
  const result = ocr.extractMedicineName(text);
  assert.match(result, /胶囊/);
  // '阿莫西林' 位于胶囊的左侧窗口之外，不应出现在结果中
  assert.ok(!result.includes('阿莫西林'),
    `result="${result}" should not contain the second keyword`);
});

test('extractMedicineName: 无中文关键词时回到首行（大小写不影响行为）', () => {
  const ocr = loadOcr();
  // 关键词表全为中文，因此任何纯英文文本都不会命中，走首行回退
  const result = ocr.extractMedicineName('Vitamin C 100mg tablets');
  assert.equal(result, 'Vitamin C 100mg tablets'.substring(0, 30));
});

// ---------- recognizeWithBaidu ----------

test('recognizeWithBaidu: token 成功且 OCR 成功时返回 words 数组', async () => {
  const wx = installWxMock();
  // mock 文件系统读取
  wx.__fsManager = { readFileSync: () => Buffer.from('fake-image').toString('base64') };

  wx.__requestQueue.push({
    success: { data: { access_token: 'tok-123', expires_in: 2592000 } }
  });
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

  const ocr = loadOcr();
  const result = await ocr.recognizeWithBaidu('mock://photo');

  assert.equal(result.success, true);
  assert.deepEqual(result.words, ['阿莫西林胶囊', '0.25g*24粒']);
  assert.equal(result.text, '阿莫西林胶囊 0.25g*24粒');
});

test('recognizeWithBaidu: OCR 响应缺少 words_result 时 reject', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  wx.__requestQueue.push({ success: { data: { access_token: 'tok' } } });
  wx.__requestQueue.push({ success: { data: { error_msg: 'image format error' } } });

  const ocr = loadOcr();
  await assert.rejects(
    () => ocr.recognizeWithBaidu('mock://photo'),
    /识别失败/
  );
});

test('recognizeWithBaidu: token 请求失败时 reject', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  // token 阶段 fail：fail 回调把 err 对象原样透传给 reject
  wx.__requestQueue.push({ fail: { errMsg: 'network error' } });

  const ocr = loadOcr();
  await assert.rejects(
    () => ocr.recognizeWithBaidu('mock://photo'),
    (err) => err && err.errMsg === 'network error'
  );
});

test('recognizeWithBaidu: 命中 token 缓存时不重复请求 token 接口', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  // 预填一个未来才过期的 token
  wx.setStorageSync('baidu_token', { access_token: 'cached-tok', expires: Date.now() + 60_000 });

  // 只入队 1 个响应 —— 命中缓存时只会发 1 次 OCR 请求
  wx.__requestQueue.push({
    success: { data: { words_result: [{ words: '布洛芬' }] } }
  });

  const ocr = loadOcr();
  const result = await ocr.recognizeWithBaidu('mock://photo');

  assert.equal(result.text, '布洛芬');
  // 验证确实只发起了 1 次 request
  const requests = wx.__events.filter(e => e.type === 'request');
  assert.equal(requests.length, 1, '应该跳过 token 请求');
});

test('recognizeWithBaidu: token 缓存过期时会重新请求 token', async () => {
  const wx = installWxMock();
  wx.__fsManager = { readFileSync: () => 'b64' };

  // 过期 token
  wx.setStorageSync('baidu_token', { access_token: 'stale-tok', expires: Date.now() - 1000 });

  // 2 次响应：先 token 后 OCR
  wx.__requestQueue.push({ success: { data: { access_token: 'fresh-tok' } } });
  wx.__requestQueue.push({ success: { data: { words_result: [{ words: 'OK' }] } } });

  const ocr = loadOcr();
  const result = await ocr.recognizeWithBaidu('mock://photo');

  assert.equal(result.text, 'OK');
  const requests = wx.__events.filter(e => e.type === 'request');
  assert.equal(requests.length, 2);
  // 第一次请求的 url 应当是 token 端点
  assert.match(requests[0].opt.url, /oauth\/2\.0\/token/);
  // 第二次应当带 fresh-tok
  assert.match(requests[1].opt.url, /access_token=fresh-tok/);
});
