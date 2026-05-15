// tests/testUtils.js
// 微信小程序测试工具

let pageConfigStorage = [];

global.Page = jest.fn((config) => {
  pageConfigStorage.push(config);
  return config;
});

export function getPageConfig() {
  return pageConfigStorage[pageConfigStorage.length - 1];
}

export function createPageInstance(config) {
  const instance = {
    data: { ...(config.data || {}) },
    setData: jest.fn(function(data) {
      this.data = { ...this.data, ...data };
    }.bind(instance))
  };

  Object.keys(config).forEach(key => {
    if (typeof config[key] === 'function') {
      instance[key] = config[key].bind(instance);
    }
  });

  return instance;
}

export function resetPageConfig() {
  pageConfigStorage = [];
  jest.clearAllMocks();
}
