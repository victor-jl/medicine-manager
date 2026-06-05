describe('Add Page Logic', () => {
  let originalGetStorageSync;
  let originalSetStorageSync;
  let storageData = {};

  beforeEach(() => {
    originalGetStorageSync = wx.getStorageSync;
    originalSetStorageSync = wx.setStorageSync;

    wx.getStorageSync = (key) => storageData[key] || [];
    wx.setStorageSync = (key, value) => { storageData[key] = value; };
  });

  afterEach(() => {
    wx.getStorageSync = originalGetStorageSync;
    wx.setStorageSync = originalSetStorageSync;
    storageData = {};
  });

  test('药品数据完整性验证', () => {
    const validateMedicine = (medicine) => {
      if (!medicine.name || medicine.name.trim() === '') {
        return { valid: false, message: '请输入药品名称' };
      }
      if (!medicine.expiryDate) {
        return { valid: false, message: '请选择有效期' };
      }
      return { valid: true, message: '' };
    };

    expect(validateMedicine({ name: '', expiryDate: '2025-12-31' })).toEqual({ valid: false, message: '请输入药品名称' });
    expect(validateMedicine({ name: '阿莫西林', expiryDate: '' })).toEqual({ valid: false, message: '请选择有效期' });
    expect(validateMedicine({ name: '阿莫西林', expiryDate: '2025-12-31' })).toEqual({ valid: true, message: '' });
  });

  test('药品保存逻辑', () => {
    const saveMedicine = (medicineData) => {
      const medicines = wx.getStorageSync('medicines') || [];
      const newMedicine = {
        id: Date.now(),
        name: medicineData.name,
        expiryDate: medicineData.expiryDate,
        description: medicineData.description || '',
        specification: medicineData.specification || '',
        manufacturer: medicineData.manufacturer || '',
        usage: medicineData.usage || '',
        approvalNumber: medicineData.approvalNumber || '',
        storage: medicineData.storage || '',
        ingredients: medicineData.ingredients || '',
        photos: medicineData.photos || [],
        createTime: new Date().toLocaleString()
      };
      medicines.push(newMedicine);
      wx.setStorageSync('medicines', medicines);
      return newMedicine;
    };

    const result = saveMedicine({
      name: '布洛芬片',
      expiryDate: '2025-12-31',
      specification: '0.2g*100片',
      manufacturer: 'XX制药'
    });

    const stored = wx.getStorageSync('medicines');
    
    expect(stored.length).toBe(1);
    expect(stored[0].name).toBe('布洛芬片');
    expect(stored[0].expiryDate).toBe('2025-12-31');
    expect(stored[0].specification).toBe('0.2g*100片');
    expect(stored[0].manufacturer).toBe('XX制药');
    expect(stored[0].id).toBeDefined();
    expect(stored[0].createTime).toBeDefined();
  });

  test('API配置保存', () => {
    const saveApiConfig = (apiKey, secretKey) => {
      wx.setStorageSync('baiduApiKey', apiKey);
      wx.setStorageSync('baiduSecretKey', secretKey);
    };

    saveApiConfig('test_key', 'test_secret');
    
    expect(wx.getStorageSync('baiduApiKey')).toBe('test_key');
    expect(wx.getStorageSync('baiduSecretKey')).toBe('test_secret');
  });

  test('空名称不允许保存', () => {
    const canSave = (name) => {
      return !!name && name.trim() !== '';
    };

    expect(canSave('')).toBe(false);
    expect(canSave('   ')).toBe(false);
    expect(canSave(null)).toBe(false);
    expect(canSave(undefined)).toBe(false);
    expect(canSave('阿莫西林')).toBe(true);
  });
});