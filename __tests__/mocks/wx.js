/**
 * 微信小程序 API Mock
 * 用于测试环境模拟微信API
 */

const mockStorage = new Map();

const wx = {
  // 存储 API
  getStorageSync: jest.fn((key) => {
    return mockStorage.get(key);
  }),
  
  setStorageSync: jest.fn((key, value) => {
    mockStorage.set(key, value);
    return true;
  }),
  
  removeStorageSync: jest.fn((key) => {
    mockStorage.delete(key);
  }),
  
  clearStorageSync: jest.fn(() => {
    mockStorage.clear();
  }),
  
  // 文件系统
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => {
      if (encoding === 'base64') {
        return Buffer.from('mock-image-data').toString('base64');
      }
      return 'mock-file-content';
    }),
    writeFile: jest.fn()
  })),
  
  // 网络 API
  request: jest.fn((options) => {
    return new Promise((resolve, reject) => {
      // 模拟成功响应
      if (options.url.includes('oauth/2.0/token')) {
        setTimeout(() => {
          if (options.success) {
            options.success({
              data: {
                access_token: 'mock_access_token_12345',
                expires_in: 2592000
              }
            });
          }
          resolve({
            data: {
              access_token: 'mock_access_token_12345',
              expires_in: 2592000
            }
          });
        }, 10);
      } else if (options.url.includes('ocr/v1/general_basic')) {
        setTimeout(() => {
          if (options.success) {
            options.success({
              data: {
                words_result: [
                  { words: '阿莫西林胶囊' },
                  { words: '规格: 0.5g' },
                  { words: '有效期至 2025-12-31' }
                ]
              }
            });
          }
          resolve({
            data: {
              words_result: [
                { words: '阿莫西林胶囊' },
                { words: '规格: 0.5g' },
                { words: '有效期至 2025-12-31' }
              ]
            }
          });
        }, 10);
      } else {
        setTimeout(() => {
          reject(new Error('Network error'));
        }, 10);
      }
    });
  }),
  
  // UI 反馈 API
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateBack: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  
  // 媒体 API
  chooseMedia: jest.fn((options) => {
    return new Promise((resolve) => {
      if (options.success) {
        options.success({
          tempFiles: [
            { tempFilePath: '/tmp/mock-image.jpg' }
          ]
        });
      }
      resolve({
        tempFiles: [
          { tempFilePath: '/tmp/mock-image.jpg' }
        ]
      });
    });
  }),
  
  // 云开发 API
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn((options) => {
      return new Promise((resolve, reject) => {
        if (options.name === 'ocr') {
          if (options.success) {
            options.success({
              result: {
                text: '阿莫西林胶囊\n规格: 0.5g'
              }
            });
          }
          resolve({
            result: {
              text: '阿莫西林胶囊\n规格: 0.5g'
            }
          });
        } else {
          reject(new Error('Unknown cloud function'));
        }
      });
    })
  }
};

// 测试辅助函数
function resetMockStorage() {
  mockStorage.clear();
}

function setMockStorage(key, value) {
  mockStorage.set(key, value);
}

function getMockStorage() {
  return mockStorage;
}

module.exports = {
  wx,
  resetMockStorage,
  setMockStorage,
  getMockStorage
};