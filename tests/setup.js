// Jest 测试设置文件
// 模拟微信小程序 API

// 全局 Page 函数（用于微信小程序页面）
function Page(config) {
  const pageInstance = {};
  
  if (config.data) {
    pageInstance.data = { ...config.data };
  } else {
    pageInstance.data = {};
  }
  
  Object.keys(config).forEach(key => {
    if (key !== 'data') {
      pageInstance[key] = config[key];
    }
  });
  
  return pageInstance;
}

// 全局 App 函数（用于微信小程序应用）
function App(config) {
  const appInstance = {};
  
  if (config.onLaunch) {
    appInstance.onLaunch = config.onLaunch;
  }
  
  if (config.onShow) {
    appInstance.onShow = config.onShow;
  }
  
  if (config.globalData) {
    appInstance.globalData = { ...config.globalData };
  } else {
    appInstance.globalData = {};
  }
  
  return appInstance;
}

// 挂载到全局
global.Page = Page;
global.App = App;

global.wx = {
  // 存储 API
  getStorageSync: jest.fn((key) => {
    const storage = global.__wxStorage || {};
    return storage[key];
  }),
  
  setStorageSync: jest.fn((key, value) => {
    if (!global.__wxStorage) global.__wxStorage = {};
    global.__wxStorage[key] = value;
  }),
  
  // 文件系统管理器
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn((path, encoding) => {
      if (encoding === 'base64') {
        return 'dGVzdCBpbWFnZSBkYXRh'; // 'test image data' in base64
      }
      return 'test data';
    })
  })),
  
  // 导航 API
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  switchTab: jest.fn(),
  
  // UI API
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  
  // 选择媒体
  chooseMedia: jest.fn(),
  
  // 云开发
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  
  // 请求 API
  request: jest.fn(),
  
  // 应用生命周期
  getLaunchOptionsSync: jest.fn(() => ({
    scene: 1001,
    query: {}
  }))
};

// 清理函数
afterEach(() => {
  jest.clearAllMocks();
  global.__wxStorage = {};
});

// 全局测试工具函数
global.createMockStorage = (initialData = {}) => {
  global.__wxStorage = { ...initialData };
  return global.__wxStorage;
};

global.mockStorageSync = (key, value) => {
  if (!global.__wxStorage) global.__wxStorage = {};
  global.__wxStorage[key] = value;
};
