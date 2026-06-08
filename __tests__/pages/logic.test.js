/**
 * 页面逻辑测试 - 核心业务逻辑提取测试
 * 测试重点：过期判断、数据过滤、日期处理
 */

describe('页面业务逻辑', () => {
  beforeEach(() => {
    clearMockStorage();
  });

  describe('首页 - 过期药品判断逻辑', () => {
    /**
     * 从 index.js 提取的过期判断逻辑
     * 获取即将过期的药品（30天内）
     */
    function getExpiringMedicines(medicines, referenceDate = new Date()) {
      const now = referenceDate;
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      return medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });
    }

    describe('基础功能', () => {
      test('应返回空数组（无药品时）', () => {
        expect(getExpiringMedicines([])).toEqual([]);
      });

      test('应过滤掉无有效期字段的药品', () => {
        const medicines = [
          { id: 1, name: '药品A' },
          { id: 2, name: '药品B', expiryDate: null },
          { id: 3, name: '药品C', expiryDate: '' }
        ];
        expect(getExpiringMedicines(medicines)).toEqual([]);
      });
    });

    describe('过期时间判断', () => {
      test('应识别30天内即将过期的药品', () => {
        const now = new Date('2025-01-15');
        const medicines = [
          { id: 1, name: '药品A', expiryDate: '2025-02-10' }, // 26天后，应识别
          { id: 2, name: '药品B', expiryDate: '2025-03-01' }  // 45天后，不应识别
        ];

        const result = getExpiringMedicines(medicines, now);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
      });

      test('应识别当天过期的药品', () => {
        const now = new Date('2025-01-15');
        const medicines = [
          { id: 1, name: '药品A', expiryDate: '2025-01-15' }
        ];

        const result = getExpiringMedicines(medicines, now);
        expect(result).toHaveLength(1);
      });

      test('应识别明天过期的药品', () => {
        const now = new Date('2025-01-15');
        const medicines = [
          { id: 1, name: '药品A', expiryDate: '2025-01-16' }
        ];

        const result = getExpiringMedicines(medicines, now);
        expect(result).toHaveLength(1);
      });

      test('应识别正好30天后过期的药品', () => {
        const now = new Date('2025-01-15');
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const medicines = [
          { id: 1, name: '药品A', expiryDate: thirtyDaysLater.toISOString().split('T')[0] }
        ];

        const result = getExpiringMedicines(medicines, now);
        expect(result).toHaveLength(1);
      });

      test('不应识别31天后过期的药品', () => {
        const now = new Date('2025-01-15');
        const thirtyOneDaysLater = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
        const medicines = [
          { id: 1, name: '药品A', expiryDate: thirtyOneDaysLater.toISOString().split('T')[0] }
        ];

        const result = getExpiringMedicines(medicines, now);
        expect(result).toHaveLength(0);
      });
    });

    describe('已过期药品处理', () => {
      test('不应包含已过期的药品', () => {
        const now = new Date('2025-01-15');
        const medicines = [
          { id: 1, name: '药品A', expiryDate: '2025-01-10' }, // 5天前已过期
          { id: 2, name: '药品B', expiryDate: '2025-01-14' }  // 1天前已过期
        ];

        const result = getExpiringMedicines(medicines, now);
        expect(result).toHaveLength(0);
      });
    });

    describe('边界条件', () => {
      test('应正确处理多个药品混合情况', () => {
        const now = new Date('2025-01-15');
        const medicines = [
          { id: 1, name: '已过期', expiryDate: '2025-01-10' },
          { id: 2, name: '即将过期', expiryDate: '2025-02-01' },
          { id: 3, name: '远期过期', expiryDate: '2025-12-01' },
          { id: 4, name: '无有效期' },
          { id: 5, name: '当天过期', expiryDate: '2025-01-15' }
        ];

        const result = getExpiringMedicines(medicines, now);
        expect(result).toHaveLength(2);
        expect(result.map(m => m.id)).toEqual([2, 5]);
      });

      test('应正确处理无效日期格式', () => {
        const medicines = [
          { id: 1, name: '药品A', expiryDate: 'invalid-date' },
          { id: 2, name: '药品B', expiryDate: '2025/01/15' } // 不同格式
        ];

        // 不应抛出异常
        expect(() => getExpiringMedicines(medicines)).not.toThrow();
      });
    });
  });

  describe('首页 - 今日记录过滤逻辑', () => {
    /**
     * 从 index.js 提取的今日记录过滤逻辑
     */
    function getTodayRecords(records, referenceDate = new Date()) {
      const today = referenceDate.toDateString();
      return records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });
    }

    describe('基础功能', () => {
      test('应返回空数组（无记录时）', () => {
        expect(getTodayRecords([])).toEqual([]);
      });

      test('应过滤出今日记录', () => {
        const now = new Date('2025-01-15T10:00:00');
        const records = [
          { id: 1, takeTime: '2025-01-15T08:00:00' },
          { id: 2, takeTime: '2025-01-15T12:00:00' },
          { id: 3, takeTime: '2025-01-14T10:00:00' } // 昨天
        ];

        const result = getTodayRecords(records, now);
        expect(result).toHaveLength(2);
        expect(result.map(r => r.id)).toEqual([1, 2]);
      });
    });

    describe('边界条件', () => {
      test('应正确处理跨天边界', () => {
        const now = new Date('2025-01-15T00:00:00');
        const records = [
          { id: 1, takeTime: '2025-01-14T23:59:59' }, // 昨天最后一秒
          { id: 2, takeTime: '2025-01-15T00:00:00' }  // 今天第一秒
        ];

        const result = getTodayRecords(records, now);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(2);
      });

      test('应正确处理无takeTime字段', () => {
        const records = [
          { id: 1 },
          { id: 2, takeTime: null }
        ];

        expect(() => getTodayRecords(records)).not.toThrow();
      });
    });
  });

  describe('记录页 - 数据操作逻辑', () => {
    /**
     * 从 records.js 提取的删除逻辑
     */
    function deleteMedicine(medicines, id) {
      return medicines.filter(m => m.id !== id);
    }

    function deleteRecord(records, id) {
      return records.filter(r => r.id !== id);
    }

    describe('删除操作', () => {
      test('应正确删除指定药品', () => {
        const medicines = [
          { id: 1, name: '药品A' },
          { id: 2, name: '药品B' },
          { id: 3, name: '药品C' }
        ];

        const result = deleteMedicine(medicines, 2);
        expect(result).toHaveLength(2);
        expect(result.map(m => m.id)).toEqual([1, 3]);
      });

      test('应处理不存在的ID', () => {
        const medicines = [
          { id: 1, name: '药品A' }
        ];

        const result = deleteMedicine(medicines, 999);
        expect(result).toHaveLength(1);
      });

      test('应处理空数组', () => {
        const result = deleteMedicine([], 1);
        expect(result).toEqual([]);
      });
    });

    describe('记录服药逻辑', () => {
      function createTakeRecord(medicineId, medicineName, timestamp = Date.now()) {
        return {
          id: timestamp,
          medicineId: medicineId,
          medicineName: medicineName,
          takeTime: new Date().toLocaleString()
        };
      }

      test('应创建正确的服药记录', () => {
        const record = createTakeRecord(123, '阿莫西林', 1705312800000);

        expect(record.id).toBe(1705312800000);
        expect(record.medicineId).toBe(123);
        expect(record.medicineName).toBe('阿莫西林');
        expect(record.takeTime).toBeDefined();
      });

      test('每次创建的记录应有唯一ID', () => {
        const restore = mockDateNow(1705312800000);
        const record1 = createTakeRecord(1, '药品A');
        restore();

        const restore2 = mockDateNow(1705312800001);
        const record2 = createTakeRecord(1, '药品A');
        restore2();

        expect(record1.id).not.toBe(record2.id);
      });
    });
  });

  describe('详情页 - 药品记录关联', () => {
    /**
     * 从 detail.js 提取的记录过滤逻辑
     */
    function getMedicineRecords(records, medicineId) {
      return records.filter(r => r.medicineId === medicineId);
    }

    describe('记录关联', () => {
      test('应正确过滤指定药品的记录', () => {
        const records = [
          { id: 1, medicineId: 100, medicineName: '药品A' },
          { id: 2, medicineId: 200, medicineName: '药品B' },
          { id: 3, medicineId: 100, medicineName: '药品A' }
        ];

        const result = getMedicineRecords(records, 100);
        expect(result).toHaveLength(2);
        expect(result.map(r => r.id)).toEqual([1, 3]);
      });

      test('应返回空数组（无匹配记录时）', () => {
        const records = [
          { id: 1, medicineId: 100 }
        ];

        const result = getMedicineRecords(records, 200);
        expect(result).toEqual([]);
      });

      test('应处理空记录数组', () => {
        const result = getMedicineRecords([], 100);
        expect(result).toEqual([]);
      });
    });
  });

  describe('添加页 - 保存药品逻辑', () => {
    /**
     * 从 add.js 提取的药品保存逻辑
     */
    function createMedicine(data, timestamp = Date.now()) {
      return {
        id: timestamp,
        name: data.name,
        expiryDate: data.expiryDate,
        description: data.description,
        specification: data.specification || '',
        manufacturer: data.manufacturer || '',
        usage: data.usage || '',
        approvalNumber: data.approvalNumber || '',
        storage: data.storage || '',
        ingredients: data.ingredients || '',
        photos: data.photos || [],
        createTime: new Date().toLocaleString()
      };
    }

    describe('药品创建', () => {
      test('应创建完整的药品对象', () => {
        const data = {
          name: '阿莫西林胶囊',
          expiryDate: '2025-12-31',
          description: '规格: 0.5g',
          specification: '0.5g*12粒',
          manufacturer: 'XX制药厂'
        };

        const medicine = createMedicine(data, 1705312800000);

        expect(medicine.id).toBe(1705312800000);
        expect(medicine.name).toBe('阿莫西林胶囊');
        expect(medicine.expiryDate).toBe('2025-12-31');
        expect(medicine.specification).toBe('0.5g*12粒');
        expect(medicine.manufacturer).toBe('XX制药厂');
        expect(medicine.createTime).toBeDefined();
      });

      test('应处理缺失的可选字段', () => {
        const data = {
          name: '药品A'
        };

        const medicine = createMedicine(data);

        expect(medicine.specification).toBe('');
        expect(medicine.manufacturer).toBe('');
        expect(medicine.usage).toBe('');
        expect(medicine.photos).toEqual([]);
      });

      test('应验证必填字段', () => {
        const data = { name: '' };
        const isValid = data.name && data.name.trim();

        expect(isValid).toBeFalsy();
      });
    });
  });

  describe('日期格式化逻辑', () => {
    /**
     * 模拟日期格式化函数（如果存在）
     */
    function formatExpiryDate(dateStr) {
      if (!dateStr) return '';

      // 尝试解析各种日期格式
      const patterns = [
        /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/,  // 2025年12月31日
        /(\d{4})[年\-\/](\d{1,2})/,                   // 2025年12月
        /有效期[至：:]\s*(.+)/                        // 有效期至：2025-12
      ];

      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          if (match[1] && match[2]) {
            const year = match[1];
            const month = match[2].padStart(2, '0');
            const day = match[3] ? match[3].padStart(2, '0') : '01';
            return `${year}-${month}-${day}`;
          }
        }
      }

      return dateStr;
    }

    describe('日期解析', () => {
      test('应解析标准日期格式', () => {
        expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
        expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
      });

      test('应解析中文日期格式', () => {
        expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
        expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
      });

      test('应处理带前缀的日期', () => {
        const result = formatExpiryDate('有效期至：2025-12-31');
        expect(result).toContain('2025');
      });

      test('应处理空输入', () => {
        expect(formatExpiryDate('')).toBe('');
        expect(formatExpiryDate(null)).toBe('');
        expect(formatExpiryDate(undefined)).toBe('');
      });

      test('应处理单数字月份', () => {
        expect(formatExpiryDate('2025年1月5日')).toBe('2025-01-05');
      });
    });
  });
});
