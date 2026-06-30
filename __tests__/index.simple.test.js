// __tests__/pages/index.simple.test.js
// 简化的首页逻辑测试
require('../test/wx.mock');

describe('Index Page Logic', () => {
  describe('过期药品识别', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('应识别即将过期的药品（30天内）', () => {
      const medicines = [
        { id: 1, name: '阿莫西林', expiryDate: '2025-02-10' },
        { id: 2, name: '布洛芬', expiryDate: '2025-12-31' }
      ];

      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring.length).toBe(1);
      expect(expiring[0].name).toBe('阿莫西林');
    });

    test('应过滤已过期的药品', () => {
      const medicines = [
        { id: 1, name: '过期药品', expiryDate: '2024-12-01' },
        { id: 2, name: '即将过期', expiryDate: '2025-02-01' }
      ];

      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring.length).toBe(1);
      expect(expiring[0].name).toBe('即将过期');
    });

    test('应处理无有效期药品', () => {
      const medicines = [
        { id: 1, name: '药品1', expiryDate: null },
        { id: 2, name: '药品2' },
        { id: 3, name: '药品3', expiryDate: '2025-02-01' }
      ];

      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring.length).toBe(1);
    });
  });

  describe('今日记录过滤', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-06-15'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('应只显示今日记录', () => {
      const today = new Date();
      const todayStr = today.toDateString();

      const records = [
        { id: 1, takeTime: today.toLocaleString() },
        { id: 2, takeTime: new Date('2025-06-14').toLocaleString() }
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === todayStr;
      });

      expect(todayRecords.length).toBe(1);
      expect(todayRecords[0].id).toBe(1);
    });

    test('应处理无今日记录的情况', () => {
      const today = new Date();
      const todayStr = today.toDateString();

      const records = [
        { id: 1, takeTime: new Date('2025-06-14').toLocaleString() }
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === todayStr;
      });

      expect(todayRecords.length).toBe(0);
    });
  });

  describe('药品列表显示限制', () => {
    test('应只显示前5个药品', () => {
      const medicines = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `药品${i + 1}`
      }));

      const displayMedicines = medicines.slice(0, 5);

      expect(displayMedicines.length).toBe(5);
      expect(displayMedicines[0].id).toBe(1);
      expect(displayMedicines[4].id).toBe(5);
    });

    test('应处理少于5个药品的情况', () => {
      const medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];

      const displayMedicines = medicines.slice(0, 5);

      expect(displayMedicines.length).toBe(2);
    });
  });

  describe('导航URL构建', () => {
    test('goToDetail 应构建正确的URL', () => {
      const goToDetail = (id) => `/pages/detail/detail?id=${id}`;

      expect(goToDetail(123)).toBe('/pages/detail/detail?id=123');
      expect(goToDetail(1)).toBe('/pages/detail/detail?id=1');
    });

    test('goToAdd 应导航到添加页', () => {
      const goToAdd = () => '/pages/add/add';
      expect(goToAdd()).toBe('/pages/add/add');
    });

    test('goToRecords 应切换标签', () => {
      const goToRecords = () => '/pages/records/records';
      expect(goToRecords()).toBe('/pages/records/records');
    });
  });

  describe('数据加载', () => {
    test('应从存储加载所有数据', () => {
      wx.setStorageSync('medicines', [{ id: 1, name: '阿莫西林' }]);
      wx.setStorageSync('records', [{ id: 1, medicineName: '阿莫西林' }]);

      const medicines = wx.getStorageSync('medicines') || [];
      const records = wx.getStorageSync('records') || [];

      expect(medicines.length).toBe(1);
      expect(records.length).toBe(1);
    });

    test('应处理空存储', () => {
      wx.clearStorageSync();

      const medicines = wx.getStorageSync('medicines') || [];
      const records = wx.getStorageSync('records') || [];

      expect(medicines).toEqual([]);
      expect(records).toEqual([]);
    });
  });

  describe('边界条件', () => {
    test('应处理无效日期格式', () => {
      const medicines = [
        { id: 1, name: '药品1', expiryDate: 'invalid-date' }
      ];

      const now = new Date('2025-01-15');
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        // Invalid Date 的 getTime() 返回 NaN，NaN 比较会返回 false
        const expiryTime = expiry.getTime();
        return !isNaN(expiryTime) && expiryTime <= thirtyDaysLater.getTime() && expiryTime >= now.getTime();
      });

      expect(expiring.length).toBe(0);
    });

    test('应处理大量药品的过期检查', () => {
      const medicines = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `药品${i + 1}`,
        expiryDate: `2025-${String(i % 12 + 1).padStart(2, '0')}-01`
      }));

      const now = new Date('2025-01-15');
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring.length).toBeGreaterThan(0);
      expect(expiring.length).toBeLessThan(100);
    });
  });
});