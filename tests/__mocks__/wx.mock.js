const wxMock = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  chooseMedia: jest.fn(),
  getFileSystemManager: jest.fn(),
  request: jest.fn(),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  }
};

global.wx = wxMock;

global.Page = function(config) {
  return config;
};

global.App = function(config) {
  return config;
};

module.exports = wxMock;
