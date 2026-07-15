// tests/helpers/wx-mock.js
// A minimal WeChat mini-program API mock for unit tests.
// Designed to be installed on `globalThis` before requiring
// mini-program source files that call `wx.*` APIs.

function makeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getStorageSync(key) {
      // Mimic wx.getStorageSync: returns the stored value, or '' when absent
      // (NOT undefined, because real wx returns '' for missing keys).
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : '';
    },
    setStorageSync(key, value) {
      data[key] = value;
    },
    removeStorageSync(key) {
      delete data[key];
    },
    clear() {
      for (const k of Object.keys(data)) delete data[k];
    },
    _dump() {
      return { ...data };
    }
  };
}

// Builds a `wx.request` stub that responds synchronously to a queued
// request using the next responder. This keeps tests deterministic.
function makeRequestStub(responders = []) {
  return {
    request(opts) {
      const responder = responders.shift();
      if (!responder) {
        throw new Error('wx.request called with no queued responder');
      }
      const { success, fail, complete } = opts;
      let invoked = false;
      try {
        const result = responder();
        if (result.error) {
          invoked = true;
          if (typeof fail === 'function') fail(result.error);
        } else {
          invoked = true;
          if (typeof success === 'function') success(result.response);
        }
      } catch (err) {
        if (typeof fail === 'function') fail(err);
        invoked = true;
      } finally {
        if (typeof complete === 'function') complete();
      }
      return invoked;
    }
  };
}

function installWx({ storage = {}, responders = [] } = {}) {
  const storageImpl = makeStorage(storage);
  const requestStub = makeRequestStub(responders);

  const wx = {
    getStorageSync: (key) => storageImpl.getStorageSync(key),
    setStorageSync: (key, value) => storageImpl.setStorageSync(key, value),
    removeStorageSync: (key) => storageImpl.removeStorageSync(key),
    request: (opts) => requestStub.request(opts),
    getFileSystemManager: () => ({
      // Default fs stub — the tests can override per-call by providing
      // `fs.readFileSync` implementations if needed.
      readFileSync(_path, _encoding) {
        return 'bW9ja2VkLWJhc2U2NA=='; // 'mocked-base64' in base64
      }
    }),
    getStorage: storageImpl,
    showToast() {},
    showLoading() {},
    hideLoading() {},
    showModal() {},
    chooseMedia() {},
    navigateTo() {},
    navigateBack() {},
    switchTab() {},
    cloud: { init() {}, callFunction() {} }
  };

  globalThis.wx = wx;
  return { wx, storageImpl, requestStub };
}

function resetWx() {
  delete globalThis.wx;
}

module.exports = {
  installWx,
  resetWx,
  makeStorage,
  makeRequestStub
};
