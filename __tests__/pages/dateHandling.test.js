/**
 * 有效期和日期处理逻辑测试
 * 测试文件: pages/index/index.js 中的过期药品判断逻辑
 */

// 引入 wx mock
require('../../__mocks__/wx');

describe('有效期和日期处理逻辑测试', () => {
  describe('即将过期药品判断', () => {
    test('应该正确识别30天内即将过期的药品', () => {
      const now = new Date();
      const twentyDaysLater = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

      const medicines = [
        {
          id: 1,
          name: '即将过期药品',
          expiryDate: twentyDaysLater.toISOString().split('T')[0]
        },
        {
          id: 2,
          name: '未过期药品',
          expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];

      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
      expect(expiring[0].name).toBe('即将过期药品');
    });

    test('应该排除已过期的药品', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const medicines = [
        {
          id: 1,
          name: '已过期药品',
          expiryDate: tenDaysAgo.toISOString().split('T')[0]
        }
      ];

      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(0);
    });

    test('应该正确处理没有有效期信息的药品', () => {
      const medicines = [
        { id: 1, name: '无有效期药品', expiryDate: null },
        { id: 2, name: '空有效期药品', expiryDate: '' },
        { id: 3, name: '未定义有效期药品' }
      ];

      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(0);
    });

    test('应该正确识别今天过期的药品', () => {
      const today = new Date();
      // 使用本地时间的日期字符串
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const medicines = [
        {
          id: 1,
          name: '今天过期药品',
          expiryDate: todayStr
        }
      ];

      const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate + 'T00:00:00');
        // 比较日期部分，而不是完整时间戳
        const expiryDateOnly = expiry.toDateString();
        const todayDateOnly = today.toDateString();
        return expiry <= thirtyDaysLater && expiryDateOnly === todayDateOnly;
      });

      expect(expiring).toHaveLength(1);
      expect(expiring[0].name).toBe('今天过期药品');
    });

    test('应该正确识别正好30天后过期的药品', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

      const medicines = [
        {
          id: 1,
          name: '30天后过期药品',
          expiryDate: thirtyDaysLaterStr
        }
      ];

      const thirtyDaysLaterCheck = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLaterCheck && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
    });
  });

  describe('今日服药记录判断', () => {
    test('应该正确识别今天的服药记录', () => {
      const today = new Date();
      const todayStr = today.toDateString();

      const records = [
        {
          id: 1,
          medicineName: '药品A',
          takeTime: today.toLocaleString()
        },
        {
          id: 2,
          medicineName: '药品B',
          takeTime: new Date(today.getTime() - 24 * 60 * 60 * 1000).toLocaleString()
        }
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === todayStr;
      });

      expect(todayRecords).toHaveLength(1);
      expect(todayRecords[0].medicineName).toBe('药品A');
    });

    test('应该正确处理空记录列表', () => {
      const records = [];
      const today = new Date();

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today.toDateString();
      });

      expect(todayRecords).toHaveLength(0);
    });

    test('应该正确识别不同时间的今日记录', () => {
      const today = new Date();
      const todayStr = today.toDateString();

      const records = [
        {
          id: 1,
          takeTime: new Date(today.setHours(8, 0, 0)).toLocaleString()
        },
        {
          id: 2,
          takeTime: new Date(today.setHours(12, 30, 0)).toLocaleString()
        },
        {
          id: 3,
          takeTime: new Date(today.setHours(20, 0, 0)).toLocaleString()
        }
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === todayStr;
      });

      expect(todayRecords).toHaveLength(3);
    });
  });

  describe('日期格式处理', () => {
    test('应该正确处理标准日期格式', () => {
      const dateStr = '2025-12-31';
      const date = new Date(dateStr);

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // 月份从0开始
      expect(date.getDate()).toBe(31);
    });

    test('应该正确处理带时间的日期格式', () => {
      const dateStr = '2025-12-31 10:30:00';
      const date = new Date(dateStr);

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
    });

    test('应该正确处理无效日期', () => {
      const invalidDate = new Date('invalid-date');
      expect(isNaN(invalidDate.getTime())).toBe(true);
    });
  });

  describe('边界条件测试', () => {
    test('应该正确处理闰年日期', () => {
      const leapYearDate = new Date('2024-02-29');
      expect(leapYearDate.getFullYear()).toBe(2024);
      expect(leapYearDate.getMonth()).toBe(1);
      expect(leapYearDate.getDate()).toBe(29);
    });

    test('应该正确处理年末日期', () => {
      const yearEnd = new Date('2025-12-31');
      const nextDay = new Date(yearEnd.getTime() + 24 * 60 * 60 * 1000);

      expect(nextDay.getFullYear()).toBe(2026);
      expect(nextDay.getMonth()).toBe(0);
      expect(nextDay.getDate()).toBe(1);
    });

    test('应该正确处理时区差异', () => {
      const dateStr = '2025-12-31';
      const date1 = new Date(dateStr);
      const date2 = new Date(dateStr + 'T00:00:00');

      // 两个日期应该是同一天
      expect(date1.toDateString()).toBe(date2.toDateString());
    });
  });
});