const { getAccessToken } = require('../../utils/baidu-ocr');

describe('baidu-ocr', () => {
  beforeEach(() => {
    global.wx = {
      getStorageSync: jest.fn().mockReturnValue(''),
      setStorageSync: jest.fn(),
      request: jest.fn()
    };
  });

  describe('getAccessToken', () => {
    it('should return cached token when it exists and not expired', async () => {
      const mockToken = 'cached_token_123';
      const mockExpires = Date.now() + 24 * 60 * 60 * 1000;

      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'baidu_access_token') return mockToken;
        if (key === 'baidu_token_expires') return mockExpires;
        return '';
      });

      const result = await getAccessToken();

      expect(result).toBe(mockToken);
      expect(global.wx.request).not.toHaveBeenCalled();
    });

    it('should request new token when cached token is expired', async () => {
      const mockToken = 'expired_token';
      const mockExpires = Date.now() - 24 * 60 * 60 * 1000;
      const newToken = 'new_access_token';

      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'baidu_access_token') return mockToken;
        if (key === 'baidu_token_expires') return mockExpires;
        return '';
      });

      global.wx.request.mockImplementation((options) => {
        options.success({ data: { access_token: newToken } });
      });

      const result = await getAccessToken();

      expect(result).toBe(newToken);
      expect(global.wx.request).toHaveBeenCalled();
      expect(global.wx.setStorageSync).toHaveBeenCalledWith('baidu_access_token', newToken);
    });

    it('should request new token when no cached token exists', async () => {
      const newToken = 'new_access_token';

      global.wx.getStorageSync.mockReturnValue('');

      global.wx.request.mockImplementation((options) => {
        options.success({ data: { access_token: newToken } });
      });

      const result = await getAccessToken();

      expect(result).toBe(newToken);
      expect(global.wx.request).toHaveBeenCalled();
    });

    it('should reject when API returns error', async () => {
      global.wx.getStorageSync.mockReturnValue('');

      global.wx.request.mockImplementation((options) => {
        options.success({ data: { error_description: 'invalid client id' } });
      });

      await expect(getAccessToken()).rejects.toThrow();
    });

    it('should reject when API request fails', async () => {
      global.wx.getStorageSync.mockReturnValue('');

      global.wx.request.mockImplementation((options) => {
        options.fail(new Error('network error'));
      });

      await expect(getAccessToken()).rejects.toThrow('network error');
    });

    it('should cache token for 25 days', async () => {
      const newToken = 'new_access_token';

      global.wx.getStorageSync.mockReturnValue('');

      global.wx.request.mockImplementation((options) => {
        options.success({ data: { access_token: newToken } });
      });

      await getAccessToken();

      const calls = global.wx.setStorageSync.mock.calls;
      const expiresCall = calls.find(call => call[0] === 'baidu_token_expires');
      expect(expiresCall).toBeDefined();

      const expiresTime = expiresCall[1];
      const expectedExpiry = Date.now() + 25 * 24 * 60 * 60 * 1000;
      expect(expiresTime).toBeGreaterThan(Date.now());
      expect(expiresTime).toBeLessThanOrEqual(expectedExpiry);
    });
  });
});