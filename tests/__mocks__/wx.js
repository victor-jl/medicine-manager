global.wx = {
  getStorageSync: (key) => {
    const storage = {};
    return storage[key] || null;
  },
  setStorageSync: (key, value) => {
    const storage = {};
    storage[key] = value;
  },
  cloud: {
    init: () => {},
    callFunction: () => {}
  },
  request: () => {},
  getFileSystemManager: () => ({
    readFileSync: (path, encoding) => 'test-base64-data'
  })
};