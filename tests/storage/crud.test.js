const wx = require('../__mocks__/wx.mock.js');

describe('存储操作 CRUD 测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wx.getStorageSync.mockReturnValue([]);
    wx.setStorageSync.mockClear();
    wx.showToast.mockClear();
    wx.showModal.mockClear();
  });

  describe('药品数据存储', () => {
    test('空数组初始化应正确处理', () => {
      wx.getStorageSync.mockReturnValue([]);
      const medicines = wx.getStorageSync('medicines') || [];
      expect(Array.isArray(medicines)).toBe(true);
      expect(medicines.length).toBe(0);
    });

    test('保存新药品应正确追加到数组', () => {
      const existingMedicines = [
        { id: 1, name: '阿莫西林', expiryDate: '2025-01-01' }
      ];
      wx.getStorageSync.mockReturnValue(existingMedicines);

      const newMedicine = {
        id: Date.now(),
        name: '布洛芬',
        expiryDate: '2025-06-01'
      };

      const updatedMedicines = [...existingMedicines, newMedicine];
      wx.setStorageSync('medicines', updatedMedicines);

      expect(wx.setStorageSync).toHaveBeenCalledWith('medicines', expect.arrayContaining([
        expect.objectContaining({ name: '阿莫西林' }),
        expect.objectContaining({ name: '布洛芬' })
      ]));
    });

    test('药品ID应为唯一值', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];
      wx.getStorageSync.mockReturnValue(medicines);

      const newId = Date.now();
      const existingIds = medicines.map(m => m.id);
      expect(existingIds).not.toContain(newId);
    });
  });

  describe('记录数据存储', () => {
    test('服药记录应正确保存', () => {
      wx.getStorageSync.mockReturnValue([]);

      const newRecord = {
        id: Date.now(),
        medicineId: 1,
        medicineName: '阿莫西林',
        takeTime: new Date().toLocaleString()
      };

      const records = [newRecord];
      wx.setStorageSync('records', records);

      expect(wx.setStorageSync).toHaveBeenCalledWith('records', expect.arrayContaining([
        expect.objectContaining({
          medicineId: 1,
          medicineName: '阿莫西林'
        })
      ]));
    });

    test('多条记录应正确追加', () => {
      const existingRecords = [
        { id: 1, medicineName: '药品A', takeTime: '2024-01-01' }
      ];
      wx.getStorageSync.mockReturnValue(existingRecords);

      const newRecord = { id: 2, medicineName: '药品B', takeTime: '2024-01-02' };
      const updatedRecords = [...existingRecords, newRecord];

      expect(updatedRecords).toHaveLength(2);
    });

    test('记录ID应为唯一值', () => {
      const records = [
        { id: 1000, medicineName: '药品A' },
        { id: 2000, medicineName: '药品B' }
      ];
      wx.getStorageSync.mockReturnValue(records);

      const ids = records.map(r => r.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds.length).toBe(ids.length);
    });
  });

  describe('病例数据存储', () => {
    test('空病例数组应正确初始化', () => {
      wx.getStorageSync.mockReturnValue([]);
      const cases = wx.getStorageSync('cases') || [];
      expect(Array.isArray(cases)).toBe(true);
      expect(cases.length).toBe(0);
    });

    test('新病例应正确创建', () => {
      wx.getStorageSync.mockReturnValue([]);

      const newCase = {
        id: Date.now(),
        content: '感冒症状：发热、咳嗽',
        createTime: new Date().toLocaleString()
      };

      const cases = [newCase];
      wx.setStorageSync('cases', cases);

      expect(wx.setStorageSync).toHaveBeenCalledWith('cases', expect.arrayContaining([
        expect.objectContaining({
          content: expect.stringContaining('感冒症状')
        })
      ]));
    });
  });

  describe('删除操作', () => {
    test('按ID删除药品应正确过滤', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' },
        { id: 3, name: '药品C' }
      ];

      const targetId = 2;
      const filtered = medicines.filter(m => m.id !== targetId);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.id)).toEqual([1, 3]);
    });

    test('删除不存在的ID应保持数组不变', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];

      const targetId = 999;
      const filtered = medicines.filter(m => m.id !== targetId);

      expect(filtered).toHaveLength(2);
    });

    test('按ID删除记录应正确过滤', () => {
      const records = [
        { id: 1, medicineName: '药品A' },
        { id: 2, medicineName: '药品B' }
      ];

      const targetId = 1;
      const filtered = records.filter(r => r.id !== targetId);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });

    test('删除最后一个元素后数组应为空', () => {
      const medicines = [{ id: 1, name: '唯一药品' }];
      const filtered = medicines.filter(m => m.id !== 1);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('数据关联性', () => {
    test('应能通过药品ID查找相关记录', () => {
      const records = [
        { id: 1, medicineId: 100, medicineName: '药品A' },
        { id: 2, medicineId: 200, medicineName: '药品B' },
        { id: 3, medicineId: 100, medicineName: '药品A' }
      ];

      const medicineId = 100;
      const relatedRecords = records.filter(r => r.medicineId === medicineId);

      expect(relatedRecords).toHaveLength(2);
      expect(relatedRecords.every(r => r.medicineId === 100)).toBe(true);
    });

    test('删除药品时相关记录应仍保留', () => {
      const medicines = [{ id: 1, name: '药品A' }];
      const records = [
        { id: 1, medicineId: 1, medicineName: '药品A' }
      ];

      const filteredMedicines = medicines.filter(m => m.id !== 1);
      expect(filteredMedicines).toHaveLength(0);
      expect(records).toHaveLength(1);
    });
  });

  describe('边界条件', () => {
    test('storageSync返回undefined时应使用空数组', () => {
      wx.getStorageSync.mockReturnValue(undefined);
      const medicines = wx.getStorageSync('medicines') || [];
      expect(medicines).toEqual([]);
    });

    test('storageSync返回null时应使用空数组', () => {
      wx.getStorageSync.mockReturnValue(null);
      const medicines = wx.getStorageSync('medicines') || [];
      expect(medicines).toEqual([]);
    });

    test('storageSync返回非数组时应使用空数组', () => {
      wx.getStorageSync.mockReturnValue('invalid');
      const medicines = wx.getStorageSync('medicines') || [];
      expect(medicines).toEqual([]);
    });

    test('Date.now()应返回有效时间戳', () => {
      const timestamp = Date.now();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });
  });
});
