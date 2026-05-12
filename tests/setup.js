const wx = require('./__mocks__/wx.mock.js');

beforeEach(() => {
  jest.clearAllMocks();
  wx.getStorageSync.mockReturnValue([]);
  wx.setStorageSync.mockClear();
  wx.showToast.mockClear();
  wx.showModal.mockClear();
});

module.exports = { wx };
