// tests/helpers/wx-mock.js
// Minimal WeChat Mini-Program global stubs so utils/page modules can be
// required and exercised in plain Node. Each test installs a fresh store.

'use strict';

function createWxMock(initial = {}) {
  const store = { ...initial };
  const shown = { toast: [], modal: [], loading: false };
  const navigations = [];

  const wx = {
    getStorageSync(key) {
      // Mimic WeChat behavior: return undefined when key missing.
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : undefined;
    },
    setStorageSync(key, value) {
      store[key] = value;
    },
    removeStorageSync(key) {
      delete store[key];
    },
    showToast(opts) {
      shown.toast.push(opts);
    },
    showModal(opts) {
      shown.modal.push(opts);
      // Tests control resolution by pushing into pendingModals first.
      const next = pendingModals.shift();
      const response = typeof next === 'function'
        ? next(opts)
        : { confirm: true, content: opts && opts.content };
      // Invoke the WeChat-style success callback so page code that uses
      // success: (res) => {...} runs synchronously, matching WeChat runtime.
      if (typeof opts.success === 'function') {
        opts.success(response);
      }
      return Promise.resolve(response);
    },
    showLoading() {
      shown.loading = true;
    },
    hideLoading() {
      shown.loading = false;
    },
    navigateTo(opts) {
      navigations.push({ type: 'navigateTo', ...opts });
    },
    navigateBack() {
      navigations.push({ type: 'navigateBack' });
    },
    switchTab(opts) {
      navigations.push({ type: 'switchTab', ...opts });
    },
    chooseMedia() {},
    request() {},
    getFileSystemManager() {
      return { readFileSync: () => '' };
    }
  };

  const pendingModals = [];
  wx.__pushModalResponse = (responder) => pendingModals.push(responder);
  wx.__store = store;
  wx.__shown = shown;
  wx.__navigations = navigations;

  return wx;
}

function installWxMock(initial = {}) {
  const wx = createWxMock(initial);
  global.wx = wx;
  return wx;
}

function installPageCapture() {
  // Capture the config object passed to Page() and instantiate a small proxy
  // so we can call lifecycle methods with a setData() implementation.
  let captured = null;
  global.Page = (config) => {
    captured = config;
  };

  return {
    getConfig: () => {
      if (!captured) throw new Error('Page() was never called');
      return captured;
    },
    buildInstance: () => {
      const config = captured;
      const instance = {
        data: {},
        setData(patch) {
          // Mirror WeChat's shallow merge into `data`.
          Object.assign(this.data, patch);
        }
      };
      // Bind methods that the page defined.
      for (const key of Object.keys(config)) {
        if (typeof config[key] === 'function') {
          instance[key] = config[key].bind(instance);
        } else {
          instance[key] = config[key];
        }
      }
      return instance;
    }
  };
}

module.exports = { createWxMock, installWxMock, installPageCapture };
