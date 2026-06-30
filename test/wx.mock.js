// test/wx.mock.js
// 微信小程序 API Mock

// 模拟本地存储
const storage = new Map();

// 模拟 wx 对象
const wx = {
  storage: storage,

  // 存储相关
  getStorageSync(key) {
    return storage.get(key);
  },

  setStorageSync(key, value) {
    storage.set(key, value);
  },

  removeStorageSync(key) {
    storage.delete(key);
  },

  clearStorageSync() {
    storage.clear();
  },

  // UI 相关
  showToast(options) {
    console.log('showToast:', options);
  },

  showModal(options) {
    console.log('showModal:', options);
    // 模拟用户点击确认
    if (options.success) {
      options.success({ confirm: true, cancel: false });
    }
  },

  showLoading(options) {
    console.log('showLoading:', options);
  },

  hideLoading() {
    console.log('hideLoading');
  },

  // 导航相关
  navigateTo(options) {
    console.log('navigateTo:', options);
    if (options.success) {
      options.success({});
    }
  },

  navigateBack(options) {
    console.log('navigateBack:', options);
    if (options.success) {
      options.success({});
    }
  },

  switchTab(options) {
    console.log('switchTab:', options);
    if (options.success) {
      options.success({});
    }
  },

  // 媒体相关
  chooseMedia(options) {
    console.log('chooseMedia:', options);
    // 模拟选择图片成功
    if (options.success) {
      options.success({
        tempFiles: [
          { tempFilePath: '/tmp/test-image.jpg' }
        ]
      });
    }
  },

  // 文件系统
  getFileSystemManager() {
    return {
      readFileSync(filePath, encoding) {
        return 'base64encodedstring';
      },
      writeFileSync(filePath, data, encoding) {
        console.log('writeFileSync:', filePath);
      }
    };
  },

  // 网络请求
  request(options) {
    console.log('request:', options.url);
    // 模拟成功响应
    if (options.success) {
      setTimeout(() => {
        options.success({
          data: {
            access_token: 'mock_token_12345',
            words_result: [
              { words: '阿莫西林胶囊' },
              { words: '规格：0.5g*24粒' },
              { words: '有效期至2025-12-31' }
            ]
          }
        });
      }, 100);
    }
  },

  // 云开发
  cloud: {
    init() {
      console.log('cloud.init');
    },
    callFunction(options) {
      console.log('cloud.callFunction:', options.name);
      if (options.success) {
        options.success({
          result: {
            text: '识别的文本内容'
          }
        });
      }
    }
  }
};

// 全局注入
global.wx = wx;

// 清理存储的辅助函数
function clearStorage() {
  storage.clear();
}

module.exports = {
  wx,
  clearStorage
};