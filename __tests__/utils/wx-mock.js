/**
 * 微信小程序 API Mock
 * 用于单元测试
 */

// 模拟本地存储
const mockStorage = new Map();

// 模拟 wx 对象
const wx = {
  getStorageSync: jest.fn((key) => mockStorage.get(key)),
  setStorageSync: jest.fn((key, value) => mockStorage.set(key, value)),
  removeStorageSync: jest.fn((key) => mockStorage.delete(key)),
  clearStorageSync: jest.fn(() => mockStorage.clear()),
  
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  
  chooseMedia: jest.fn(),
  
  request: jest.fn(),
  
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => {
      if (encoding === 'base64') {
        return 'mocked-base64-data';
      }
      return 'mocked-file-data';
    })
  })),
  
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  }
};

// 清空存储
function clearMockStorage() {
  mockStorage.clear();
}

// 设置存储数据
function setMockStorageData(key, value) {
  mockStorage.set(key, value);
}

// 获取存储数据
function getMockStorageData(key) {
  return mockStorage.get(key);
}

module.exports = {
  wx,
  clearMockStorage,
  setMockStorageData,
  getMockStorageData
};