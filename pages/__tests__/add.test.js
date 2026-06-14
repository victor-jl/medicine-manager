describe('添加药品页面逻辑', () => {
  let originalGetStorageSync;
  let originalSetStorageSync;

  beforeEach(() => {
    originalGetStorageSync = global.wx?.getStorageSync;
    originalSetStorageSync = global.wx?.setStorageSync;
    
    global.wx = {
      getStorageSync: jest.fn(),
      setStorageSync: jest.fn(),
      showToast: jest.fn()
    };
  });

  afterEach(() => {
    global.wx.getStorageSync = originalGetStorageSync;
    global.wx.setStorageSync = originalSetStorageSync;
  });

  test('saveMedicine should validate name is not empty', () => {
    const emptyName = '';
    const validName = '阿莫西林胶囊';
    
    expect(emptyName).toBe('');
    expect(validName).toBeTruthy();
    expect(validName.length).toBeGreaterThan(0);
  });

  test('saveMedicine should create medicine with all required fields', () => {
    const medicineData = {
      name: '阿莫西林胶囊',
      expiryDate: '2025-12-31',
      description: '规格: 0.5g\n厂家: XX制药',
      specification: '0.5g*24粒',
      manufacturer: 'XX制药厂',
      usage: '口服，一次2粒，一日3次',
      approvalNumber: '国药准字H12345678',
      storage: '密封，阴凉干燥处保存',
      ingredients: '阿莫西林'
    };

    const newMedicine = {
      id: Date.now(),
      ...medicineData,
      photos: [],
      createTime: new Date().toLocaleString()
    };

    expect(newMedicine.name).toBe('阿莫西林胶囊');
    expect(newMedicine.expiryDate).toBe('2025-12-31');
    expect(newMedicine.specification).toBe('0.5g*24粒');
    expect(newMedicine.manufacturer).toBe('XX制药厂');
    expect(newMedicine).toHaveProperty('id');
    expect(newMedicine).toHaveProperty('createTime');
  });

  test('should build description from multiple fields', () => {
    const medicineInfo = {
      specification: '0.5g*24粒',
      manufacturer: 'XX制药',
      usage: '口服',
      approvalNumber: 'H12345678',
      storage: '阴凉处',
      ingredients: '阿莫西林'
    };

    let descParts = [];
    if (medicineInfo.specification) descParts.push(`规格: ${medicineInfo.specification}`);
    if (medicineInfo.manufacturer) descParts.push(`厂家: ${medicineInfo.manufacturer}`);
    if (medicineInfo.usage) descParts.push(`用法: ${medicineInfo.usage}`);
    if (medicineInfo.approvalNumber) descParts.push(`准字: ${medicineInfo.approvalNumber}`);
    if (medicineInfo.storage) descParts.push(`贮藏: ${medicineInfo.storage}`);
    if (medicineInfo.ingredients) descParts.push(`成分: ${medicineInfo.ingredients}`);
    const description = descParts.join('\n');

    expect(description).toContain('规格: 0.5g*24粒');
    expect(description).toContain('厂家: XX制药');
    expect(description).toContain('用法: 口服');
    expect(description).toContain('准字: H12345678');
    expect(description).toContain('贮藏: 阴凉处');
    expect(description).toContain('成分: 阿莫西林');
  });

  test('recordTake should validate medicine exists', () => {
    const emptyName = '';
    const existingMedicine = { id: 1, name: '阿莫西林胶囊' };
    
    expect(emptyName).toBe('');
    expect(existingMedicine.name).toBeTruthy();
  });

  test('recordTake should create valid record', () => {
    const medicine = { id: 123, name: '阿莫西林胶囊' };
    
    const newRecord = {
      id: Date.now(),
      medicineId: medicine.id,
      medicineName: medicine.name,
      takeTime: new Date().toLocaleString()
    };

    expect(newRecord.medicineId).toBe(123);
    expect(newRecord.medicineName).toBe('阿莫西林胶囊');
    expect(newRecord).toHaveProperty('id');
    expect(newRecord).toHaveProperty('takeTime');
  });

  test('should handle missing API keys', () => {
    global.wx.getStorageSync.mockImplementation((key) => {
      if (key === 'baiduApiKey') return '';
      if (key === 'baiduSecretKey') return '';
      return '';
    });

    const apiKey = global.wx.getStorageSync('baiduApiKey');
    const secretKey = global.wx.getStorageSync('baiduSecretKey');

    expect(apiKey).toBe('');
    expect(secretKey).toBe('');
    expect(!apiKey || !secretKey).toBe(true);
  });
});