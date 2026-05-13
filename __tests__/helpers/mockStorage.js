module.exports = {
  createMocks: () => {
    global.wx = {
      getStorageSync: jest.fn((key) => {
        const storage = {
          medicines: [],
          records: [],
          cases: [],
          baiduApiKey: 'test_api_key',
          baiduSecretKey: 'test_secret_key'
        };
        return storage[key] || null;
      }),
      setStorageSync: jest.fn(),
      showToast: jest.fn(),
      showModal: jest.fn(),
      navigateTo: jest.fn(),
      navigateBack: jest.fn(),
      switchTab: jest.fn(),
      chooseMedia: jest.fn(),
      request: jest.fn(),
      getFileSystemManager: jest.fn(() => ({
        readFileSync: jest.fn(() => 'base64encodedcontent')
      }))
    };
  }
};
