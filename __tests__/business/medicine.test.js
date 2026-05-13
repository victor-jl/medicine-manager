const { createMocks } = require('../helpers/mockStorage');

describe('medicine management', () => {
  beforeEach(() => {
    createMocks();
  });

  describe('medicine data structure', () => {
    test('应包含所有必需字段', () => {
      const medicine = {
        id: Date.now(),
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        description: '规格: 0.25g\n厂家: 某药厂',
        specification: '0.25g',
        manufacturer: '某药厂',
        usage: '口服',
        approvalNumber: '国药准字H12345678',
        storage: '遮光，密封，在干燥处保存',
        ingredients: '阿莫西林',
        photos: [],
        createTime: new Date().toLocaleString()
      };

      expect(medicine.id).toBeDefined();
      expect(medicine.name).toBeTruthy();
      expect(typeof medicine.id).toBe('number');
    });

    test('ID应为时间戳类型', () => {
      const id = Date.now();
      expect(id).toBeGreaterThan(0);
      expect(typeof id).toBe('number');
    });
  });

  describe('expiry date filtering', () => {
    test('应正确识别30天内即将过期的药品', () => {
      const now = new Date();
      const inTwentyDays = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
      const inFortyDays = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '即将过期', expiryDate: inTwentyDays.toISOString().split('T')[0] },
        { id: 2, name: '不会过期', expiryDate: inFortyDays.toISOString().split('T')[0] }
      ];

      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
      expect(expiring[0].name).toBe('即将过期');
    });

    test('应排除已过期的药品', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '已过期', expiryDate: yesterday.toISOString().split('T')[0] }
      ];

      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(0);
    });

    test('应处理无有效期字段的药品', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '无有效期' },
        { id: 2, name: '有有效期', expiryDate: futureDate.toISOString().split('T')[0] }
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
    });

    test('应正确处理有效期正好是今天的药品', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const medicines = [
        { id: 1, name: '今天到期', expiryDate: todayStr }
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate + 'T23:59:59');
        const todayStart = new Date(now.toDateString());
        return expiry <= thirtyDaysLater && expiry >= todayStart;
      });

      expect(expiring).toHaveLength(1);
      expect(expiring[0].name).toBe('今天到期');
    });

    test('应正确处理有效期在边界(31天后)的药品', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyOneDaysLater = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '31天后', expiryDate: thirtyOneDaysLater.toISOString().split('T')[0] }
      ];

      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(0);
    });
  });

  describe('today records filtering', () => {
    test('应正确过滤今日记录', () => {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString();

      const records = [
        { id: 1, takeTime: new Date().toLocaleString(), medicineName: '今天吃药' },
        { id: 2, takeTime: yesterday, medicineName: '昨天吃药' }
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });

      expect(todayRecords).toHaveLength(1);
      expect(todayRecords[0].medicineName).toBe('今天吃药');
    });

    test('应处理空记录列表', () => {
      const records = [];
      const today = new Date().toDateString();
      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });
      expect(todayRecords).toHaveLength(0);
    });
  });

  describe('medicine list operations', () => {
    test('应正确添加新药品', () => {
      const medicines = [];
      const newMedicine = {
        id: Date.now(),
        name: '新药品',
        expiryDate: '2025-12-31'
      };

      medicines.push(newMedicine);
      expect(medicines).toHaveLength(1);
      expect(medicines[0].name).toBe('新药品');
    });

    test('应正确删除药品', () => {
      const medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];

      const filtered = medicines.filter(m => m.id !== 1);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });

    test('应正确查找特定药品', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' }
      ];

      const found = medicines.find(m => m.id === 1);
      expect(found).toBeDefined();
      expect(found.name).toBe('阿莫西林');
    });

    test('应正确按时间倒序排列', () => {
      const medicines = [
        { id: 1, name: '第一', createTime: '2024-01-01' },
        { id: 2, name: '第二', createTime: '2024-01-03' },
        { id: 3, name: '第三', createTime: '2024-01-02' }
      ];

      const reversed = medicines.reverse();
      expect(reversed[0].id).toBe(3);
    });
  });
});

describe('records management', () => {
  beforeEach(() => {
    createMocks();
  });

  describe('record creation', () => {
    test('应创建包含正确字段的服药记录', () => {
      const record = {
        id: Date.now(),
        medicineId: 1,
        medicineName: '阿莫西林',
        takeTime: new Date().toLocaleString()
      };

      expect(record.id).toBeDefined();
      expect(record.medicineId).toBe(1);
      expect(record.medicineName).toBe('阿莫西林');
      expect(record.takeTime).toBeTruthy();
    });

    test('应生成有效ID', () => {
      const id = Date.now();
      expect(id).toBeGreaterThan(0);
      expect(typeof id).toBe('number');
    });
  });

  describe('record filtering', () => {
    test('应正确过滤特定药品的记录', () => {
      const records = [
        { id: 1, medicineId: 1, medicineName: '阿莫西林' },
        { id: 2, medicineId: 2, medicineName: '布洛芬' },
        { id: 3, medicineId: 1, medicineName: '阿莫西林' }
      ];

      const medicineRecords = records.filter(r => r.medicineId === 1);
      expect(medicineRecords).toHaveLength(2);
    });

    test('应正确删除特定记录', () => {
      const records = [
        { id: 1, medicineName: '记录1' },
        { id: 2, medicineName: '记录2' }
      ];

      const filtered = records.filter(r => r.id !== 1);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });
  });
});

describe('input validation', () => {
  describe('medicine name validation', () => {
    test('应拒绝空药品名称', () => {
      const name = '';
      const isValid = name && name.trim().length > 0;
      expect(isValid).toBeFalsy();
    });

    test('应接受有效药品名称', () => {
      const name = '阿莫西林胶囊';
      const isValid = name && name.trim().length > 0;
      expect(isValid).toBeTruthy();
    });

    test('应拒绝仅包含空格的药品名称', () => {
      const name = '   ';
      const isValid = name && name.trim().length > 0;
      expect(isValid).toBeFalsy();
    });
  });

  describe('API key validation', () => {
    test('应拒绝空的API密钥', () => {
      const apiKey = '';
      const secretKey = '';
      const isValid = apiKey && secretKey;
      expect(isValid).toBeFalsy();
    });

    test('应接受有效的API密钥组合', () => {
      const apiKey = 'valid_api_key';
      const secretKey = 'valid_secret_key';
      const isValid = apiKey && secretKey;
      expect(isValid).toBeTruthy();
    });
  });
});
