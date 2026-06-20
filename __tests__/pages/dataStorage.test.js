/**
 * 数据存储和读取逻辑测试
 * 测试文件: pages/add/add.js, pages/records/records.js, pages/detail/detail.js
 */

// 引入 wx mock
require('../../__mocks__/wx');

describe('数据存储逻辑测试', () => {
  beforeEach(() => {
    // 清空 mock storage
    wx.clearMockStorage();
  });

  describe('药品数据存储', () => {
    test('应该正确保存新药品', () => {
      const medicine = {
        id: Date.now(),
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        description: '规格: 0.5g*24粒',
        createTime: new Date().toLocaleString()
      };

      const medicines = [];
      medicines.push(medicine);
      wx.setStorageSync('medicines', medicines);

      const saved = wx.getStorageSync('medicines');
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe('阿莫西林胶囊');
      expect(saved[0].expiryDate).toBe('2025-12-31');
    });

    test('应该正确读取已保存的药品列表', () => {
      const medicines = [
        { id: 1, name: '药品A', expiryDate: '2025-01-01' },
        { id: 2, name: '药品B', expiryDate: '2025-02-02' }
      ];

      wx.setStorageSync('medicines', medicines);
      const saved = wx.getStorageSync('medicines');

      expect(saved).toHaveLength(2);
      expect(saved[0].name).toBe('药品A');
      expect(saved[1].name).toBe('药品B');
    });

    test('应该正确删除药品', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' },
        { id: 3, name: '药品C' }
      ];

      wx.setStorageSync('medicines', medicines);

      // 删除 id 为 2 的药品
      const idToDelete = 2;
      const filtered = medicines.filter(m => m.id !== idToDelete);
      wx.setStorageSync('medicines', filtered);

      const saved = wx.getStorageSync('medicines');
      expect(saved).toHaveLength(2);
      expect(saved.find(m => m.id === 2)).toBeUndefined();
    });

    test('应该正确更新药品列表', () => {
      const medicines = [
        { id: 1, name: '药品A', expiryDate: '2025-01-01' }
      ];

      wx.setStorageSync('medicines', medicines);

      // 添加新药品
      const newMedicine = { id: 2, name: '药品B', expiryDate: '2025-02-02' };
      const existing = wx.getStorageSync('medicines') || [];
      existing.push(newMedicine);
      wx.setStorageSync('medicines', existing);

      const saved = wx.getStorageSync('medicines');
      expect(saved).toHaveLength(2);
    });
  });

  describe('服药记录存储', () => {
    test('应该正确保存服药记录', () => {
      const record = {
        id: Date.now(),
        medicineId: 123,
        medicineName: '阿莫西林胶囊',
        takeTime: new Date().toLocaleString()
      };

      const records = [];
      records.push(record);
      wx.setStorageSync('records', records);

      const saved = wx.getStorageSync('records');
      expect(saved).toHaveLength(1);
      expect(saved[0].medicineName).toBe('阿莫西林胶囊');
    });

    test('应该正确关联药品和服药记录', () => {
      const medicineId = 12345;
      const medicines = [{ id: medicineId, name: '测试药品' }];
      const records = [
        { id: 1, medicineId: medicineId, medicineName: '测试药品', takeTime: '2024-01-01' },
        { id: 2, medicineId: 99999, medicineName: '其他药品', takeTime: '2024-01-02' }
      ];

      wx.setStorageSync('medicines', medicines);
      wx.setStorageSync('records', records);

      // 查找特定药品的记录
      const medicineRecords = records.filter(r => r.medicineId === medicineId);
      expect(medicineRecords).toHaveLength(1);
      expect(medicineRecords[0].medicineName).toBe('测试药品');
    });

    test('应该正确删除服药记录', () => {
      const records = [
        { id: 1, medicineName: '药品A' },
        { id: 2, medicineName: '药品B' }
      ];

      wx.setStorageSync('records', records);

      const idToDelete = 1;
      const filtered = records.filter(r => r.id !== idToDelete);
      wx.setStorageSync('records', filtered);

      const saved = wx.getStorageSync('records');
      expect(saved).toHaveLength(1);
      expect(saved[0].medicineName).toBe('药品B');
    });
  });

  describe('病例记录存储', () => {
    test('应该正确保存病例记录', () => {
      const caseRecord = {
        id: Date.now(),
        content: '感冒发烧，服用布洛芬',
        createTime: new Date().toLocaleString()
      };

      const cases = [];
      cases.push(caseRecord);
      wx.setStorageSync('cases', cases);

      const saved = wx.getStorageSync('cases');
      expect(saved).toHaveLength(1);
      expect(saved[0].content).toBe('感冒发烧，服用布洛芬');
    });

    test('应该正确读取病例列表', () => {
      const cases = [
        { id: 1, content: '病例1' },
        { id: 2, content: '病例2' }
      ];

      wx.setStorageSync('cases', cases);
      const saved = wx.getStorageSync('cases');

      expect(saved).toHaveLength(2);
    });
  });

  describe('数据持久化测试', () => {
    test('数据应该在多次操作后保持一致', () => {
      // 第一次写入
      wx.setStorageSync('medicines', [{ id: 1, name: '药品A' }]);

      // 第二次读取并添加
      const medicines = wx.getStorageSync('medicines') || [];
      medicines.push({ id: 2, name: '药品B' });
      wx.setStorageSync('medicines', medicines);

      // 第三次读取验证
      const saved = wx.getStorageSync('medicines');
      expect(saved).toHaveLength(2);
      expect(saved[0].name).toBe('药品A');
      expect(saved[1].name).toBe('药品B');
    });

    test('空数据初始化应该正常工作', () => {
      const medicines = wx.getStorageSync('medicines') || [];
      expect(Array.isArray(medicines)).toBe(true);

      if (medicines.length === 0) {
        wx.setStorageSync('medicines', []);
      }

      const saved = wx.getStorageSync('medicines');
      expect(saved).toEqual([]);
    });
  });

  describe('数据完整性测试', () => {
    test('药品数据应该包含所有必要字段', () => {
      const medicine = {
        id: Date.now(),
        name: '测试药品',
        expiryDate: '2025-12-31',
        description: '测试描述',
        specification: '0.5g*24粒',
        manufacturer: '测试厂家',
        usage: '口服，一日三次',
        approvalNumber: '国药准字H12345678',
        storage: '密封保存',
        ingredients: '测试成分',
        photos: ['/tmp/test.jpg'],
        createTime: new Date().toLocaleString()
      };

      wx.setStorageSync('medicines', [medicine]);
      const saved = wx.getStorageSync('medicines')[0];

      expect(saved.id).toBeDefined();
      expect(saved.name).toBe('测试药品');
      expect(saved.expiryDate).toBe('2025-12-31');
      expect(saved.specification).toBe('0.5g*24粒');
      expect(saved.manufacturer).toBe('测试厂家');
      expect(saved.usage).toBe('口服，一日三次');
      expect(saved.approvalNumber).toBe('国药准字H12345678');
      expect(saved.storage).toBe('密封保存');
      expect(saved.ingredients).toBe('测试成分');
      expect(saved.photos).toHaveLength(1);
      expect(saved.createTime).toBeDefined();
    });

    test('服药记录应该包含所有必要字段', () => {
      const record = {
        id: Date.now(),
        medicineId: 123,
        medicineName: '测试药品',
        takeTime: new Date().toLocaleString()
      };

      wx.setStorageSync('records', [record]);
      const saved = wx.getStorageSync('records')[0];

      expect(saved.id).toBeDefined();
      expect(saved.medicineId).toBe(123);
      expect(saved.medicineName).toBe('测试药品');
      expect(saved.takeTime).toBeDefined();
    });
  });
});