/**
 * Jest测试环境设置
 * 模拟微信小程序API
 */

// 模拟存储
const mockStorage = new Map();

// 模拟微信小程序全局对象
global.wx = {
  // 本地存储API
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

  // 文件系统API
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => {
      if (encoding === 'base64') {
        return 'mocked-base64-content';
      }
      return 'mocked-file-content';
    })
  })),

  // 网络请求API
  request: jest.fn((options) => {
    // 默认行为，可以在具体测试中覆盖
    if (options.success) {
      options.success({ data: {} });
    }
  }),

  // 云函数API
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn((options) => {
      if (options.success) {
        options.success({ result: {} });
      }
    })
  },

  // UI反馈API
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),

  // 导航API
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),

  // 媒体选择API
  chooseMedia: jest.fn((options) => {
    if (options.success) {
      options.success({
        tempFiles: [{ tempFilePath: '/tmp/test.jpg' }]
      });
    }
  })
};

// 模拟Date.now()返回固定时间戳
jest.spyOn(Date, 'now').mockImplementation(() => 1704067200000); // 2024-01-01 00:00:00

// 每个测试前清空存储
beforeEach(() => {
  mockStorage.clear();
  jest.clearAllMocks();
});

// 导出mockStorage供测试使用
global.__mockStorage__ = mockStorage;