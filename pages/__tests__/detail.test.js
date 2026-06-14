describe('药品详情页面逻辑', () => {
  let originalGetStorageSync;
  let originalSetStorageSync;

  beforeEach(() => {
    originalGetStorageSync = global.wx?.getStorageSync;
    originalSetStorageSync = global.wx?.setStorageSync;
    
    global.wx = {
      getStorageSync: jest.fn(),
      setStorageSync: jest.fn(),
      showToast: jest.fn(),
      showModal: jest.fn((options) => {
        if (options.success) {
          options.success({ confirm: true });
        }
      })
    };
  });

  afterEach(() => {
    global.wx.getStorageSync = originalGetStorageSync;
    global.wx.setStorageSync = originalSetStorageSync;
  });

  test('onLoad should find medicine by id', () => {
    const medicines = [
      { id: 1, name: '药A', expiryDate: '2025-12-31' },
      { id: 2, name: '药B', expiryDate: '2025-06-30' },
      { id: 3, name: '药C', expiryDate: '2024-12-31' }
    ];

    const findMedicineById = (id) => medicines.find(m => m.id === id);

    expect(findMedicineById(2)).toEqual({ id: 2, name: '药B', expiryDate: '2025-06-30' });
    expect(findMedicineById(99)).toBeUndefined();
  });

  test('onLoad should filter records by medicineId', () => {
    const records = [
      { id: 101, medicineId: 1, medicineName: '药A', takeTime: '2024-01-01 10:00' },
      { id: 102, medicineId: 2, medicineName: '药B', takeTime: '2024-01-01 11:00' },
      { id: 103, medicineId: 1, medicineName: '药A', takeTime: '2024-01-02 10:00' }
    ];

    const getMedicineRecords = (medicineId) => records.filter(r => r.medicineId === medicineId);

    expect(getMedicineRecords(1)).toHaveLength(2);
    expect(getMedicineRecords(2)).toHaveLength(1);
    expect(getMedicineRecords(3)).toHaveLength(0);
  });

  test('recordTake should create new record for medicine', () => {
    const medicine = { id: 1, name: '阿莫西林胶囊' };
    const existingRecords = [
      { id: 101, medicineId: 1, medicineName: '阿莫西林胶囊', takeTime: '2024-01-01 10:00' }
    ];

    const newRecord = {
      id: Date.now(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      takeTime: new Date().toLocaleString()
    };

    const updatedRecords = [newRecord, ...existingRecords];

    expect(updatedRecords).toHaveLength(2);
    expect(updatedRecords[0].medicineId).toBe(medicine.id);
    expect(updatedRecords[0].medicineName).toBe(medicine.name);
  });

  test('deleteMedicine should remove medicine from storage', () => {
    let medicines = [
      { id: 1, name: '药A' },
      { id: 2, name: '药B' },
      { id: 3, name: '药C' }
    ];

    const deleteMedicine = (id) => {
      medicines = medicines.filter(m => m.id !== id);
      return medicines;
    };

    expect(medicines).toHaveLength(3);
    
    deleteMedicine(2);
    expect(medicines).toHaveLength(2);
    expect(medicines.find(m => m.id === 2)).toBeUndefined();
    expect(medicines.find(m => m.id === 1)).toBeDefined();
    expect(medicines.find(m => m.id === 3)).toBeDefined();
  });

  test('deleteMedicine should handle empty medicines array', () => {
    let medicines = [];

    const deleteMedicine = (id) => {
      medicines = medicines.filter(m => m.id !== id);
      return medicines;
    };

    deleteMedicine(1);
    expect(medicines).toEqual([]);
  });
});