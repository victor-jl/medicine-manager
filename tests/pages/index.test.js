// tests/pages/index.test.js
// pages/index/index.js 单元测试 - 首页模块

describe('pages/index/index.js - 首页模块', () => {
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

    require('../../pages/index/index.js');

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

  describe('loadData - 数据加载', () => {
    test('应从storage加载药品和记录数据', () => {
      const mockMedicines = [
        { id: 1, name: '阿莫西林', expiryDate: '2026-06-01' }
      ];
      const mockRecords = [
        { id: 1, medicineId: 1, takeTime: new Date().toLocaleString() }
      ];

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce(mockRecords);

      pageInstance.loadData();

      expect(wx.getStorageSync).toHaveBeenCalledWith('medicines');
      expect(wx.getStorageSync).toHaveBeenCalledWith('records');
    });

    test('应处理空数据情况', () => {
      wx.getStorageSync.mockReturnValue(null);

      pageInstance.loadData();

      expect(pageInstance.data.medicines).toEqual([]);
      expect(pageInstance.data.expiringMedicines).toEqual([]);
      expect(pageInstance.data.todayRecords).toEqual([]);
    });

    test('应正确筛选30天内即将过期的药品', () => {
      const now = new Date();
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const mockMedicines = [
        { id: 1, name: '药品A', expiryDate: in15Days },
        { id: 2, name: '药品B', expiryDate: in45Days },
        { id: 3, name: '药品C', expiryDate: pastDate }
      ];

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce([]);

      pageInstance.loadData();

      expect(pageInstance.data.expiringMedicines).toHaveLength(1);
      expect(pageInstance.data.expiringMedicines[0].name).toBe('药品A');
    });

    test('应正确筛选今日服药记录', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const mockRecords = [
        { id: 1, medicineId: 1, takeTime: today.toLocaleString() },
        { id: 2, medicineId: 2, takeTime: yesterday.toLocaleString() }
      ];

      wx.getStorageSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce(mockRecords);

      pageInstance.loadData();

      expect(pageInstance.data.todayRecords).toHaveLength(1);
      expect(pageInstance.data.todayRecords[0].id).toBe(1);
    });

    test('应跳过没有有效期字段的药品', () => {
      const mockMedicines = [
        { id: 1, name: '药品A', expiryDate: '' },
        { id: 2, name: '药品B', expiryDate: '2026-06-01' }
      ];

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce([]);

      pageInstance.loadData();

      expect(pageInstance.data.expiringMedicines).toHaveLength(1);
      expect(pageInstance.data.expiringMedicines[0].name).toBe('药品B');
    });

    test('首页应仅显示前5条药品', () => {
      const mockMedicines = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `药品${i + 1}`,
        expiryDate: ''
      }));

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce([]);

      pageInstance.loadData();

      expect(pageInstance.data.medicines).toHaveLength(5);
    });
  });

  describe('goToAdd - 跳转添加页面', () => {
    test('应正确导航到添加页面', () => {
      pageInstance.goToAdd();

      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/add/add'
      });
    });
  });

  describe('goToRecords - 跳转记录页面', () => {
    test('应正确切换到记录Tab', () => {
      pageInstance.goToRecords();

      expect(wx.switchTab).toHaveBeenCalledWith({
        url: '/pages/records/records'
      });
    });
  });

  describe('goToDetail - 跳转详情页面', () => {
    test('应传递正确的药品ID参数', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {
            id: 123
          }
        }
      };

      pageInstance.goToDetail(mockEvent);

      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=123'
      });
    });

    test('应处理不同类型的ID值', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {
            id: 'medicine-001'
          }
        }
      };

      pageInstance.goToDetail(mockEvent);

      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=medicine-001'
      });
    });
  });

  describe('onShow - 页面显示', () => {
    test('onShow应触发数据加载', () => {
      wx.getStorageSync.mockReturnValue(null);

      pageInstance.onShow();

      expect(wx.getStorageSync).toHaveBeenCalled();
    });
  });
});
