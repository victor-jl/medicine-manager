// Tests for utils/ocr.js → recognizeWithBaidu
// Exercises the token cache by counting how many HTTP requests the
// adapter makes. The cache is module-private (getBaiduToken is not
// exported), so we drive it through the public recognizeWithBaidu
// surface and assert on the network footprint.

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWx, resetWx } = require('./helpers/wx-mock');

function loadModule() {
  delete require.cache[require.resolve('../utils/ocr')];
  return require('../utils/ocr');
}

// Builds a responders queue that:
//   1. Issues an access_token response (Baidu OAuth endpoint).
//   2. Issues an OCR words_result response (general_basic endpoint).
// Tests that drive the cache-hit path skip the first responder.
function tokenThenOcr(accessToken, words) {
  return [
    () => ({ response: { data: { access_token: accessToken } } }),
    () => ({ response: { data: { words_result: words.map(w => ({ words: w })) } } })
  ];
}

test('recognizeWithBaidu: cache miss issues 2 requests and resolves with text', async () => {
  const { requestStub } = installWx({
    responders: tokenThenOcr('first-tok', ['阿莫西林', '胶囊 0.25g'])
  });

  const { recognizeWithBaidu } = loadModule();
  const result = await recognizeWithBaidu('mock://image.png');

  assert.equal(result.success, true);
  assert.deepEqual(result.words, ['阿莫西林', '胶囊 0.25g']);
  assert.equal(result.text, '阿莫西林 胶囊 0.25g');
  // First call should have consumed both responders.
  assert.throws(
    () => requestStub.request({ url: 'noop', success() {}, fail() {} }),
    /no queued responder/
  );
});

test('recognizeWithBaidu: cache hit skips the token request', async () => {
  installWx({
    storage: {
      baidu_token: {
        access_token: 'cached-tok',
        expires: Date.now() + 60_000
      }
    },
    // Only one responder — the OCR call. If the cache check works,
    // we never hit the token endpoint and this single response is
    // consumed.
    responders: [
      () => ({ response: { data: { words_result: [{ words: '感冒灵颗粒' }] } } })
    ]
  });

  const { recognizeWithBaidu } = loadModule();
  const result = await recognizeWithBaidu('mock://image.png');

  assert.equal(result.text, '感冒灵颗粒');
  assert.deepEqual(result.words, ['感冒灵颗粒']);
});

test('recognizeWithBaidu: expired cache triggers a token refresh', async () => {
  const { storageImpl } = installWx({
    storage: {
      baidu_token: {
        access_token: 'old-tok',
        expires: Date.now() - 1
      }
    },
    responders: tokenThenOcr('new-tok', ['维生素C片'])
  });

  const { recognizeWithBaidu } = loadModule();
  const result = await recognizeWithBaidu('mock://image.png');

  assert.equal(result.text, '维生素C片');
  // Verify the token cache was overwritten with the new value.
  const stored = storageImpl.getStorageSync('baidu_token');
  assert.equal(stored.access_token, 'new-tok');
  assert.ok(stored.expires > Date.now(), 'new expires should be in the future');
});

test('recognizeWithBaidu: rejects when OCR endpoint returns no words_result', async () => {
  installWx({
    responders: [
      () => ({ response: { data: { access_token: 'tok' } } }),
      () => ({ response: { data: { error_msg: 'image format error' } } })
    ]
  });

  const { recognizeWithBaidu } = loadModule();
  await assert.rejects(() => recognizeWithBaidu('mock://image.png'), /识别失败/);
});

test('recognizeWithBaidu: propagates request failure', async () => {
  installWx({
    responders: [
      () => ({ error: new Error('network down') })
    ]
  });

  const { recognizeWithBaidu } = loadModule();
  await assert.rejects(() => recognizeWithBaidu('mock://image.png'), /network down/);
});

test.afterEach(() => resetWx());
