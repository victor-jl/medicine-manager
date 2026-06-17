// 微信小程序 API Mock
global.wx = {
  getStorageSync: jest.fn((key) => {
    const store = global.__mockStorage__ || {};
    return store[key];
  }),
  setStorageSync: jest.fn((key, value) => {
    if (!global.__mockStorage__) {
      global.__mockStorage__ = {};
    }
    global.__mockStorage__[key] = value;
  }),
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  chooseMedia: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'mock-base64-data')
  })),
  request: jest.fn(),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  }
};

// 每个测试前重置 mock 存储
beforeEach(() => {
  global.__mockStorage__ = {};
  jest.clearAllMocks();
});

// Date Mock - 固定时间便于测试
const MOCK_DATE = new Date('2024-06-15T12:00:00');
global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      super(MOCK_DATE);
    } else {
      super(...args);
    }
  }
  static now() {
    return MOCK_DATE.getTime();
  }
};