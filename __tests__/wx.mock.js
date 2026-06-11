// 微信 API Mock
global.wx = {
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  getStorageSync: jest.fn((key) => {
    const storage = {
      'baidu_token': { access_token: 'test_token', expires: Date.now() + 86400000 },
      'medicines': [],
      'records': [],
      'cases': []
    };
    return storage[key];
  }),
  setStorageSync: jest.fn(),
  request: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'base64data')
  })),
  chooseMedia: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  hideLoading: jest.fn()
};
