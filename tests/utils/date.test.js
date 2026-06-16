const assert = require('assert');
const { getExpiringMedicines, getTodayRecords, formatExpiryDate } = require('../../utils/date');

describe('日期工具函数', function() {
  describe('getExpiringMedicines', function() {
    it('应该返回30天内过期的药品', function() {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const medicines = [
        { id: 1, name: '药品A', expiryDate: expiryDate.toISOString().split('T')[0] },
        { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];

      const result = getExpiringMedicines(medicines);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 1);
    });

    it('应该排除已过期的药品', function() {
      const now = new Date();
      const medicines = [
        { id: 1, name: '过期药品', expiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 2, name: '有效药品', expiryDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];

      const result = getExpiringMedicines(medicines);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 2);
    });

    it('应该排除没有有效期的药品', function() {
      const medicines = [
        { id: 1, name: '无有效期药品' },
        { id: 2, name: '有有效期药品', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];

      const result = getExpiringMedicines(medicines);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 2);
    });

    it('应该处理空数组', function() {
      const result = getExpiringMedicines([]);
      assert.deepStrictEqual(result, []);
    });

    it('应该处理null输入', function() {
      const result = getExpiringMedicines(null);
      assert.deepStrictEqual(result, []);
    });

    it('应该处理undefined输入', function() {
      const result = getExpiringMedicines(undefined);
      assert.deepStrictEqual(result, []);
    });

    it('应该支持自定义天数参数', function() {
      const now = new Date();
      const medicines = [
        { id: 1, name: '15天过期', expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 2, name: '25天过期', expiryDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];

      const result = getExpiringMedicines(medicines, 20);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 1);
    });

    it('应该包含刚好30天过期的药品', function() {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const medicines = [
        { id: 1, name: '刚好30天过期', expiryDate: expiryDate.toISOString().split('T')[0] }
      ];

      const result = getExpiringMedicines(medicines);
      assert.strictEqual(result.length, 1);
    });

    it('应该包含今天过期的药品', function() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const medicines = [
        { id: 1, name: '今天过期', expiryDate: `${year}-${month}-${day}` }
      ];

      const result = getExpiringMedicines(medicines);
      assert.strictEqual(result.length, 1);
    });
  });

  describe('getTodayRecords', function() {
    it('应该返回今天的记录', function() {
      const today = new Date();
      const records = [
        { id: 1, medicineId: 1, medicineName: '药品A', takeTime: today.toLocaleString() },
        { id: 2, medicineId: 2, medicineName: '药品B', takeTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString() }
      ];

      const result = getTodayRecords(records);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 1);
    });

    it('应该处理空数组', function() {
      const result = getTodayRecords([]);
      assert.deepStrictEqual(result, []);
    });

    it('应该处理null输入', function() {
      const result = getTodayRecords(null);
      assert.deepStrictEqual(result, []);
    });

    it('应该处理undefined输入', function() {
      const result = getTodayRecords(undefined);
      assert.deepStrictEqual(result, []);
    });

    it('应该处理没有今天记录的情况', function() {
      const records = [
        { id: 1, medicineId: 1, medicineName: '药品A', takeTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString() }
      ];

      const result = getTodayRecords(records);
      assert.deepStrictEqual(result, []);
    });

    it('应该返回多条今天的记录', function() {
      const today = new Date();
      const records = [
        { id: 1, medicineId: 1, medicineName: '药品A', takeTime: today.toLocaleString() },
        { id: 2, medicineId: 2, medicineName: '药品B', takeTime: today.toLocaleString() },
        { id: 3, medicineId: 3, medicineName: '药品C', takeTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString() }
      ];

      const result = getTodayRecords(records);
      assert.strictEqual(result.length, 2);
    });
  });

  describe('formatExpiryDate', function() {
    it('应该将日期字符串格式化为YYYY-MM-DD', function() {
      const result = formatExpiryDate('2025-12-31');
      assert.strictEqual(result, '2025-12-31');
    });

    it('应该将日期对象格式化为YYYY-MM-DD', function() {
      const date = new Date(2025, 11, 31);
      const result = formatExpiryDate(date);
      assert.strictEqual(result, '2025-12-31');
    });

    it('应该处理空字符串', function() {
      const result = formatExpiryDate('');
      assert.strictEqual(result, '');
    });

    it('应该处理null输入', function() {
      const result = formatExpiryDate(null);
      assert.strictEqual(result, '');
    });

    it('应该处理undefined输入', function() {
      const result = formatExpiryDate(undefined);
      assert.strictEqual(result, '');
    });

    it('应该处理无效日期字符串', function() {
      const result = formatExpiryDate('无效日期');
      assert.strictEqual(result, '无效日期');
    });

    it('应该正确处理月份和日期的前导零', function() {
      const result = formatExpiryDate('2025-1-5');
      assert.strictEqual(result, '2025-01-05');
    });
  });
});