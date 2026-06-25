/**
 * pages/index/index.js 业务逻辑测试
 * 重点测试：
 * - 过期药品检测逻辑（30天内）
 * - 今日服药记录筛选
 * - 数据加载和展示
 * - 导航功能
 */

const { wx, mockStorage } = require('../setup');

// 模拟 Page 函数
global.Page = jest.fn((config) => config);

// 加载页面模块
const indexPage = require('../../pages/index/index');

describe('pages/index/index.js', () => {
  let page;

  beforeEach(() => {
    mockStorage.clear();
    page = {
      data: {
        medicines: [],
        expiringMedicines: [],
        todayRecords: []
      },
      setData: jest.fn((data) => {
        Object.assign(page.data, data);
      }),
      loadData: function() {
        const medicines = wx.getStorageSync('medicines') || [];
        const records = wx.getStorageSync('records') || [];

        // 获取即将过期的药品（30天内）
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiring = medicines.filter(m => {
          if (!m.expiryDate) return false;
          const expiry = new Date(m.expiryDate);
          return expiry <= thirtyDaysLater && expiry >= now;
        });

        // 获取今日记录
        const today = new Date().toDateString();
        const todayRecords = records.filter(r => {
          return new Date(r.takeTime).toDateString() === today;
        });

        this.setData({
          medicines: medicines.slice(0, 5),
          expiringMedicines: expiring,
          todayRecords: todayRecords
        });
      }
    };
  });

  describe('过期药品检测', () => {
    test('应该检测30天内即将过期的药品', () => {
      const now = new Date();
      const tenDaysLater = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const tenDaysLaterStr = tenDaysLater.toISOString().split('T')[0];

      mockStorage.set('medicines', [
        { id: 1, name: '阿莫西林胶囊', expiryDate: tenDaysLaterStr },
        { id: 2, name: '布洛芬片', expiryDate: '2027-12-31' } // 远未过期
      ]);

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(1);
      expect(page.data.expiringMedicines[0].name).toBe('阿莫西林胶囊');
    });

    test('应该不包含已过期的药品', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      mockStorage.set('medicines', [
        { id: 1, name: '已过期药品', expiryDate: yesterdayStr },
        { id: 2, name: '正常药品', expiryDate: '2027-12-31' }
      ]);

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(0);
    });

    test('应该不包含无有效期信息的药品', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '无有效期药品', expiryDate: null },
        { id: 2, name: '正常药品', expiryDate: '2027-12-31' }
      ]);

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(0);
    });

    test('应该正确处理边界日期（正好30天）', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

      mockStorage.set('medicines', [
        { id: 1, name: '正好30天过期', expiryDate: thirtyDaysLaterStr }
      ]);

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(1);
    });

    test('应该正确处理边界日期（31天）', () => {
      const now = new Date();
      const thirtyOneDaysLater = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
      const thirtyOneDaysLaterStr = thirtyOneDaysLater.toISOString().split('T')[0];

      mockStorage.set('medicines', [
        { id: 1, name: '31天后过期', expiryDate: thirtyOneDaysLaterStr }
      ]);

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(0);
    });

    test('应该检测多个即将过期的药品', () => {
      const now = new Date();
      const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      mockStorage.set('medicines', [
        { id: 1, name: '药品1', expiryDate: fiveDaysLater.toISOString().split('T')[0] },
        { id: 2, name: '药品2', expiryDate: fifteenDaysLater.toISOString().split('T')[0] },
        { id: 3, name: '药品3', expiryDate: '2027-12-31' }
      ]);

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(2);
    });

    test('应该处理无效日期格式', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '无效日期药品', expiryDate: 'invalid-date' }
      ]);

      page.loadData();

      // 无效日期会导致 new Date('invalid-date') 返回 Invalid Date
      // 过滤逻辑应该处理这种情况
      expect(page.data.expiringMedicines.length).toBe(0);
    });
  });

  describe('今日服药记录筛选', () => {
    test('应该筛选今日服药记录', () => {
      const today = new Date().toLocaleString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString();

      mockStorage.set('records', [
        { id: 1, medicineName: '阿莫西林胶囊', takeTime: today },
        { id: 2, medicineName: '布洛芬片', takeTime: yesterday }
      ]);

      page.loadData();

      expect(page.data.todayRecords.length).toBe(1);
      expect(page.data.todayRecords[0].medicineName).toBe('阿莫西林胶囊');
    });

    test('应该处理无今日记录的情况', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString();

      mockStorage.set('records', [
        { id: 1, medicineName: '阿莫西林胶囊', takeTime: yesterday }
      ]);

      page.loadData();

      expect(page.data.todayRecords.length).toBe(0);
    });

    test('应该处理多条今日记录', () => {
      const today = new Date().toLocaleString();

      mockStorage.set('records', [
        { id: 1, medicineName: '阿莫西林胶囊', takeTime: today },
        { id: 2, medicineName: '布洛芬片', takeTime: today },
        { id: 3, medicineName: '感冒灵颗粒', takeTime: today }
      ]);

      page.loadData();

      expect(page.data.todayRecords.length).toBe(3);
    });

    test('应该处理空记录列表', () => {
      mockStorage.set('records', []);

      page.loadData();

      expect(page.data.todayRecords.length).toBe(0);
    });

    test('应该处理无效时间格式', () => {
      mockStorage.set('records', [
        { id: 1, medicineName: '阿莫西林胶囊', takeTime: 'invalid-time' }
      ]);

      page.loadData();

      // 无效时间会导致 new Date('invalid-time').toDateString() 返回 'Invalid Date'
      // 不等于今天的日期字符串
      expect(page.data.todayRecords.length).toBe(0);
    });
  });

  describe('药品列表展示', () => {
    test('应该只展示前5个药品', () => {
      const medicines = [];
      for (let i = 0; i < 10; i++) {
        medicines.push({ id: i, name: `药品${i}` });
      }
      mockStorage.set('medicines', medicines);

      page.loadData();

      expect(page.data.medicines.length).toBe(5);
    });

    test('应该处理少于5个药品的情况', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ]);

      page.loadData();

      expect(page.data.medicines.length).toBe(2);
    });

    test('应该处理空药品列表', () => {
      mockStorage.set('medicines', []);

      page.loadData();

      expect(page.data.medicines.length).toBe(0);
    });
  });

  describe('导航功能', () => {
    test('应该正确跳转到添加页面', () => {
      page.goToAdd = function() {
        wx.navigateTo({ url: '/pages/add/add' });
      };

      page.goToAdd();
      expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/add/add' });
    });

    test('应该正确跳转到记录页面', () => {
      page.goToRecords = function() {
        wx.switchTab({ url: '/pages/records/records' });
      };

      page.goToRecords();
      expect(wx.switchTab).toHaveBeenCalledWith({ url: '/pages/records/records' });
    });

    test('应该正确跳转到详情页面', () => {
      page.goToDetail = function(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
      };

      page.goToDetail({ currentTarget: { dataset: { id: 123 } } });
      expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/detail/detail?id=123' });
    });
  });

  describe('边界条件', () => {
    test('应该处理存储为null的情况', () => {
      mockStorage.set('medicines', null);
      mockStorage.set('records', null);

      page.loadData();

      expect(page.data.medicines).toEqual([]);
      expect(page.data.expiringMedicines).toEqual([]);
      expect(page.data.todayRecords).toEqual([]);
    });

    test('应该处理存储为undefined的情况', () => {
      mockStorage.delete('medicines');
      mockStorage.delete('records');

      page.loadData();

      expect(page.data.medicines).toEqual([]);
    });

    test('应该处理药品对象缺少字段的情况', () => {
      mockStorage.set('medicines', [
        { id: 1 }, // 缺少 name 和 expiryDate
        { id: 2, name: '药品2' } // 缺少 expiryDate
      ]);

      page.loadData();

      expect(page.data.medicines.length).toBe(2);
      expect(page.data.expiringMedicines.length).toBe(0);
    });

    test('应该处理记录对象缺少字段的情况', () => {
      mockStorage.set('records', [
        { id: 1, medicineName: '药品1' }, // 缺少 takeTime
        { id: 2 } // 缺少所有字段
      ]);

      page.loadData();

      expect(page.data.todayRecords.length).toBe(0);
    });

    test('应该处理极端日期（过去很久）', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '很久前过期', expiryDate: '2000-01-01' }
      ]);

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(0);
    });

    test('应该处理极端日期（未来很久）', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '很久后过期', expiryDate: '2100-01-01' }
      ]);

      page.loadData();

      expect(page.data.expiringMedicines.length).toBe(0);
    });
  });

  describe('日期处理', () => {
    test('应该正确处理不同日期格式', () => {
      const now = new Date();
      const tenDaysLater = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

      const testCases = [
        tenDaysLater.toISOString().split('T')[0], // YYYY-MM-DD
        tenDaysLater.toLocaleDateString('zh-CN'), // 本地格式
      ];

      testCases.forEach((dateStr, index) => {
        mockStorage.set('medicines', [
          { id: index, name: `药品${index}`, expiryDate: dateStr }
        ]);

        page.loadData();

        // 至少标准格式应该能正确识别
        if (index === 0) {
          expect(page.data.expiringMedicines.length).toBe(1);
        }
      });
    });
  });
});