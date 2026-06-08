// 微信小程序 API Mock
const mockStorage = {};
const mockRequests = {};

// 模拟 wx 对象
global.wx = {
  // 存储 API
  getStorageSync: jest.fn((key) => mockStorage[key]),
  setStorageSync: jest.fn((key, value) => {
    mockStorage[key] = value;
  }),
  removeStorageSync: jest.fn((key) => {
    delete mockStorage[key];
  }),
  clearStorageSync: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  }),

  // 网络 API
  request: jest.fn((options) => {
    const { url, method, data, success, fail } = options;
    // 默认返回模拟响应
    if (url.includes('oauth/2.0/token')) {
      success && success({
        data: {
          access_token: 'mock_access_token_' + Date.now(),
          expires_in: 2592000
        }
      });
    } else if (url.includes('ocr/v1/general_basic')) {
      success && success({
        data: {
          words_result: [
            { words: '阿莫西林胶囊' },
            { words: '有效期至2025年12月' }
          ]
        }
      });
    } else {
      fail && fail({ errMsg: 'request:fail' });
    }
  }),

  // 文件系统 API
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => {
      if (encoding === 'base64') {
        return 'mock_base64_image_data';
      }
      return '';
    })
  })),

  // 云开发 API
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn((options) => {
      const { success } = options;
      success && success({
        result: { text: '识别结果文本' }
      });
    })
  },

  // UI 交互 API
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  chooseMedia: jest.fn()
};

// 清理 mock 存储的辅助函数
global.clearMockStorage = () => {
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
};

// 设置 mock 存储的辅助函数
global.setMockStorage = (key, value) => {
  mockStorage[key] = value;
};

// 获取 mock 存储的辅助函数
global.getMockStorage = (key) => {
  return mockStorage[key];
};

// 模拟 Date.now() 返回固定值用于测试
global.mockDateNow = (timestamp) => {
  const originalDateNow = Date.now;
  Date.now = jest.fn(() => timestamp);
  return () => {
    Date.now = originalDateNow;
  };
};
