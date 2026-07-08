// test/helpers/wx-mock.js
// 微信小程序 wx 全局对象 的最小化内存 mock。
// 每个测试通过 installWxMock() 获得一份独立的、确定性的 wx 状态。
//
// 提供的能力：
//   - getStorageSync / setStorageSync / removeStorageSync
//   - showToast / showLoading / hideLoading / showModal （只记录调用）
//   - request （行为由各测试通过 wx.__queue 注入）
//   - getFileSystemManager （默认抛错；测试需要时挂载 readFileSync）
//   - navigateTo / navigateBack / switchTab / chooseMedia （只记录）
//   - cloud.init / cloud.callFunction
//   - Page / App / getApp / getCurrentPages （用于装载页面模块）

function createStorage() {
  const map = new Map();
  return {
    getStorageSync(key) {
      return map.has(key) ? map.get(key) : '';
    },
    setStorageSync(key, value) {
      map.set(key, value);
    },
    removeStorageSync(key) {
      map.delete(key);
    },
    clearStorageSync() {
      map.clear();
    },
    __snapshot() {
      return Object.fromEntries(map.entries());
    }
  };
}

function installWxMock(options = {}) {
  const storage = createStorage();
  const storageBackend = options.storage || storage;
  const events = [];
  const cloud = {
    init: (cfg) => events.push({ type: 'cloud.init', cfg }),
    callFunction: (cfg) => {
      events.push({ type: 'cloud.callFunction', cfg });
      const handler = cloud.__handler;
      if (typeof handler === 'function') return handler(cfg);
      return undefined;
    }
  };
  cloud.__handler = null;

  const wx = {
    __events: events,
    __reset() {
      events.length = 0;
      storage.clearStorageSync();
    },
    __seedStorage(obj) {
      for (const [k, v] of Object.entries(obj)) storage.setStorageSync(k, v);
    },

    getStorageSync: (key) => storageBackend.getStorageSync(key),
    setStorageSync: (key, value) => storageBackend.setStorageSync(key, value),
    removeStorageSync: (key) => storageBackend.removeStorageSync(key),
    clearStorageSync: () => storageBackend.clearStorageSync(),

    showToast: (opt) => events.push({ type: 'toast', opt }),
    showLoading: (opt) => events.push({ type: 'loading:show', opt }),
    hideLoading: () => events.push({ type: 'loading:hide' }),
    showModal: (opt) => {
      events.push({ type: 'modal', opt });
      // 默认不自动触发 success，由测试在 lastModal.opt.success({...}) 显式调用。
      // 这样可以分别测 confirm=true / confirm=false / editable 输入。
      if (opt.__autoSuccess) {
        const result = { confirm: opt.__confirm ?? true, cancel: false };
        if (opt.__content !== undefined) result.content = opt.__content;
        if (typeof opt.success === 'function') opt.success(result);
      }
    },

    request: (opt) => {
      events.push({ type: 'request', opt });
      const queue = wx.__requestQueue || [];
      const next = queue.shift();
      if (!next) {
        if (typeof opt.fail === 'function') opt.fail({ errMsg: 'no fake response queued' });
        return;
      }
      if (next.fail) {
        if (typeof opt.fail === 'function') opt.fail(next.fail);
        return;
      }
      if (typeof opt.success === 'function') opt.success(next.success);
    },
    __requestQueue: [],

    getFileSystemManager: () => wx.__fsManager,

    chooseMedia: (opt) => {
      events.push({ type: 'chooseMedia', opt });
      if (opt && typeof opt.__success === 'function') {
        opt.__success({ tempFiles: [{ tempFilePath: opt.__tempFilePath || 'mock://photo' }] });
      }
    },

    navigateTo: (opt) => events.push({ type: 'navigateTo', opt }),
    navigateBack: (opt) => events.push({ type: 'navigateBack', opt }),
    switchTab: (opt) => events.push({ type: 'switchTab', opt }),

    cloud
  };

  // 默认文件管理器：readFileSync 直接抛错，避免误用真实文件系统
  wx.__fsManager = {
    readFileSync: () => {
      throw new Error('wx.__fsManager.readFileSync not stubbed; pass a fake via wx.__fsManager = { readFileSync: ... }');
    }
  };

// 全局装载
  global.wx = wx;

  // 同时 stub 微信的 Page/App 注册函数（页面文件顶层就会调用 Page({...})）
  const registered = { pages: [], apps: [] };

  // 把页面配置包装成带 setData 的实例，并把所有方法绑定到该实例上，
  // 与微信运行时的行为保持一致。返回实例供测试断言用。
  function instantiatePage(config) {
    // 用 config.data 本身作为数据源（不要复制，否则 setData 修改的副本不会反映到 instance.data）
    const data = config.data || {};
    const instance = {
      data,
      setData(patch) {
        Object.assign(data, patch);
      }
    };
    for (const [k, v] of Object.entries(config)) {
      if (k === 'data') continue; // data 已经在 instance 上保留对 config.data 的引用
      if (typeof v === 'function') {
        instance[k] = v.bind(instance);
      } else {
        instance[k] = v;
      }
    }
    return instance;
  }

  global.Page = function (config) {
    const instance = instantiatePage(config);
    registered.pages.push(instance);
    return instance;
  };
  global.App = function (config) {
    const instance = { ...config };
    registered.apps.push(instance);
    return instance;
  };
  global.getApp = () => registered.apps[registered.apps.length - 1] || null;
  global.getCurrentPages = () => registered.pages;
  wx.__registered = registered;

  return wx;
}

// 拦截 Node 的模块解析：把对某个 request 字符串的 require 重定向到 fakePath，
// 并允许把任意 exports 注入 require.cache。用于“源码 import 了不存在的模块”
// 这类场景（如 pages/add/add.js require('../../utils/ai')）。
function installModuleStub(requestPattern, fakePath, exports) {
  const Module = require('node:module');
  const path = require('node:path');
  if (!path.isAbsolute(fakePath)) {
    throw new Error('fakePath must be absolute: ' + fakePath);
  }
  require.cache[fakePath] = {
    id: fakePath,
    filename: fakePath,
    loaded: true,
    exports
  };
  const origResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, ...rest) {
    if (request === requestPattern || (requestPattern instanceof RegExp && requestPattern.test(request))) {
      return fakePath;
    }
    return origResolve.call(this, request, parent, ...rest);
  };
}

module.exports = { installWxMock, createStorage, installModuleStub };
