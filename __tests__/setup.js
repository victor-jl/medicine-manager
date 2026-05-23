const wxMock = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  request: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'mock-base64-data')
  })),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  chooseMedia: jest.fn(),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  }
};

global.wx = wxMock;

module.exports = wxMock;
