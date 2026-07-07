// Shared test helpers.
//
// The WeChat Mini Program runtime exposes two globals that production
// code depends on: `wx` (storage/network/UI) and `Page` (page
// registration). To load a page module under Node, we install fakes
// for both on `globalThis` BEFORE the module is required, then capture
// the configuration object the module passes to `Page()`.
//
// Important: the page's lifecycle methods reference `wx` LAZILY (i.e.
// at call time, not at definition time). So we leave our fake `wx`
// installed on `globalThis` for the entire test run. To get a fresh
// `Page()` registration per test, we also clear the require cache.

const path = require('path');

/** Create a fresh fake "wx" global. State is per-instance. */
function createFakeWx() {
  const storage = {};
  return {
    storage,
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
    // UI / network stubs - calls into these are no-ops for unit tests.
    request: () => {},
    showToast: () => {},
    showLoading: () => {},
    hideLoading: () => {},
    showModal: () => {},
    navigateTo: () => {},
    navigateBack: () => {},
    switchTab: () => {},
    chooseMedia: () => {},
    getFileSystemManager: () => ({
      readFileSync: () => '',
    }),
  };
}

/**
 * Load a page module and return an object whose methods can be called
 * just like the real page lifecycle. The fake `wx` is also returned so
 * tests can pre-seed storage.
 *
 * Side effects: installs a fake `wx` and `Page` on `globalThis` (and
 * leaves them there) and clears the page's entry from `require.cache`
 * so subsequent calls re-evaluate the module.
 *
 * @param {string} relPath  path relative to the tests/ directory
 * @returns {{ page: object, fakeWx: object }}
 */
function loadPage(relPath) {
  const absPath = require.resolve(path.resolve(__dirname, relPath));
  // Force re-evaluation so each call to loadPage gets a fresh Page()
  // registration. Without this, the module is only evaluated once and
  // `captured` stays null on subsequent loads.
  delete require.cache[absPath];

  const fakeWx = createFakeWx();
  let captured = null;

  // Install (or overwrite) fakes on the global namespace.
  globalThis.wx = fakeWx;
  globalThis.Page = (config) => {
    captured = config;
  };

  require(absPath);

  if (!captured) {
    throw new Error(`Module ${relPath} did not call Page(...).`);
  }

  // Build a page instance the same way the runtime would: `data` is
  // the initial data, `setData` merges patches, and lifecycle methods
  // are bound so `this` resolves to the instance.
  const page = {
    data: { ...(captured.data || {}) },
    setData(patch) {
      Object.assign(this.data, patch);
    },
  };
  for (const [name, fn] of Object.entries(captured)) {
    if (typeof fn === 'function' && name !== 'setData') {
      page[name] = fn.bind(page);
    }
  }

  return { page, fakeWx };
}

module.exports = { createFakeWx, loadPage };
