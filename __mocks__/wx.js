// __mocks__/wx.js
// 微信小程序 API Mock

const storage = {};

const wx = {
  storage: storage,

  getStorageSync: jest.fn((key) => {
    return storage[key] || null;
  }),

  setStorageSync: jest.fn((key, value) => {
    storage[key] = value;
  }),

  removeStorageSync: jest.fn((key) => {
    delete storage[key];
  }),

  clearStorageSync: jest.fn(() => {
    Object.keys(storage).forEach(key => delete storage[key]);
  }),

  showToast: jest.fn((options) => {
    return Promise.resolve();
  }),

  showModal: jest.fn((options) => {
    return Promise.resolve({ confirm: true, cancel: false });
  }),

  showLoading: jest.fn(() => {
    return Promise.resolve();
  }),

  hideLoading: jest.fn(() => {
    return Promise.resolve();
  }),

  navigateTo: jest.fn(() => {
    return Promise.resolve();
  }),

  navigateBack: jest.fn(() => {
    return Promise.resolve();
  }),

  switchTab: jest.fn(() => {
    return Promise.resolve();
  }),

  chooseMedia: jest.fn((options) => {
    return Promise.resolve({
      tempFiles: [{
        tempFilePath: '/tmp/test-image.jpg'
      }]
    });
  }),

  request: jest.fn((options) => {
    return Promise.resolve({
      data: {
        access_token: 'mock_token',
        words_result: [
          { words: '阿莫西林胶囊' },
          { words: '有效期至2025-12-31' }
        ]
      }
    });
  }),

  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => {
      return 'mock_base64_data';
    })
  })),

  cloud: {
    init: jest.fn(),
    callFunction: jest.fn((options) => {
      return Promise.resolve({
        result: {
          text: '阿莫西林胶囊\n有效期至2025-12-31'
        }
      });
    })
  }
};

// 清空 storage 的辅助函数
wx.clearMockStorage = () => {
  Object.keys(storage).forEach(key => delete storage[key]);
};

// 设置 mock storage 数据
wx.setMockStorage = (key, value) => {
  storage[key] = value;
};

// 获取 mock storage 数据
wx.getMockStorage = (key) => {
  return storage[key];
};

global.wx = wx;

module.exports = wx;