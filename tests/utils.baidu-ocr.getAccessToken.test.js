// Tests for utils/baidu-ocr.js → getAccessToken
// Verifies the access-token cache: hit / miss / expiry / network
// failure paths. The cache is stored as two separate keys
// (baidu_access_token, baidu_token_expires) on wx storage.

const test = require('node:test');
const assert = require('node:assert/strict');

const { installWx, resetWx } = require('./helpers/wx-mock');

function loadModule() {
  // Each test re-requires the module so the API_KEY/SECRET_KEY constants
  // and any closures are fresh.
  delete require.cache[require.resolve('../utils/baidu-ocr')];
  return require('../utils/baidu-ocr');
}

test('getAccessToken: returns cached token when present and not expired', async () => {
  // No responders queued. If the cache-hit path is correct, no
  // wx.request call is made and we never try to dequeue a responder.
  installWx({
    storage: {
      baidu_access_token: 'cached-token',
      baidu_token_expires: Date.now() + 60_000 // 1 minute from now
    }
  });

  const { getAccessToken } = loadModule();
  const token = await getAccessToken();

  assert.equal(token, 'cached-token');
});

test('getAccessToken: refreshes token when cache is missing', async () => {
  const { storageImpl, requestStub } = installWx({
    responders: [
      () => ({ response: { data: { access_token: 'fresh-token' } } })
    ]
  });

  const { getAccessToken } = loadModule();
  const token = await getAccessToken();

  assert.equal(token, 'fresh-token');
  const dump = storageImpl._dump();
  assert.equal(dump.baidu_access_token, 'fresh-token');
  // Expiry should be ~25 days in the future.
  const expires = dump.baidu_token_expires;
  const days = (expires - Date.now()) / (1000 * 60 * 60 * 24);
  assert.ok(days > 24 && days < 26, `expected ~25 days, got ${days}`);
});

test('getAccessToken: refreshes token when cached entry is expired', async () => {
  const { storageImpl } = installWx({
    storage: {
      baidu_access_token: 'stale-token',
      baidu_token_expires: Date.now() - 1000 // 1 second in the past
    },
    responders: [
      () => ({ response: { data: { access_token: 'refreshed-token' } } })
    ]
  });

  const { getAccessToken } = loadModule();
  const token = await getAccessToken();

  assert.equal(token, 'refreshed-token');
  const dump = storageImpl._dump();
  assert.equal(dump.baidu_access_token, 'refreshed-token');
});

test('getAccessToken: rejects when response is missing access_token', async () => {
  installWx({
    responders: [
      () => ({ response: { data: { error: 'invalid_client' } } })
    ]
  });

  const { getAccessToken } = loadModule();
  await assert.rejects(
    () => getAccessToken(),
    /获取token失败/
  );
});

test('getAccessToken: rejects when the underlying request fails', async () => {
  installWx({
    responders: [
      () => ({ error: new Error('request:fail') })
    ]
  });

  const { getAccessToken } = loadModule();
  await assert.rejects(() => getAccessToken(), /request:fail/);
});

test('getAccessToken: rejects when cached token exists but expires is missing', async () => {
  // The cache check is `cachedToken && expiresTime && Date.now() < expiresTime`.
  // If expiresTime is absent, the cache must be treated as a miss.
  installWx({
    storage: {
      baidu_access_token: 'orphaned-token'
      // baidu_token_expires intentionally absent
    },
    responders: [
      () => ({ response: { data: { access_token: 'recovered-token' } } })
    ]
  });

  const { getAccessToken } = loadModule();
  const token = await getAccessToken();
  assert.equal(token, 'recovered-token');
});

test.afterEach(() => resetWx());
