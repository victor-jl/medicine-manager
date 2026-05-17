const storage = require('../storage');

global.wx = {
  getStorageSync: jest.fn(() => []),
  setStorageSync: jest.fn()
};

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.wx.getStorageSync.mockImplementation((key) => {
      if (key === 'medicines') return [];
      if (key === 'records') return [];
      if (key === 'cases') return [];
      return [];
    });
  });

  describe('medicine operations', () => {
    test('getMedicines should return empty array when no data', () => {
      expect(storage.getMedicines()).toEqual([]);
      expect(wx.getStorageSync).toHaveBeenCalledWith('medicines');
    });

    test('saveMedicine should add new medicine', () => {
      const medicine = { id: 1, name: 'Test Medicine', expiryDate: '2025-12-31' };
      storage.saveMedicine(medicine);
      expect(wx.setStorageSync).toHaveBeenCalledWith('medicines', [medicine]);
    });

    test('saveMedicine should update existing medicine', () => {
      const existingMedicine = { id: 1, name: 'Old Name', expiryDate: '2025-12-31' };
      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'medicines') return [existingMedicine];
        return [];
      });

      const updatedMedicine = { id: 1, name: 'New Name', expiryDate: '2025-12-31' };
      storage.saveMedicine(updatedMedicine);

      expect(wx.setStorageSync).toHaveBeenCalledWith('medicines', [updatedMedicine]);
    });

    test('deleteMedicine should remove medicine', () => {
      const medicine1 = { id: 1, name: 'Medicine 1' };
      const medicine2 = { id: 2, name: 'Medicine 2' };
      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'medicines') return [medicine1, medicine2];
        return [];
      });

      storage.deleteMedicine(1);
      expect(wx.setStorageSync).toHaveBeenCalledWith('medicines', [medicine2]);
    });

    test('getExpiringMedicines should return medicines expiring within days', () => {
      const now = new Date();
      const expiringSoon = { id: 1, name: 'Expiring', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] };
      const notExpiring = { id: 2, name: 'Not Expiring', expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] };
      const alreadyExpired = { id: 3, name: 'Expired', expiryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] };
      const noExpiry = { id: 4, name: 'No Expiry' };

      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'medicines') return [expiringSoon, notExpiring, alreadyExpired, noExpiry];
        return [];
      });

      const result = storage.getExpiringMedicines(30);
      expect(result).toEqual([expiringSoon]);
    });
  });

  describe('record operations', () => {
    test('getRecords should return empty array when no data', () => {
      expect(storage.getRecords()).toEqual([]);
    });

    test('saveRecord should add new record', () => {
      const record = { id: 1, medicineId: 1, medicineName: 'Test', takeTime: '2024-01-01 10:00' };
      storage.saveRecord(record);
      expect(wx.setStorageSync).toHaveBeenCalledWith('records', [record]);
    });

    test('deleteRecord should remove record', () => {
      const record1 = { id: 1, medicineId: 1 };
      const record2 = { id: 2, medicineId: 1 };
      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'records') return [record1, record2];
        return [];
      });

      storage.deleteRecord(1);
      expect(wx.setStorageSync).toHaveBeenCalledWith('records', [record2]);
    });

    test('getRecordsByMedicineId should filter records', () => {
      const record1 = { id: 1, medicineId: 1 };
      const record2 = { id: 2, medicineId: 2 };
      const record3 = { id: 3, medicineId: 1 };
      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'records') return [record1, record2, record3];
        return [];
      });

      const result = storage.getRecordsByMedicineId(1);
      expect(result).toEqual([record3, record1]);
    });
  });

  describe('case operations', () => {
    test('getCases should return empty array when no data', () => {
      expect(storage.getCases()).toEqual([]);
    });

    test('saveCase should add new case', () => {
      const caseItem = { id: 1, content: 'Test case', createTime: '2024-01-01' };
      storage.saveCase(caseItem);
      expect(wx.setStorageSync).toHaveBeenCalledWith('cases', [caseItem]);
    });

    test('deleteCase should remove case', () => {
      const case1 = { id: 1, content: 'Case 1' };
      const case2 = { id: 2, content: 'Case 2' };
      global.wx.getStorageSync.mockImplementation((key) => {
        if (key === 'cases') return [case1, case2];
        return [];
      });

      storage.deleteCase(1);
      expect(wx.setStorageSync).toHaveBeenCalledWith('cases', [case2]);
    });
  });
});
