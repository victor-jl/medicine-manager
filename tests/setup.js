// tests/setup.js
// 微信小程序API Mock

const mockStorage = {};

const createPageMock = () => {
  const pageInstance = {
    data: {},
    setData: jest.fn((data) => {
      pageInstance.data = { ...pageInstance.data, ...data };
    })
  };
  return pageInstance;
};

global.Page = jest.fn((config) => {
  const instance = createPageMock();
  Object.assign(instance, config);
  return instance;
});

global.Component = jest.fn((config) => {
  const instance = {
    data: config.data || {},
    setData: jest.fn((data) => {
      instance.data = { ...instance.data, ...data };
    }),
    ...config
  };
  return instance;
});

global.wx = {
  getStorageSync: jest.fn((key) => {
    return mockStorage[key] || null;
  }),
  setStorageSync: jest.fn((key, value) => {
    mockStorage[key] = value;
  }),
  removeStorageSync: jest.fn((key) => {
    delete mockStorage[key];
  }),
  clearStorageSync: jest.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  }),
  navigateTo: jest.fn((options) => {
    console.log('Mock navigateTo:', options.url);
  }),
  navigateBack: jest.fn((options) => {
    console.log('Mock navigateBack:', options);
  }),
  switchTab: jest.fn((options) => {
    console.log('Mock switchTab:', options.url);
  }),
  showToast: jest.fn((options) => {
    console.log('Mock showToast:', options);
  }),
  showModal: jest.fn((options) => {
    console.log('Mock showModal:', options);
    if (options.success) {
      options.success({ confirm: true, cancel: false });
    }
  }),
  showLoading: jest.fn((options) => {
    console.log('Mock showLoading:', options);
  }),
  hideLoading: jest.fn(() => {
    console.log('Mock hideLoading');
  }),
  chooseMedia: jest.fn((options) => {
    console.log('Mock chooseMedia');
    if (options.success) {
      options.success({
        tempFiles: [{
          tempFilePath: '/mock/image.jpg'
        }]
      });
    }
  }),
  request: jest.fn((options) => {
    console.log('Mock request:', options.url);
    if (options.success) {
      options.success({ data: {} });
    }
  }),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'mock_base64_data')
  })),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  }
};

global.__testUtils__ = {
  clearMockStorage: () => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    jest.clearAllMocks();
  },
  getMockStorage: () => mockStorage,
  createPageMock
};

beforeEach(() => {
  jest.clearAllMocks();
  global.__testUtils__.clearMockStorage();
  jest.clearAllMocks();
  global.wx = {
    ...global.wx,
    getStorageSync: jest.fn((key) => mockStorage[key] || null),
    setStorageSync: jest.fn((key, value) => { mockStorage[key] = value; }),
    navigateTo: jest.fn(),
    navigateBack: jest.fn(),
    switchTab: jest.fn(),
    showToast: jest.fn(),
    showModal: jest.fn((options) => {
      if (options.success) options.success({ confirm: true, cancel: false });
    }),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    chooseMedia: jest.fn((options) => {
      if (options.success) options.success({ tempFiles: [{ tempFilePath: '/mock/image.jpg' }] });
    }),
    request: jest.fn(),
    getFileSystemManager: jest.fn(() => ({
      readFileSync: jest.fn(() => 'mock_base64_data')
    })),
    cloud: {
      init: jest.fn(),
      callFunction: jest.fn()
    }
  };
});
