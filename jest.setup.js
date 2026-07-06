global.wx = {
  getStorageSync: jest.fn(() => null),
  setStorageSync: jest.fn(),
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn((options) => {
      if (options.success) {
        options.success({ result: { text: '' } });
      }
    })
  },
  request: jest.fn((options) => {
    if (options.success) {
      options.success({ data: {} });
    }
  }),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'dummy_base64')
  }))
};