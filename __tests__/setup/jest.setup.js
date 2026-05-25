global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  request: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  chooseMedia: jest.fn(),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'base64mockdata')
  }))
};

global.Page = function(config) {
  return config;
};

global.App = function(config) {
  return config;
};
