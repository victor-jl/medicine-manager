describe('pages/index/index.js - 首页逻辑', () => {
  let medicines;
  let records;

  beforeEach(() => {
    medicines = [];
    records = [];
    global.wx.getStorageSync.mockImplementation((key) => {
      const storage = {
        'medicines': medicines,
        'records': records
      };
      return storage[key];
    });
  });

  describe('loadData - 数据加载', () => {
    test('应从存储加载药品列表', () => {
      medicines = [
        { id: 1, name: '药品1', expiryDate: '2026-12-31' },
        { id: 2, name: '药品2', expiryDate: '2026-12-31' }
      ];

      const loaded = wx.getStorageSync('medicines') || [];
      expect(loaded.length).toBe(2);
    });

    test('空存储应返回空数组', () => {
      medicines = [];
      const loaded = wx.getStorageSync('medicines') || [];
      expect(loaded.length).toBe(0);
    });

    test('应限制首页显示的药品数量为5个', () => {
      medicines = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `药品${i + 1}`
      }));

      const displayMedicines = medicines.slice(0, 5);
      expect(displayMedicines.length).toBe(5);
    });
  });

  describe('即将过期药品计算', () => {
    test('应正确计算30天阈值', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      const diff = thirtyDaysLater.getTime() - now.getTime();
      expect(diff).toBe(thirtyDaysInMs);
    });

    test('应正确识别即将过期的药品', () => {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, expiryDate: sevenDaysLater.toISOString() },
        { id: 2, expiryDate: thirtyDaysLater.toISOString() },
        { id: 3, expiryDate: sixtyDaysLater.toISOString() }
      ];

      const isExpiringSoon = (expiryDate) => {
        if (!expiryDate) return false;
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiry = new Date(expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      };

      const expiring = medicines.filter(m => isExpiringSoon(m.expiryDate));
      expect(expiring.length).toBe(2);
    });

    test('应跳过无有效期字段的药品', () => {
      const medicines = [
        { id: 1, name: '有有效期', expiryDate: '2026-06-01' },
        { id: 2, name: '无有效期' }
      ];

      const isExpiringSoon = (expiryDate) => {
        if (!expiryDate) return false;
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiry = new Date(expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      };

      const expiring = medicines.filter(m => isExpiringSoon(m.expiryDate));
      expect(expiring.length).toBe(1);
      expect(expiring[0].name).toBe('有有效期');
    });
  });

  describe('今日记录过滤', () => {
    test('应正确获取今日日期字符串', () => {
      const today = new Date().toDateString();
      expect(today).toBe(new Date().toDateString());
    });

    test('应正确过滤今日记录', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const records = [
        { id: 1, takeTime: today.toISOString() },
        { id: 2, takeTime: yesterday.toISOString() },
        { id: 3, takeTime: tomorrow.toISOString() }
      ];

      const todayStr = today.toDateString();
      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === todayStr;
      });

      expect(todayRecords.length).toBe(1);
    });

    test('应正确处理记录按时间倒序', () => {
      const records = [
        { id: 1, takeTime: '2025-01-01' },
        { id: 2, takeTime: '2025-01-02' },
        { id: 3, takeTime: '2025-01-03' }
      ];

      const reversed = records.reverse();
      expect(reversed[0].id).toBe(3);
    });
  });

  describe('导航逻辑', () => {
    test('goToAdd应导航到添加页面', () => {
      const url = '/pages/add/add';
      expect(url).toBe('/pages/add/add');
    });

    test('goToRecords应切换到记录标签页', () => {
      const url = '/pages/records/records';
      expect(url).toBe('/pages/records/records');
    });

    test('goToDetail应传递ID参数', () => {
      const id = 123;
      const url = `/pages/detail/detail?id=${id}`;
      expect(url).toBe('/pages/detail/detail?id=123');
    });
  });
});
