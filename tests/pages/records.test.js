// tests/pages/records.test.js
// pages/records/records.js 单元测试 - 记录页面模块

describe('pages/records/records.js - 记录页面模块', () => {
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

    require('../../pages/records/records.js');

    pageInstance = pageConfig;

    pageInstance.setData = jest.fn((data) => {
      Object.assign(pageInstance.data, data);
    });

    Object.keys(pageConfig).forEach(key => {
      if (typeof pageConfig[key] === 'function' && key !== 'setData') {
        pageInstance[key] = pageConfig[key].bind(pageInstance);
      }
    });
  });

  describe('loadData - 数据加载', () => {
    test('应从storage加载药品、记录和病例数据', () => {
      const mockMedicines = [{ id: 1, name: '阿莫西林' }];
      const mockRecords = [{ id: 1, medicineId: 1 }];
      const mockCases = [{ id: 1, content: '病例内容' }];

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce(mockRecords)
        .mockReturnValueOnce(mockCases);

      pageInstance.loadData();

      expect(wx.getStorageSync).toHaveBeenCalledWith('medicines');
      expect(wx.getStorageSync).toHaveBeenCalledWith('records');
      expect(wx.getStorageSync).toHaveBeenCalledWith('cases');
    });

    test('数据应按倒序排列', () => {
      const mockMedicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' },
        { id: 3, name: '药品3' }
      ];

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      pageInstance.loadData();

      expect(pageInstance.data.medicines[0].id).toBe(3);
      expect(pageInstance.data.medicines[2].id).toBe(1);
    });

    test('应处理空数据情况', () => {
      wx.getStorageSync.mockReturnValue(null);

      pageInstance.loadData();

      expect(pageInstance.data.medicines).toEqual([]);
      expect(pageInstance.data.records).toEqual([]);
      expect(pageInstance.data.cases).toEqual([]);
    });
  });

  describe('switchTab - Tab切换', () => {
    test('应正确切换到指定Tab', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {
            tab: 'records'
          }
        }
      };

      pageInstance.switchTab(mockEvent);

      expect(pageInstance.data.currentTab).toBe('records');
    });

    test('应切换到medicines Tab', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {
            tab: 'medicines'
          }
        }
      };

      pageInstance.switchTab(mockEvent);

      expect(pageInstance.data.currentTab).toBe('medicines');
    });

    test('应切换到cases Tab', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {
            tab: 'cases'
          }
        }
      };

      pageInstance.switchTab(mockEvent);

      expect(pageInstance.data.currentTab).toBe('cases');
    });
  });

  describe('goToDetail - 跳转详情页', () => {
    test('应传递正确的药品ID', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {
            id: 456
          }
        }
      };

      pageInstance.goToDetail(mockEvent);

      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=456'
      });
    });
  });

  describe('onLoad - 页面加载', () => {
    test('应初始化cases数组', () => {
      wx.getStorageSync.mockReturnValue([]);

      pageInstance.onLoad();

      expect(wx.setStorageSync).toHaveBeenCalledWith('cases', []);
    });

    test('cases已存在时不应覆盖', () => {
      const existingCases = [{ id: 1, content: '已有病例' }];
      wx.getStorageSync.mockReturnValue(existingCases);

      pageInstance.onLoad();

      expect(wx.setStorageSync).not.toHaveBeenCalled();
    });
  });
});
