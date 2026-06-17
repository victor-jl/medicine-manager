/**
 * pages/index/index.js 单元测试
 * 
 * 测试覆盖：
 * 1. 过期日期计算逻辑（30天内即将过期）
 * 2. 今日服药记录筛选
 * 3. 数据加载和存储操作
 * 4. 边界条件处理
 */

// 模拟 Page 函数
global.Page = function(pageConfig) {
  global.__pageConfig__ = pageConfig;
};

// 加载页面代码
require('../pages/index/index');

describe('index 页面', () => {
  let page;

  beforeEach(() => {
    global.__mockStorage__ = {};
    jest.clearAllMocks();
    
    // 创建页面实例
    page = {
      data: {
        medicines: [],
        expiringMedicines: [],
        todayRecords: []
      },
      ...global.__pageConfig__
    };
  });

  describe('loadData - 数据加载', () => {
    test('应正确加载药品列表', () => {
      const mockMedicines = [
        { id: 1, name: '阿莫西林', expiryDate: '2024-12-01' },
        { id: 2, name: '布洛芬', expiryDate: '2025-06-01' }
      ];

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.medicines).toEqual(mockMedicines.slice(0, 5));
    });

    test('无药品时应返回空数组', () => {
      global.__mockStorage__ = {
        medicines: [],
        records: []
      };

      page.loadData();

      expect(page.data.medicines).toEqual([]);
    });

    test('药品超过5个时应截取前5个', () => {
      const mockMedicines = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `药品${i + 1}`,
        expiryDate: '2025-12-01'
      }));

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.medicines.length).toBe(5);
      expect(page.data.medicines[0].id).toBe(1);
    });

    test('存储未初始化时应返回空数组', () => {
      global.__mockStorage__ = {};

      page.loadData();

      expect(page.data.medicines).toEqual([]);
      expect(page.data.records).toEqual([]);
    });
  });

  describe('过期药品计算 - 30天内即将过期', () => {
    test('应识别30天内即将过期的药品', () => {
      // 当前时间：2024-06-15
      const now = new Date('2024-06-15');
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // 15天后过期（在30天内）
      const expiringSoon = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      
      const mockMedicines = [
        { id: 1, name: '即将过期药品', expiryDate: expiringSoon.toISOString().split('T')[0] },
        { id: 2, name: '远期过期药品', expiryDate: '2025-12-01' }
      ];

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(1);
      expect(page.data.expiringMedicines[0].name).toBe('即将过期药品');
    });

    test('已过期药品不应被列入即将过期', () => {
      const now = new Date('2024-06-15');
      const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      
      const mockMedicines = [
        { id: 1, name: '已过期药品', expiryDate: pastDate.toISOString().split('T')[0] },
        { id: 2, name: '正常药品', expiryDate: '2025-12-01' }
      ];

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(0);
    });

    test('超过30天过期的药品不应被列入', () => {
      const now = new Date('2024-06-15');
      const farFuture = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      
      const mockMedicines = [
        { id: 1, name: '远期药品', expiryDate: farFuture.toISOString().split('T')[0] }
      ];

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(0);
    });

    test('无有效期药品应被忽略', () => {
      const mockMedicines = [
        { id: 1, name: '无有效期药品', expiryDate: null },
        { id: 2, name: '无有效期药品2', expiryDate: '' },
        { id: 3, name: '无有效期药品3' }
      ];

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(0);
    });

    test('边界情况：恰好30天后过期应被列入', () => {
      const now = new Date('2024-06-15');
      const exactlyThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const mockMedicines = [
        { id: 1, name: '恰好30天', expiryDate: exactlyThirtyDays.toISOString().split('T')[0] }
      ];

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(1);
    });

    test('边界情况：恰好今天过期应被列入', () => {
      const now = new Date('2024-06-15');
      
      const mockMedicines = [
        { id: 1, name: '今天过期', expiryDate: now.toISOString().split('T')[0] }
      ];

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(1);
    });

    test('应处理多个即将过期的药品', () => {
      const now = new Date('2024-06-15');
      
      const mockMedicines = [
        { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 3, name: '药品C', expiryDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 4, name: '药品D', expiryDate: '2025-12-01' }
      ];

      global.__mockStorage__ = {
        medicines: mockMedicines,
        records: []
      };

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(3);
    });
  });

  describe('今日服药记录筛选', () => {
    test('应正确筛选今日服药记录', () => {
      const today = new Date('2024-06-15');
      const yesterday = new Date('2024-06-14');
      
      const mockRecords = [
        { id: 1, medicineName: '阿莫西林', takeTime: today.toLocaleString() },
        { id: 2, medicineName: '布洛芬', takeTime: yesterday.toLocaleString() }
      ];

      global.__mockStorage__ = {
        medicines: [],
        records: mockRecords
      };

      page.loadData();

      expect(page.data.todayRecords.length).toBe(1);
      expect(page.data.todayRecords[0].medicineName).toBe('阿莫西林');
    });

    test('无今日记录时应返回空数组', () => {
      const yesterday = new Date('2024-06-14');
      
      const mockRecords = [
        { id: 1, medicineName: '阿莫西林', takeTime: yesterday.toLocaleString() }
      ];

      global.__mockStorage__ = {
        medicines: [],
        records: mockRecords
      };

      page.loadData();

      expect(page.data.todayRecords).toEqual([]);
    });

    test('无记录时应返回空数组', () => {
      global.__mockStorage__ = {
        medicines: [],
        records: []
      };

      page.loadData();

      expect(page.data.todayRecords).toEqual([]);
    });

    test('应处理多条今日记录', () => {
      const today = new Date('2024-06-15');
      
      const mockRecords = [
        { id: 1, medicineName: '阿莫西林', takeTime: today.toLocaleString() },
        { id: 2, medicineName: '布洛芬', takeTime: today.toLocaleString() },
        { id: 3, medicineName: '维生素', takeTime: today.toLocaleString() }
      ];

      global.__mockStorage__ = {
        medicines: [],
        records: mockRecords
      };

      page.loadData();

      expect(page.data.todayRecords.length).toBe(3);
    });
  });

  describe('页面导航', () => {
    test('goToAdd 应跳转到添加页面', () => {
      page.goToAdd();
      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/add/add'
      });
    });

    test('goToRecords 应切换到记录页面', () => {
      page.goToRecords();
      expect(wx.switchTab).toHaveBeenCalledWith({
        url: '/pages/records/records'
      });
    });

    test('goToDetail 应跳转到详情页面并传递 id', () => {
      const mockEvent = {
        currentTarget: {
          dataset: { id: 123 }
        }
      };

      page.goToDetail(mockEvent);
      expect(wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=123'
      });
    });
  });

  describe('onShow 生命周期', () => {
    test('onShow 应调用 loadData', () => {
      const loadDataSpy = jest.spyOn(page, 'loadData');
      
      page.onShow();
      
      expect(loadDataSpy).toHaveBeenCalled();
    });
  });
});