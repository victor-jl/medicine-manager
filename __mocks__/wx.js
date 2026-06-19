// Mock WeChat API for testing
const storage = {};

global.wx = {
  // Storage mocks
  getStorageSync: jest.fn((key) => storage[key]),
  setStorageSync: jest.fn((key, value) => {
    storage[key] = value;
  }),

  // File system manager mock
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => {
      return 'mock-base64-data';
    })
  })),

  // Request mock
  request: jest.fn(),

  // Navigation mocks
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),

  // Media mocks
  chooseMedia: jest.fn(),

  // UI mocks
  showToast: jest.fn(),
  showModal: jest.fn(),

  // Cloud mock
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },

  // Clear storage helper for tests
  __clearStorage: () => {
    Object.keys(storage).forEach(key => delete storage[key]);
  },
  __getStorage: () => storage
};

// Export for direct manipulation in tests
module.exports = global.wx;
