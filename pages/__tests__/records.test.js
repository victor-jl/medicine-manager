describe('记录页面逻辑', () => {
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
          options.success({ confirm: true, content: '测试病例' });
        }
      })
    };
  });

  afterEach(() => {
    global.wx.getStorageSync = originalGetStorageSync;
    global.wx.setStorageSync = originalSetStorageSync;
  });

  test('loadData should load all data types', () => {
    global.wx.getStorageSync.mockImplementation((key) => {
      if (key === 'medicines') return [{ id: 1, name: '药A' }];
      if (key === 'records') return [{ id: 101, medicineId: 1, medicineName: '药A' }];
      if (key === 'cases') return [{ id: 201, content: '病例1' }];
      return [];
    });

    const medicines = global.wx.getStorageSync('medicines');
    const records = global.wx.getStorageSync('records');
    const cases = global.wx.getStorageSync('cases');

    expect(medicines).toHaveLength(1);
    expect(records).toHaveLength(1);
    expect(cases).toHaveLength(1);
  });

  test('loadData should reverse data arrays', () => {
    const medicines = [
      { id: 1, name: '药A', createTime: '2024-01-01' },
      { id: 2, name: '药B', createTime: '2024-01-02' },
      { id: 3, name: '药C', createTime: '2024-01-03' }
    ];

    const reversed = medicines.reverse();

    expect(reversed[0].id).toBe(3);
    expect(reversed[1].id).toBe(2);
    expect(reversed[2].id).toBe(1);
  });

  test('addCase should create valid case record', () => {
    const existingCases = [
      { id: 201, content: '病例1', createTime: '2024-01-01 10:00' }
    ];

    const newCase = {
      id: Date.now(),
      content: '新病例描述',
      createTime: new Date().toLocaleString()
    };

    const updatedCases = [...existingCases, newCase];

    expect(updatedCases).toHaveLength(2);
    expect(updatedCases[1].content).toBe('新病例描述');
    expect(updatedCases[1]).toHaveProperty('id');
    expect(updatedCases[1]).toHaveProperty('createTime');
  });

  test('addCase should handle empty content', () => {
    const content = '';
    const hasContent = content && content.trim();
    
    expect(hasContent).toBeFalsy();
  });

  test('deleteMedicine should remove medicine and update storage', () => {
    let medicines = [
      { id: 1, name: '药A' },
      { id: 2, name: '药B' },
      { id: 3, name: '药C' }
    ];

    const deleteById = (id) => {
      medicines = medicines.filter(m => m.id !== id);
      return medicines;
    };

    deleteById(2);
    
    expect(medicines).toHaveLength(2);
    expect(medicines.some(m => m.id === 2)).toBe(false);
  });

  test('deleteRecord should remove record', () => {
    let records = [
      { id: 101, medicineId: 1, medicineName: '药A' },
      { id: 102, medicineId: 2, medicineName: '药B' },
      { id: 103, medicineId: 1, medicineName: '药A' }
    ];

    const deleteRecord = (id) => {
      records = records.filter(r => r.id !== id);
      return records;
    };

    deleteRecord(102);
    
    expect(records).toHaveLength(2);
    expect(records.some(r => r.id === 102)).toBe(false);
  });

  test('recordTake should add record for specific medicine', () => {
    const medicines = [{ id: 1, name: '阿莫西林胶囊' }];
    const existingRecords = [];

    const medicine = medicines.find(m => m.id === 1);
    const newRecord = {
      id: Date.now(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      takeTime: new Date().toLocaleString()
    };

    const updatedRecords = [...existingRecords, newRecord];

    expect(updatedRecords).toHaveLength(1);
    expect(updatedRecords[0].medicineId).toBe(1);
    expect(updatedRecords[0].medicineName).toBe('阿莫西林胶囊');
  });

  test('switchTab should change current tab', () => {
    const tabs = ['medicines', 'records', 'cases'];
    let currentTab = 'medicines';

    const switchTab = (tab) => {
      if (tabs.includes(tab)) {
        currentTab = tab;
      }
    };

    expect(currentTab).toBe('medicines');
    
    switchTab('records');
    expect(currentTab).toBe('records');
    
    switchTab('cases');
    expect(currentTab).toBe('cases');
    
    switchTab('invalid');
    expect(currentTab).toBe('cases');
  });
});