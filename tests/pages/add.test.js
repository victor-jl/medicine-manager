// tests/pages/add.test.js
// pages/add/add.js 单元测试 - 添加药品页面模块

describe('pages/add/add.js - 添加药品页面模块', () => {
  let pageConfig = null;
  let pageInstance = null;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    pageConfig = null;
    pageInstance = null;

    global.Page = jest.fn((config) => {
      pageConfig = config;
      return config;
    });

    require('../../pages/add/add.js');

    pageInstance = {
      data: { ...pageConfig.data },
      setData: jest.fn((data) => {
        Object.assign(pageInstance.data, data);
      })
    };

    Object.keys(pageConfig).forEach(key => {
      if (typeof pageConfig[key] === 'function') {
        pageInstance[key] = pageConfig[key].bind(pageInstance);
      }
    });
  });

  describe('onLoad - 页面加载', () => {
    test('应保存默认API配置', () => {
      pageInstance.onLoad();

      expect(wx.setStorageSync).toHaveBeenCalledWith('baiduApiKey', 'AWWs4izOHOWa7jhiKkCASDts');
      expect(wx.setStorageSync).toHaveBeenCalledWith('baiduSecretKey', 'fbxKdLTrl5gz1OmLtTUD9UcOLopQP0ru');
    });
  });

  describe('takePhoto - 拍照', () => {
    test('应调用微信拍照API', () => {
      pageInstance.takePhoto();

      expect(wx.chooseMedia).toHaveBeenCalledWith({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        success: expect.any(Function)
      });
    });

    test('拍照成功应保存照片路径', () => {
      const mockFilePath = '/mock/photo.jpg';
      wx.chooseMedia.mockImplementation((options) => {
        options.success({
          tempFiles: [{ tempFilePath: mockFilePath }]
        });
      });

      pageInstance.takePhoto();

      expect(pageInstance.data.photos).toContain(mockFilePath);
    });
  });

  describe('chooseFromAlbum - 从相册选择', () => {
    test('应调用微信相册API', () => {
      pageInstance.chooseFromAlbum();

      expect(wx.chooseMedia).toHaveBeenCalledWith({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: expect.any(Function)
      });
    });
  });

  describe('saveApiConfig - 保存API配置', () => {
    test('应保存API密钥', () => {
      pageInstance.setData({
        baiduApiKey: 'new_api_key',
        baiduSecretKey: 'new_secret_key'
      });

      pageInstance.saveApiConfig();

      expect(wx.setStorageSync).toHaveBeenCalledWith('baiduApiKey', 'new_api_key');
      expect(wx.setStorageSync).toHaveBeenCalledWith('baiduSecretKey', 'new_secret_key');
    });

    test('应显示保存成功提示', () => {
      pageInstance.saveApiConfig();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '配置已保存',
        icon: 'success'
      });
    });
  });

  describe('saveMedicine - 保存药品', () => {
    test('名称为空时应提示输入名称', () => {
      pageInstance.setData({ name: '' });

      pageInstance.saveMedicine();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入药品名称',
        icon: 'none'
      });
    });

    test('名称有效时应保存药品', () => {
      pageInstance.setData({
        name: '阿莫西林',
        expiryDate: '2026-06-01',
        specification: '0.25g'
      });

      pageInstance.saveMedicine();

      expect(wx.setStorageSync).toHaveBeenCalledWith('medicines', expect.any(Array));
    });

    test('应生成唯一ID', () => {
      pageInstance.setData({ name: '阿莫西林' });

      pageInstance.saveMedicine();

      const savedMedicines = wx.setStorageSync.mock.calls[0][1];
      expect(savedMedicines[0].id).toBeDefined();
    });

    test('应追加到现有列表', () => {
      const existingMedicines = [{ id: 1, name: '布洛芬' }];
      wx.getStorageSync.mockReturnValue(existingMedicines);

      pageInstance.setData({ name: '阿莫西林' });
      pageInstance.saveMedicine();

      const savedMedicines = wx.setStorageSync.mock.calls[0][1];
      expect(savedMedicines).toHaveLength(2);
    });
  });

  describe('recordTake - 记录服药', () => {
    test('药品名称为空时应提示', () => {
      pageInstance.setData({ name: '' });

      pageInstance.recordTake();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请先添加药品',
        icon: 'none'
      });
    });

    test('名称有效时应创建服药记录', () => {
      pageInstance.setData({
        name: '阿莫西林',
        id: 123
      });

      pageInstance.recordTake();

      expect(wx.setStorageSync).toHaveBeenCalledWith('records', expect.any(Array));
    });

    test('应显示记录成功提示', () => {
      pageInstance.setData({ name: '阿莫西林' });

      pageInstance.recordTake();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '记录成功',
        icon: 'success'
      });
    });
  });

  describe('toggleApiConfig - 切换API配置显示', () => {
    test('应切换showApiConfig状态', () => {
      pageInstance.setData({ showApiConfig: false });

      pageInstance.toggleApiConfig();

      expect(pageInstance.data.showApiConfig).toBe(true);

      pageInstance.toggleApiConfig();

      expect(pageInstance.data.showApiConfig).toBe(false);
    });
  });
});
