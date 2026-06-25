// 微信小程序 API Mock
const mockStorage = new Map();

const wx = {
  getStorageSync: jest.fn((key) => {
    return mockStorage.get(key);
  }),
  setStorageSync: jest.fn((key, value) => {
    mockStorage.set(key, value);
  }),
  removeStorageSync: jest.fn((key) => {
    mockStorage.delete(key);
  }),
  clearStorageSync: jest.fn(() => {
    mockStorage.clear();
  }),
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  chooseMedia: jest.fn(),
  request: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'mockBase64Data')
  })),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  }
};

global.wx = wx;
global.mockStorage = mockStorage;

// 每个测试前清空存储
beforeEach(() => {
  mockStorage.clear();
  jest.clearAllMocks();
});

module.exports = { wx, mockStorage };