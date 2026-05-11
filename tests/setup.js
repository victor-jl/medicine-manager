global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  navigateBack: jest.fn(),
  chooseMedia: jest.fn(),
  getFileSystemManager: () => ({
    readFileSync: jest.fn().mockReturnValue('')
  }),
  request: jest.fn(),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  }
};

global.App = jest.fn();
global.Page = jest.fn();

jest.mock('../utils/ocr', () => ({
  recognizeWithWechat: jest.fn(),
  recognizeWithBaidu: jest.fn(),
  extractMedicineName: jest.fn()
}));

jest.mock('../utils/baidu-ocr', () => ({
  recognizeText: jest.fn(),
  extractMedicineName: jest.fn(),
  getAccessToken: jest.fn()
}));
