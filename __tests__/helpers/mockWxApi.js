// __tests__/helpers/mockWxApi.js
// Mock WeChat API for testing

const storage = {};
let storageSyncCalls = [];

global.wx = {
  getStorageSync: (key) => {
    storageSyncCalls.push({ method: 'getStorageSync', key });
    return storage[key];
  },
  setStorageSync: (key, value) => {
    storageSyncCalls.push({ method: 'setStorageSync', key, value });
    storage[key] = value;
  },
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  chooseMedia: jest.fn(),
  request: jest.fn(),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  getFileSystemManager: () => ({
    readFileSync: jest.fn().mockReturnValue('mock-base64-data')
  })
};

global.StorageMock = {
  clear: () => {
    Object.keys(storage).forEach(key => delete storage[key]);
    storageSyncCalls = [];
  },
  getStorage: () => ({ ...storage }),
  getCalls: () => [...storageSyncCalls],
  setStorage: (key, value) => {
    storage[key] = value;
  }
};

global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      super('2026-01-15T10:00:00.000Z');
    } else {
      super(...args);
    }
  }
};

global.Date.now = () => new Date('2026-01-15T10:00:00.000Z').getTime();
global.Date.prototype.toDateString = function() {
  return new Date(this.getTime()).toDateString();
};
global.Date.prototype.toLocaleString = function() {
  return this.toLocaleString('zh-CN');
};
