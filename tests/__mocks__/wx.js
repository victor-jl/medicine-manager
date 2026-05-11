const mockStorage = {};
const mockWx = {
  getStorageSync: (key) => mockStorage[key],
  setStorageSync: (key, value) => { mockStorage[key] = value; },
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  navigateBack: jest.fn(),
  chooseMedia: jest.fn(),
  getFileSystemManager: () => ({
    readFileSync: jest.fn().mockReturnValue('')
  }),
  request: jest.fn()
};

global.wx = mockWx;
global.Page = jest.fn();
global.App = jest.fn();

module.exports = { mockStorage, mockWx };
