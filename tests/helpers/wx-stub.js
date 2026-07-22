// tests/helpers/wx-stub.js
// Minimal WeChat mini-program global stubs for unit tests.

let storage = {};

const wx = {
  getStorageSync(key) {
    return storage[key];
  },
  setStorageSync(key, value) {
    storage[key] = value;
  },
  removeStorageSync(key) {
    delete storage[key];
  },
  clearStorageSync() {
    storage = {};
  },
  getStorageInfoSync() {
    return { keys: Object.keys(storage) };
  },
  request: () => {},
  showToast: () => {},
  // showModal is overridable per-test; default is a no-op so callbacks
  // are never invoked and side-effects are skipped.
  showModal: () => {},
  showLoading: () => {},
  hideLoading: () => {},
  // chooseMedia can be overridden per-test to feed tempFilePaths.
  chooseMedia: () => {},
  navigateTo: () => {},
  navigateBack: () => {},
  switchTab: () => {},
  getFileSystemManager: () => ({
    readFileSync: () => ''
  }),
  cloud: {
    init: () => {},
    callFunction: () => {}
  }
};

function resetStorage() {
  storage = {};
}

function setStorage(obj) {
  storage = { ...obj };
}

function getStorage() {
  return { ...storage };
}

module.exports = { wx, resetStorage, setStorage, getStorage };
