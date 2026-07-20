// 微信小程序全局 API 与页面注册 mock
// 用于在 Node 环境中运行小程序 Page/App 逻辑测试

const mockStorage = new Map();

function resetMockStorage() {
  mockStorage.clear();
}

const getStorageSync = jest.fn((key) => {
  return mockStorage.has(key) ? mockStorage.get(key) : '';
});

const setStorageSync = jest.fn((key, value) => {
  mockStorage.set(key, value);
});

const removeStorageSync = jest.fn((key) => {
  mockStorage.delete(key);
});

function createDefaultWxMock() {
  return {
    getStorageSync,
    setStorageSync,
    removeStorageSync,
    showToast: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    showModal: jest.fn((options) => {
      if (options && typeof options.success === 'function') {
        options.success({ confirm: true, cancel: false });
      }
    }),
    navigateTo: jest.fn(),
    switchTab: jest.fn(),
    navigateBack: jest.fn(),
    chooseMedia: jest.fn(),
    request: jest.fn(),
    getFileSystemManager: jest.fn(() => ({
      readFileSync: jest.fn(() => 'base64image')
    })),
    cloud: {
      init: jest.fn(),
      callFunction: jest.fn()
    }
  };
}

let lastPageConfig = null;

global.Page = jest.fn((config) => {
  lastPageConfig = config;
  return config;
});

global.App = jest.fn((config) => config);
global.getApp = jest.fn(() => ({ globalData: {} }));

function getLastPageConfig() {
  return lastPageConfig;
}

function clearLastPageConfig() {
  lastPageConfig = null;
}

function createPageInstance(config) {
  return {
    ...config,
    data: JSON.parse(JSON.stringify(config.data || {})),
    setData: jest.fn(function (data) {
      Object.assign(this.data, data);
    })
  };
}

beforeEach(() => {
  resetMockStorage();
  clearLastPageConfig();
  global.wx = createDefaultWxMock();
});

afterEach(() => {
  clearLastPageConfig();
});

global.__testHelpers = {
  getLastPageConfig,
  createPageInstance,
  mockStorage,
  resetMockStorage
};
