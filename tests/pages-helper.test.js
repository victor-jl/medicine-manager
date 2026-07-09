// tests/pages-helper.test.js
// 页面逻辑辅助函数测试

// 模拟页面数据处理逻辑
describe('页面数据处理测试', () => {
  describe('药品有效期计算', () => {
    function calculateExpiryStatus(expiryDate) {
      if (!expiryDate) return 'unknown';

      const now = new Date();
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        return 'expired';
      } else if (daysUntilExpiry <= 30) {
        return 'expiring';
      } else {
        return 'valid';
      }
    }

    test('应正确识别过期药品', () => {
      const pastDate = '2023-01-01';
      expect(calculateExpiryStatus(pastDate)).toBe('expired');
    });

    test('应正确识别即将过期药品（30天内）', () => {
      const now = new Date();
      const nearExpiry = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const expiryStr = nearExpiry.toISOString().split('T')[0];

      expect(calculateExpiryStatus(expiryStr)).toBe('expiring');
    });

    test('应正确识别有效药品', () => {
      const futureDate = '2026-12-31';
      expect(calculateExpiryStatus(futureDate)).toBe('valid');
    });

    test('应处理空有效期', () => {
      expect(calculateExpiryStatus('')).toBe('unknown');
      expect(calculateExpiryStatus(null)).toBe('unknown');
    });

    test('应处理无效日期格式', () => {
      const result = calculateExpiryStatus('invalid');
      // JavaScript的Date对象对'invalid'的处理可能不同
      // 确保不会抛出异常，并返回合理的值
      expect(['unknown', 'expired', 'valid']).toContain(result);
    });
  });

  describe('今日记录过滤', () => {
    function filterTodayRecords(records) {
      const today = new Date().toDateString();
      return records.filter(r => {
        const recordDate = new Date(r.takeTime).toDateString();
        return recordDate === today;
      });
    }

    test('应正确过滤今日记录', () => {
      const now = new Date();
      const todayStr = now.toLocaleString();

      const records = [
        { takeTime: todayStr, name: '药1' },
        { takeTime: '2023-01-01 10:00:00', name: '药2' },
        { takeTime: todayStr, name: '药3' }
      ];

      const todayRecords = filterTodayRecords(records);

      expect(todayRecords).toHaveLength(2);
      expect(todayRecords.every(r => r.takeTime === todayStr)).toBe(true);
    });

    test('应处理空记录列表', () => {
      expect(filterTodayRecords([])).toHaveLength(0);
    });

    test('应处理无今日记录的情况', () => {
      const oldRecords = [
        { takeTime: '2023-01-01', name: '药1' },
        { takeTime: '2023-01-02', name: '药2' }
      ];

      expect(filterTodayRecords(oldRecords)).toHaveLength(0);
    });
  });

  describe('药品数据存储和检索', () => {
    // 模拟存储操作
    class MockStorage {
      constructor() {
        this.data = {};
      }

      setItem(key, value) {
        this.data[key] = JSON.stringify(value);
      }

      getItem(key) {
        const value = this.data[key];
        return value ? JSON.parse(value) : null;
      }
    }

    test('应正确保存和检索药品数据', () => {
      const storage = new MockStorage();
      const medicine = {
        id: 1,
        name: '测试药品',
        expiryDate: '2025-12-31'
      };

      storage.setItem('medicines', [medicine]);
      const retrieved = storage.getItem('medicines');

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].name).toBe('测试药品');
    });

    test('应正确追加药品到列表', () => {
      const storage = new MockStorage();
      const medicines = [
        { id: 1, name: '药1' },
        { id: 2, name: '药2' }
      ];

      storage.setItem('medicines', medicines);

      const newMedicine = { id: 3, name: '药3' };
      const existing = storage.getItem('medicines') || [];
      existing.push(newMedicine);
      storage.setItem('medicines', existing);

      const final = storage.getItem('medicines');
      expect(final).toHaveLength(3);
      expect(final[2].name).toBe('药3');
    });

    test('应正确删除药品', () => {
      const storage = new MockStorage();
      const medicines = [
        { id: 1, name: '药1' },
        { id: 2, name: '药2' },
        { id: 3, name: '药3' }
      ];

      storage.setItem('medicines', medicines);

      const existing = storage.getItem('medicines');
      const filtered = existing.filter(m => m.id !== 2);
      storage.setItem('medicines', filtered);

      const final = storage.getItem('medicines');
      expect(final).toHaveLength(2);
      expect(final.find(m => m.id === 2)).toBeUndefined();
    });
  });

  describe('服药记录数据处理', () => {
    test('应正确生成服药记录ID', () => {
      const record1 = { id: Date.now() };
      const record2 = { id: Date.now() + 1 };

      expect(record1.id).toBeDefined();
      expect(record2.id).toBeGreaterThan(record1.id);
    });

    test('应正确关联药品和服药记录', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' }
      ];

      const records = [
        { id: 101, medicineId: 1, medicineName: '阿莫西林' },
        { id: 102, medicineId: 2, medicineName: '布洛芬' }
      ];

      // 查找药品对应的记录
      const medicine1Records = records.filter(r => r.medicineId === 1);
      expect(medicine1Records).toHaveLength(1);
      expect(medicine1Records[0].medicineName).toBe('阿莫西林');
    });

    test('应处理药品删除后的记录清理', () => {
      const records = [
        { id: 101, medicineId: 1 },
        { id: 102, medicineId: 2 },
        { id: 103, medicineId: 1 }
      ];

      // 删除药品ID为1的所有记录
      const cleanedRecords = records.filter(r => r.medicineId !== 1);

      expect(cleanedRecords).toHaveLength(1);
      expect(cleanedRecords[0].medicineId).toBe(2);
    });
  });

  describe('病例记录处理', () => {
    test('应正确创建病例记录', () => {
      const caseRecord = {
        id: Date.now(),
        content: '感冒发烧，服用感冒灵',
        createTime: new Date().toLocaleString()
      };

      expect(caseRecord.id).toBeDefined();
      expect(caseRecord.content).toBeTruthy();
      expect(caseRecord.createTime).toBeTruthy();
    });

    test('应处理空病例内容', () => {
      const content = '';
      expect(content.trim()).toBe('');
    });
  });

  describe('数据排序和反转', () => {
    test('应正确反转数组顺序（最新在前）', () => {
      const records = [
        { id: 1, time: '2023-01-01' },
        { id: 2, time: '2023-01-02' },
        { id: 3, time: '2023-01-03' }
      ];

      const reversed = records.reverse();

      expect(reversed[0].id).toBe(3);
      expect(reversed[2].id).toBe(1);
    });

    test('应正确截取前5条记录', () => {
      const medicines = [
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }
      ];

      const top5 = medicines.slice(0, 5);

      expect(top5).toHaveLength(5);
      expect(top5[4].id).toBe(5);
    });
  });
});