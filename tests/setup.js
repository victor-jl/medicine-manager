/**
 * Jest 测试环境配置
 * 模拟微信小程序 wx API
 */

const wxMock = {
  // 存储模拟
  _storage: {},
  _storageSync: {},

  getStorageSync: jest.fn((key) => {
    return wxMock._storageSync[key];
  }),

  setStorageSync: jest.fn((key, value) => {
    wxMock._storageSync[key] = value;
  }),

  // 文件系统管理器模拟
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => {
      return encoding === 'base64' ? 'mockBase64Data' : 'mockData';
    })
  })),

  // 云开发初始化
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },

  // 请求模拟
  request: jest.fn(),

  // UI 相关模拟
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),

  // 媒体选择模拟
  chooseMedia: jest.fn()
};

// 设置全局 wx
global.wx = wxMock;

// 清理函数
beforeEach(() => {
  jest.clearAllMocks();
  wxMock._storageSync = {};
});
