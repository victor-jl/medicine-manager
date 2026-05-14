global.wx = {
  cloud: {
    init: jest.fn()
  },
  callFunction: jest.fn(),
  getStorageSync: jest.fn((key) => {
    const storage = {
      'medicines': [],
      'records': [],
      'cases': [],
      'baidu_access_token': 'test_token',
      'baidu_token_expires': Date.now() + 86400000,
      'baiduApiKey': 'test_api_key',
      'baiduSecretKey': 'test_secret_key'
    };
    return storage[key];
  }),
  setStorageSync: jest.fn(),
  request: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  showModal: jest.fn(),
  chooseMedia: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'base64encodedstring')
  }))
};
