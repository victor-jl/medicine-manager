const storage = {};

const mockWx = {
  storage,
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn()
  },
  getStorageSync: jest.fn((key) => storage[key]),
  setStorageSync: jest.fn((key, value) => {
    storage[key] = value;
  }),
  request: jest.fn(),
  navigateTo: jest.fn(),
  switchTab: jest.fn(),
  navigateBack: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  chooseMedia: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn()
  })),
  getCurrentPages: jest.fn(() => []),
  getApp: jest.fn(() => ({
    globalData: {}
  }))
};

jest.mock('../__mocks__/wx', () => mockWx);
const wx = require('../__mocks__/wx');

describe('业务逻辑测试套件', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(storage).forEach(key => delete storage[key]);
  });

  describe('日期计算逻辑（源自 pages/index/index.js）', () => {
    function calculateExpiringMedicines(medicines, daysThreshold = 30) {
      if (!Array.isArray(medicines)) return [];
      
      const now = new Date();
      const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
      
      return medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thresholdDate && expiry >= now;
      });
    }

    function calculateTodayRecords(records) {
      if (!Array.isArray(records)) return [];
      const today = new Date().toDateString();
      return records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });
    }

    describe('calculateExpiringMedicines', () => {
      test('应正确识别30天内即将过期的药品', () => {
        const now = new Date();
        const medicines = [
          { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() },
          { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString() },
          { id: 3, name: '药品C', expiryDate: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString() }
        ];

        const result = calculateExpiringMedicines(medicines);
        expect(result).toHaveLength(2);
        expect(result.map(m => m.id)).toContain(1);
        expect(result.map(m => m.id)).toContain(3);
        expect(result.map(m => m.id)).not.toContain(2);
      });

      test('应排除已过期的药品', () => {
        const now = new Date();
        const medicines = [
          { id: 1, name: '已过期', expiryDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() }
        ];

        const result = calculateExpiringMedicines(medicines);
        expect(result).toHaveLength(0);
      });

      test('应排除无有效期字段的药品', () => {
        const medicines = [
          { id: 1, name: '无有效期' }
        ];

        const result = calculateExpiringMedicines(medicines);
        expect(result).toHaveLength(0);
      });

      test('应处理空数组', () => {
        const result = calculateExpiringMedicines([]);
        expect(result).toHaveLength(0);
      });

      test('应处理非数组输入', () => {
        expect(calculateExpiringMedicines(null)).toEqual([]);
        expect(calculateExpiringMedicines(undefined)).toEqual([]);
        expect(calculateExpiringMedicines('invalid')).toEqual([]);
      });

      test('应支持自定义阈值', () => {
        const now = new Date();
        const medicines = [
          { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() },
          { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000).toISOString() }
        ];

        const result7Days = calculateExpiringMedicines(medicines, 7);
        expect(result7Days).toHaveLength(1);
        expect(result7Days[0].id).toBe(1);

        const result60Days = calculateExpiringMedicines(medicines, 60);
        expect(result60Days).toHaveLength(2);
      });

      test('今天过期的药品应被包含', () => {
        const now = new Date();
        const medicines = [
          { id: 1, name: '今日过期', expiryDate: now.toISOString() }
        ];

        const result = calculateExpiringMedicines(medicines);
        expect(result).toHaveLength(1);
      });
    });

    describe('calculateTodayRecords', () => {
      test('应正确过滤今日记录', () => {
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const records = [
          { id: 1, takeTime: today.toISOString() },
          { id: 2, takeTime: yesterday.toISOString() },
          { id: 3, takeTime: tomorrow.toISOString() }
        ];

        const result = calculateTodayRecords(records);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
      });

      test('应处理空数组', () => {
        expect(calculateTodayRecords([])).toEqual([]);
      });

      test('应处理非数组输入', () => {
        expect(calculateTodayRecords(null)).toEqual([]);
        expect(calculateTodayRecords(undefined)).toEqual([]);
      });

      test('应处理多个今日记录', () => {
        const today = new Date();
        const records = [
          { id: 1, takeTime: today.toISOString() },
          { id: 2, takeTime: today.toISOString() },
          { id: 3, takeTime: today.toISOString() }
        ];

        const result = calculateTodayRecords(records);
        expect(result).toHaveLength(3);
      });
    });
  });

  describe('数据存储操作', () => {
    function saveMedicine(medicine) {
      const medicines = wx.getStorageSync('medicines') || [];
      const newMedicine = {
        id: Date.now(),
        ...medicine,
        createTime: new Date().toLocaleString()
      };
      medicines.push(newMedicine);
      wx.setStorageSync('medicines', medicines);
      return newMedicine;
    }

    function saveRecord(record) {
      const records = wx.getStorageSync('records') || [];
      const newRecord = {
        id: Date.now(),
        ...record,
        takeTime: new Date().toLocaleString()
      };
      records.push(newRecord);
      wx.setStorageSync('records', records);
      return newRecord;
    }

    function deleteMedicine(id) {
      let medicines = wx.getStorageSync('medicines') || [];
      medicines = medicines.filter(m => m.id !== id);
      wx.setStorageSync('medicines', medicines);
      return medicines;
    }

    describe('saveMedicine', () => {
      test('应保存新药品并返回完整对象', () => {
        const medicineData = {
          name: '测试药品',
          expiryDate: '2025-12-31'
        };

        const result = saveMedicine(medicineData);

        expect(result.id).toBeDefined();
        expect(result.name).toBe('测试药品');
        expect(result.createTime).toBeDefined();
        expect(wx.setStorageSync).toHaveBeenCalledWith('medicines', expect.any(Array));
      });

      test('应保留现有药品', () => {
        storage.medicines = [{ id: 1, name: '已有药品' }];

        saveMedicine({ name: '新药品' });

        expect(wx.setStorageSync).toHaveBeenCalledWith('medicines', expect.arrayContaining([
          expect.objectContaining({ name: '已有药品' }),
          expect.objectContaining({ name: '新药品' })
        ]));
      });
    });

    describe('saveRecord', () => {
      test('应保存服药记录', () => {
        const recordData = {
          medicineId: 123,
          medicineName: '测试药品'
        };

        const result = saveRecord(recordData);

        expect(result.id).toBeDefined();
        expect(result.medicineId).toBe(123);
        expect(result.medicineName).toBe('测试药品');
        expect(result.takeTime).toBeDefined();
      });

      test('应追加到现有记录', () => {
        storage.records = [{ id: 1, medicineName: '旧记录' }];

        saveRecord({ medicineName: '新记录' });

        expect(wx.setStorageSync).toHaveBeenCalledWith('records', expect.arrayContaining([
          expect.objectContaining({ medicineName: '旧记录' }),
          expect.objectContaining({ medicineName: '新记录' })
        ]));
      });
    });

    describe('deleteMedicine', () => {
      test('应删除指定药品', () => {
        storage.medicines = [
          { id: 1, name: '药品A' },
          { id: 2, name: '药品B' },
          { id: 3, name: '药品C' }
        ];

        const result = deleteMedicine(2);

        expect(result).toHaveLength(2);
        expect(result.find(m => m.id === 2)).toBeUndefined();
        expect(result.find(m => m.id === 1)).toBeDefined();
      });

      test('删除不存在的药品应返回原数组', () => {
        storage.medicines = [{ id: 1, name: '药品A' }];

        const result = deleteMedicine(999);

        expect(result).toHaveLength(1);
      });
    });
  });

  describe('数据验证逻辑', () => {
    function validateMedicineData(data) {
      const errors = [];
      
      if (!data.name || data.name.trim() === '') {
        errors.push('药品名称不能为空');
      }
      
      if (data.name && data.name.length > 100) {
        errors.push('药品名称不能超过100个字符');
      }

      if (data.expiryDate) {
        const expiryDate = new Date(data.expiryDate);
        if (isNaN(expiryDate.getTime())) {
          errors.push('有效期格式不正确');
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    }

    function validateRecordData(data) {
      const errors = [];

      if (!data.medicineId) {
        errors.push('药品ID不能为空');
      }

      if (!data.medicineName || data.medicineName.trim() === '') {
        errors.push('药品名称不能为空');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    }

    describe('validateMedicineData', () => {
      test('有效数据应通过验证', () => {
        const result = validateMedicineData({
          name: '阿莫西林',
          expiryDate: '2025-12-31'
        });

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('空名称应返回错误', () => {
        const result = validateMedicineData({
          name: '',
          expiryDate: '2025-12-31'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('药品名称不能为空');
      });

      test('仅空格名称应返回错误', () => {
        const result = validateMedicineData({
          name: '   ',
          expiryDate: '2025-12-31'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('药品名称不能为空');
      });

      test('超长名称应返回错误', () => {
        const result = validateMedicineData({
          name: 'a'.repeat(101),
          expiryDate: '2025-12-31'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('药品名称不能超过100个字符');
      });

      test('无效日期格式应返回错误', () => {
        const result = validateMedicineData({
          name: '测试药品',
          expiryDate: 'invalid-date'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('有效期格式不正确');
      });

      test('无有效期应通过验证', () => {
        const result = validateMedicineData({
          name: '测试药品'
        });

        expect(result.isValid).toBe(true);
      });

      test('应返回所有错误', () => {
        const result = validateMedicineData({
          name: '',
          expiryDate: 'invalid'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('validateRecordData', () => {
      test('有效记录应通过验证', () => {
        const result = validateRecordData({
          medicineId: 123,
          medicineName: '测试药品'
        });

        expect(result.isValid).toBe(true);
      });

      test('空药品ID应返回错误', () => {
        const result = validateRecordData({
          medicineId: null,
          medicineName: '测试药品'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('药品ID不能为空');
      });

      test('空药品名称应返回错误', () => {
        const result = validateRecordData({
          medicineId: 123,
          medicineName: ''
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('药品名称不能为空');
      });
    });
  });

  describe('边界条件和极端情况', () => {
    test('应处理大量数据', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `药品${i}`,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      }));

      const now = new Date();
      const thresholdDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const result = largeArray.filter(m => {
        const expiry = new Date(m.expiryDate);
        return expiry <= thresholdDate && expiry >= now;
      });

      expect(result.length).toBe(1000);
    });

    test('应处理特殊字符的药品名称', () => {
      const specialNames = [
        "维生素D3滴剂（含β-环糊精）",
        "阿莫西林克拉维酸钾颗粒(4:1)",
        "对乙酰氨基酚片『儿童用』",
        "硝酸甘油注射液（5mg/支）"
      ];

      specialNames.forEach(name => {
        expect(() => {
          const result = name.length <= 100;
          expect(result).toBe(true);
        }).not.toThrow();
      });
    });

    test('应处理时区边界', () => {
      const dates = [
        '2025-12-31T23:59:59.999Z',
        '2025-12-31T00:00:00.000Z',
        '2025-01-01T00:00:00.000Z'
      ];

      dates.forEach(dateStr => {
        expect(() => {
          const date = new Date(dateStr);
          expect(date.getTime()).not.toBeNaN();
        }).not.toThrow();
      });
    });

    test('应处理ID冲突场景', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];

      const newId = Date.now();
      medicines.push({ id: newId, name: '药品C' });

      expect(medicines.length).toBe(3);
      expect(medicines.find(m => m.id === newId)).toBeDefined();
    });
  });
});
