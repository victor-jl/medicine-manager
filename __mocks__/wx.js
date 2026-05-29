const storage = {};

global.wx = {
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  getStorageSync: jest.fn((key) => storage[key]),
  setStorageSync: jest.fn((key, value) => {
    storage[key] = value;
  }),
  request: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  navigateBack: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  chooseMedia: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn()
  })),
  getCurrentPages: jest.fn(() => []),
  getApp: jest.fn(() => ({
    globalData: {}
  }))
};

global.storage = storage;
