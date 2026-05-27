global.wx = {
  getStorageSync: jest.fn((key) => {
    const mockData = {
      medicines: [],
      records: [],
      cases: []
    };
    return mockData[key] || null;
  }),
  setStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  chooseMedia: jest.fn(),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  request: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'base64encodedimage')
  })),
  showLoading: jest.fn(),
  hideLoading: jest.fn()
};
