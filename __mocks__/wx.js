const storage = {};

const wx = {
  getStorageSync: jest.fn((key) => {
    return storage[key] || null;
  }),
  setStorageSync: jest.fn((key, value) => {
    storage[key] = value;
  }),
  request: jest.fn((options) => {
    if (options.success) {
      options.success({
        data: {
          access_token: 'mock_token',
          words_result: [{ words: '测试药品' }]
        }
      });
    }
  }),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn((options) => {
      if (options.success) {
        options.success({
          result: { text: '测试药品' }
        });
      }
    })
  },
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => 'mock_base64_data')
  })),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  chooseMedia: jest.fn()
};

module.exports = wx;
