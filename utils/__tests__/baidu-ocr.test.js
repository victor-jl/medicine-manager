const { extractMedicineName, getAccessToken } = require('../baidu-ocr');

describe('baidu-ocr', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractMedicineName', () => {
    it('should return empty string for empty input', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });

    it('should extract medicine name containing dosage forms', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toContain('阿莫西林');
      expect(extractMedicineName('布洛芬片')).toContain('布洛芬');
      expect(extractMedicineName('感冒灵颗粒')).toContain('感冒灵');
    });

    it('should extract medicine name with symptom keywords', () => {
      expect(extractMedicineName('退烧口服液')).toContain('退烧');
      expect(extractMedicineName('消炎软膏')).toContain('消炎');
      expect(extractMedicineName('胃药胶囊')).toContain('胃药');
    });

    it('should return first line when no keywords match', () => {
      const input = '未知药品\n规格: 10ml';
      const result = extractMedicineName(input);
      expect(result).toBe('未知药品');
    });

    it('should handle multi-line text correctly', () => {
      const input = `药品名称：布洛芬缓释胶囊
规格：0.4g
有效期至：2025-12-31`;
      const result = extractMedicineName(input);
      expect(result).toContain('布洛芬');
    });
  });

  describe('getAccessToken', () => {
    it('should return cached token when valid', async () => {
      const mockToken = 'cached_token_123';
      const futureExpires = Date.now() + 25 * 24 * 60 * 60 * 1000;

      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'baidu_access_token') return mockToken;
        if (key === 'baidu_token_expires') return futureExpires;
        return null;
      });

      const token = await getAccessToken();
      expect(token).toBe(mockToken);
      expect(global.wx.request).not.toHaveBeenCalled();
    });

    it('should fetch new token when cache expired', async () => {
      const expiredTime = Date.now() - 1000;
      const newToken = 'new_token_456';

      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'baidu_access_token') return 'old_token';
        if (key === 'baidu_token_expires') return expiredTime;
        return null;
      });

      global.wx.request.mockImplementation((options) => {
        if (options.success) {
          options.success({
            data: { access_token: newToken }
          });
        }
      });

      const token = await getAccessToken();
      expect(token).toBe(newToken);
      expect(global.wx.request).toHaveBeenCalled();
      expect(global.wx.setStorageSync).toHaveBeenCalledWith('baidu_access_token', newToken);
    });

    it('should fetch new token when cache is missing', async () => {
      const newToken = 'new_token_789';

      global.wx.getStorageSync.mockReturnValue(null);

      global.wx.request.mockImplementation((options) => {
        if (options.success) {
          options.success({
            data: { access_token: newToken }
          });
        }
      });

      const token = await getAccessToken();
      expect(token).toBe(newToken);
      expect(global.wx.request).toHaveBeenCalled();
    });

    it('should reject when token fetch fails', async () => {
      global.wx.getStorageSync.mockReturnValue(null);

      global.wx.request.mockImplementation((options) => {
        if (options.fail) {
          options.fail(new Error('Network error'));
        }
      });

      await expect(getAccessToken()).rejects.toThrow();
    });

    it('should reject when API returns error', async () => {
      global.wx.getStorageSync.mockReturnValue(null);

      global.wx.request.mockImplementation((options) => {
        if (options.success) {
          options.success({
            data: { error_description: 'invalid client_id' }
          });
        }
      });

      await expect(getAccessToken()).rejects.toThrow('获取token失败');
    });
  });
});