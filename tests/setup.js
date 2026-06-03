global.wx = {
  getStorageSync: (key) => {
    if (!global.__wxStorage) {
      global.__wxStorage = {};
    }
    return global.__wxStorage[key] || '';
  },
  setStorageSync: (key, value) => {
    if (!global.__wxStorage) {
      global.__wxStorage = {};
    }
    global.__wxStorage[key] = value;
  },
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  request: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn()
  })),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  navigateBack: jest.fn(),
  chooseMedia: jest.fn()
};

beforeEach(() => {
  global.__wxStorage = {};
});