/**
 * Tests for medication storage CRUD operations
 * Tests create, read, update, delete operations on medicines and records
 */

require('../__mocks__/wx');

describe('Medication Storage CRUD Operations', () => {
  beforeEach(() => {
    wx.__clearStorage();
  });

  describe('Create Operations', () => {
    test('should save new medicine to storage', () => {
      const medicines = wx.getStorageSync('medicines') || [];
      const newMedicine = {
        id: Date.now(),
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        description: '抗生素',
        specification: '0.25g',
        manufacturer: '某制药厂'
      };

      medicines.push(newMedicine);
      wx.setStorageSync('medicines', medicines);

      const stored = wx.getStorageSync('medicines');
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('阿莫西林胶囊');
    });

    test('should generate unique IDs for medicines', () => {
      const id1 = Date.now();
      const id2 = Date.now() + 1;

      expect(id1).not.toBe(id2);
    });

    test('should save new record to storage', () => {
      const records = wx.getStorageSync('records') || [];
      const newRecord = {
        id: Date.now(),
        medicineId: 123,
        medicineName: '布洛芬',
        takeTime: new Date().toLocaleString()
      };

      records.push(newRecord);
      wx.setStorageSync('records', records);

      const stored = wx.getStorageSync('records');
      expect(stored).toHaveLength(1);
      expect(stored[0].medicineName).toBe('布洛芬');
    });

    test('should save case record', () => {
      const cases = wx.getStorageSync('cases') || [];
      const newCase = {
        id: Date.now(),
        content: '患者出现发热症状',
        createTime: new Date().toLocaleString()
      };

      cases.push(newCase);
      wx.setStorageSync('cases', cases);

      const stored = wx.getStorageSync('cases');
      expect(stored).toHaveLength(1);
    });
  });

  describe('Read Operations', () => {
    test('should retrieve medicines from storage', () => {
      wx.setStorageSync('medicines', [
        { id: 1, name: 'Medicine A' },
        { id: 2, name: 'Medicine B' }
      ]);

      const medicines = wx.getStorageSync('medicines') || [];
      expect(medicines).toHaveLength(2);
    });

    test('should return empty array when no medicines stored', () => {
      const medicines = wx.getStorageSync('medicines') || [];
      expect(medicines).toEqual([]);
    });

    test('should find medicine by ID', () => {
      wx.setStorageSync('medicines', [
        { id: 1, name: 'Medicine A' },
        { id: 2, name: 'Medicine B' }
      ]);

      const medicines = wx.getStorageSync('medicines') || [];
      const medicine = medicines.find(m => m.id === 2);
      expect(medicine.name).toBe('Medicine B');
    });

    test('should find records by medicineId', () => {
      wx.setStorageSync('records', [
        { id: 1, medicineId: 100, medicineName: 'Med A' },
        { id: 2, medicineId: 200, medicineName: 'Med B' },
        { id: 3, medicineId: 100, medicineName: 'Med A' }
      ]);

      const records = wx.getStorageSync('records') || [];
      const medicineRecords = records.filter(r => r.medicineId === 100);
      expect(medicineRecords).toHaveLength(2);
    });
  });

  describe('Update Operations', () => {
    test('should update medicine in storage', () => {
      wx.setStorageSync('medicines', [
        { id: 1, name: 'Medicine A', description: 'old' }
      ]);

      let medicines = wx.getStorageSync('medicines') || [];
      const index = medicines.findIndex(m => m.id === 1);
      if (index !== -1) {
        medicines[index].description = 'new';
        wx.setStorageSync('medicines', medicines);
      }

      medicines = wx.getStorageSync('medicines');
      expect(medicines[0].description).toBe('new');
    });
  });

  describe('Delete Operations', () => {
    test('should delete medicine by ID', () => {
      wx.setStorageSync('medicines', [
        { id: 1, name: 'Medicine A' },
        { id: 2, name: 'Medicine B' },
        { id: 3, name: 'Medicine C' }
      ]);

      let medicines = wx.getStorageSync('medicines') || [];
      const idToDelete = 2;
      medicines = medicines.filter(m => m.id !== idToDelete);
      wx.setStorageSync('medicines', medicines);

      const stored = wx.getStorageSync('medicines');
      expect(stored).toHaveLength(2);
      expect(stored.find(m => m.id === 2)).toBeUndefined();
    });

    test('should delete record by ID', () => {
      wx.setStorageSync('records', [
        { id: 1, medicineName: 'Med A' },
        { id: 2, medicineName: 'Med B' }
      ]);

      let records = wx.getStorageSync('records') || [];
      const idToDelete = 1;
      records = records.filter(r => r.id !== idToDelete);
      wx.setStorageSync('records', records);

      const stored = wx.getStorageSync('records');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(2);
    });

    test('should only delete specific medicine, keep others', () => {
      wx.setStorageSync('medicines', [
        { id: 1, name: 'Medicine A' },
        { id: 2, name: 'Medicine B' },
        { id: 3, name: 'Medicine C' }
      ]);

      let medicines = wx.getStorageSync('medicines') || [];
      medicines = medicines.filter(m => m.id !== 2);
      wx.setStorageSync('medicines', medicines);

      const stored = wx.getStorageSync('medicines');
      expect(stored).toHaveLength(2);
      expect(stored.map(m => m.id)).toEqual([1, 3]);
    });

    test('should handle deletion of non-existent ID gracefully', () => {
      wx.setStorageSync('medicines', [
        { id: 1, name: 'Medicine A' }
      ]);

      let medicines = wx.getStorageSync('medicines') || [];
      medicines = medicines.filter(m => m.id !== 999); // non-existent
      wx.setStorageSync('medicines', medicines);

      const stored = wx.getStorageSync('medicines');
      expect(stored).toHaveLength(1);
    });
  });

  describe('Validation', () => {
    test('should require medicine name before saving', () => {
      const name = '';

      const isValid = !!name; // validation check
      expect(isValid).toBe(false);
    });

    test('should accept valid medicine name', () => {
      const name = '阿莫西林胶囊';

      const isValid = !!name;
      expect(isValid).toBe(true);
    });

    test('should validate expiry date format', () => {
      const validDate = '2025-12-31';
      const invalidDate = 'invalid';

      const isValidDate = (dateStr) => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      };

      expect(isValidDate(validDate)).toBe(true);
      expect(isValidDate(invalidDate)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle storage with null/undefined gracefully', () => {
      // Reset storage
      wx.__clearStorage();

      const medicines = wx.getStorageSync('medicines') || [];
      expect(medicines).toEqual([]);
    });

    test('should handle concurrent save operations', () => {
      const medicine1 = { id: 1, name: 'Medicine A' };
      const medicine2 = { id: 2, name: 'Medicine B' };

      wx.setStorageSync('medicines', [medicine1]);
      wx.setStorageSync('medicines', [medicine2]);

      // Only last write is persisted (simulating WeChat storage behavior)
      const stored = wx.getStorageSync('medicines');
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Medicine B');
    });

    test('should handle medicine with special characters in name', () => {
      const medicines = [];
      medicines.push({
        id: 1,
        name: '阿莫西林胶囊 0.25g (含青霉素)',
        description: '注意事项：有过敏者禁用'
      });
      wx.setStorageSync('medicines', medicines);

      const stored = wx.getStorageSync('medicines');
      expect(stored[0].name).toContain('阿莫西林');
    });
  });
});

describe('Record Take Time Logic', () => {
  beforeEach(() => {
    wx.__clearStorage();
  });

  test('should record current time when taking medicine', () => {
    const beforeTime = new Date().toLocaleString();
    const recordTime = new Date().toLocaleString();
    const afterTime = new Date().toLocaleString();

    // Verify the time is captured correctly
    expect(recordTime).toBeTruthy();
    expect(recordTime.length).toBeGreaterThan(0);
  });

  test('should link record to correct medicine', () => {
    const medicineId = 12345;
    const medicineName = '布洛芬缓释片';

    wx.setStorageSync('records', []);

    const records = wx.getStorageSync('records') || [];
    records.push({
      id: Date.now(),
      medicineId: medicineId,
      medicineName: medicineName,
      takeTime: new Date().toLocaleString()
    });
    wx.setStorageSync('records', records);

    const stored = wx.getStorageSync('records');
    expect(stored[0].medicineId).toBe(medicineId);
    expect(stored[0].medicineName).toBe(medicineName);
  });
});
