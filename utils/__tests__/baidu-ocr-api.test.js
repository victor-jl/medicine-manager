global.wx = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  request: jest.fn()
};

const { getAccessToken } = require('../baidu-ocr');

describe('baidu-ocr.js - API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return cached token when available', async () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'baidu_access_token') return 'cached_token';
        if (key === 'baidu_token_expires') return Date.now() + 100000;
        return null;
      });

      const token = await getAccessToken();
      expect(token).toBe('cached_token');
      expect(wx.request).not.toHaveBeenCalled();
    });

    it('should fetch new token when cache is expired', async () => {
      wx.getStorageSync.mockImplementation((key) => {
        if (key === 'baidu_access_token') return 'cached_token';
        if (key === 'baidu_token_expires') return Date.now() - 100000;
        return null;
      });

      const mockSuccess = jest.fn();
      wx.request.mockImplementation((options) => {
        options.success({ data: { access_token: 'new_token' } });
      });

      const token = await getAccessToken();
      expect(token).toBe('new_token');
      expect(wx.request).toHaveBeenCalled();
      expect(wx.setStorageSync).toHaveBeenCalledWith('baidu_access_token', 'new_token');
    });

    it('should reject when token fetch fails', async () => {
      wx.getStorageSync.mockReturnValue(null);

      const mockFail = jest.fn();
      wx.request.mockImplementation((options) => {
        options.fail({ errMsg: 'network error' });
      });

      await expect(getAccessToken()).rejects.toMatchObject({ errMsg: 'network error' });
    });

    it('should reject when response has error description', async () => {
      wx.getStorageSync.mockReturnValue(null);

      wx.request.mockImplementation((options) => {
        options.success({ data: { error_description: 'invalid credentials' } });
      });

      await expect(getAccessToken()).rejects.toThrow('获取token失败');
    });
  });
});