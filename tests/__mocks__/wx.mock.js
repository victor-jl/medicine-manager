global.wx = {
  cloud: {
    init: jest.fn()
  },
  cloud: {
    callFunction: jest.fn()
  },
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
  switchTab: jest.fn()
};

global.mockWxRequest = (response) => {
  wx.request.mockImplementation((options) => {
    if (response.success) {
      options.success(response);
    } else {
      options.fail(response.error);
    }
  });
};

global.clearWxMocks = () => {
  Object.keys(wx).forEach(key => {
    if (typeof wx[key] === 'function' && key !== 'cloud') {
      wx[key].mockReset();
    }
  });
};
