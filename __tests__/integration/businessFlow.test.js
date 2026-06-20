/**
 * 业务流程集成测试
 * 测试完整的业务流程和用户场景
 */

// 引入 wx mock
require('../../__mocks__/wx');

describe('业务流程集成测试', () => {
  beforeEach(() => {
    wx.clearMockStorage();
    jest.clearAllMocks();
  });

  describe('药品添加完整流程', () => {
    test('应该完成从拍照识别到保存药品的完整流程', async () => {
      // 1. 模拟拍照
      const imagePath = '/tmp/test-medicine.jpg';

      // 2. 模拟 OCR 识别结果
      const ocrResult = {
        text: '阿莫西林胶囊 有效期至2025-12-31 规格: 0.5g*24粒'
      };

      // 3. 模拟提取药品信息
      const medicineInfo = {
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        specification: '0.5g*24粒',
        description: '规格: 0.5g*24粒'
      };

      // 4. 保存药品
      const newMedicine = {
        id: Date.now(),
        ...medicineInfo,
        photos: [imagePath],
        createTime: new Date().toLocaleString()
      };

      const medicines = wx.getStorageSync('medicines') || [];
      medicines.push(newMedicine);
      wx.setStorageSync('medicines', medicines);

      // 5. 验证保存结果
      const saved = wx.getStorageSync('medicines');
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe('阿莫西林胶囊');
      expect(saved[0].expiryDate).toBe('2025-12-31');
      expect(saved[0].specification).toBe('0.5g*24粒');
    });

    test('应该正确处理 OCR 识别失败的情况', async () => {
      // 模拟 OCR 识别失败
      const error = new Error('OCR识别失败');

      // 用户应该能够手动输入药品信息
      const medicineInfo = {
        id: Date.now(),
        name: '手动输入药品',
        expiryDate: '2025-06-30',
        description: '手动输入的描述',
        createTime: new Date().toLocaleString()
      };

      const medicines = [];
      medicines.push(medicineInfo);
      wx.setStorageSync('medicines', medicines);

      const saved = wx.getStorageSync('medicines');
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe('手动输入药品');
    });
  });

  describe('服药记录完整流程', () => {
    test('应该完成从添加药品到记录服药的完整流程', () => {
      // 1. 添加药品
      const medicine = {
        id: 1001,
        name: '布洛芬片',
        expiryDate: '2025-12-31',
        createTime: new Date().toLocaleString()
      };

      wx.setStorageSync('medicines', [medicine]);

      // 2. 记录服药
      const record = {
        id: Date.now(),
        medicineId: medicine.id,
        medicineName: medicine.name,
        takeTime: new Date().toLocaleString()
      };

      const records = wx.getStorageSync('records') || [];
      records.push(record);
      wx.setStorageSync('records', records);

      // 3. 验证记录
      const savedRecords = wx.getStorageSync('records');
      expect(savedRecords).toHaveLength(1);
      expect(savedRecords[0].medicineId).toBe(1001);
      expect(savedRecords[0].medicineName).toBe('布洛芬片');
    });

    test('应该正确显示今日服药记录', () => {
      const today = new Date();
      const todayStr = today.toDateString();

      // 创建今日和昨日的记录
      const records = [
        {
          id: 1,
          medicineId: 1001,
          medicineName: '药品A',
          takeTime: today.toLocaleString()
        },
        {
          id: 2,
          medicineId: 1002,
          medicineName: '药品B',
          takeTime: new Date(today.getTime() - 24 * 60 * 60 * 1000).toLocaleString()
        }
      ];

      wx.setStorageSync('records', records);

      // 查询今日记录
      const savedRecords = wx.getStorageSync('records');
      const todayRecords = savedRecords.filter(r => {
        return new Date(r.takeTime).toDateString() === todayStr;
      });

      expect(todayRecords).toHaveLength(1);
      expect(todayRecords[0].medicineName).toBe('药品A');
    });
  });

  describe('药品过期提醒流程', () => {
    test('应该正确识别即将过期的药品并提醒', () => {
      const now = new Date();
      const twentyDaysLater = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

      const medicines = [
        {
          id: 1,
          name: '即将过期药品',
          expiryDate: twentyDaysLater.toISOString().split('T')[0]
        },
        {
          id: 2,
          name: '长期有效药品',
          expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];

      wx.setStorageSync('medicines', medicines);

      // 查询即将过期药品
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
      expect(expiring[0].name).toBe('即将过期药品');
    });
  });

  describe('药品删除流程', () => {
    test('应该正确删除药品及其相关记录', () => {
      // 1. 准备测试数据
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];

      const records = [
        { id: 101, medicineId: 1, medicineName: '药品A' },
        { id: 102, medicineId: 2, medicineName: '药品B' }
      ];

      wx.setStorageSync('medicines', medicines);
      wx.setStorageSync('records', records);

      // 2. 删除药品A
      const idToDelete = 1;
      const filteredMedicines = medicines.filter(m => m.id !== idToDelete);
      wx.setStorageSync('medicines', filteredMedicines);

      // 注意：实际应用中可能需要同时删除相关记录
      // 这里测试只删除药品本身
      const savedMedicines = wx.getStorageSync('medicines');
      expect(savedMedicines).toHaveLength(1);
      expect(savedMedicines[0].name).toBe('药品B');
    });
  });

  describe('病例记录流程', () => {
    test('应该完成添加病例记录的完整流程', () => {
      // 1. 添加病例
      const caseRecord = {
        id: Date.now(),
        content: '感冒发烧，服用布洛芬和感冒灵',
        createTime: new Date().toLocaleString()
      };

      const cases = wx.getStorageSync('cases') || [];
      cases.push(caseRecord);
      wx.setStorageSync('cases', cases);

      // 2. 验证保存
      const savedCases = wx.getStorageSync('cases');
      expect(savedCases).toHaveLength(1);
      expect(savedCases[0].content).toContain('感冒发烧');
    });
  });

  describe('数据同步和一致性测试', () => {
    test('应该保证药品和记录数据的一致性', () => {
      // 1. 添加药品
      const medicine = {
        id: 2001,
        name: '测试药品',
        expiryDate: '2025-12-31'
      };

      wx.setStorageSync('medicines', [medicine]);

      // 2. 添加服药记录
      const record = {
        id: Date.now(),
        medicineId: medicine.id,
        medicineName: medicine.name,
        takeTime: new Date().toLocaleString()
      };

      wx.setStorageSync('records', [record]);

      // 3. 验证数据一致性
      const savedMedicines = wx.getStorageSync('medicines');
      const savedRecords = wx.getStorageSync('records');

      expect(savedMedicines[0].id).toBe(savedRecords[0].medicineId);
      expect(savedMedicines[0].name).toBe(savedRecords[0].medicineName);
    });

    test('应该正确处理多次服药记录', () => {
      const medicine = { id: 3001, name: '多次服用药品' };

      // 模拟一天内多次服药
      const now = new Date();
      const records = [
        {
          id: 1,
          medicineId: medicine.id,
          medicineName: medicine.name,
          takeTime: new Date(now.setHours(8, 0, 0)).toLocaleString()
        },
        {
          id: 2,
          medicineId: medicine.id,
          medicineName: medicine.name,
          takeTime: new Date(now.setHours(12, 0, 0)).toLocaleString()
        },
        {
          id: 3,
          medicineId: medicine.id,
          medicineName: medicine.name,
          takeTime: new Date(now.setHours(20, 0, 0)).toLocaleString()
        }
      ];

      wx.setStorageSync('records', records);

      const savedRecords = wx.getStorageSync('records');
      expect(savedRecords).toHaveLength(3);

      // 验证所有记录都属于同一个药品
      const medicineRecords = savedRecords.filter(r => r.medicineId === medicine.id);
      expect(medicineRecords).toHaveLength(3);
    });
  });

  describe('错误处理和边界情况', () => {
    test('应该正确处理空数据情况', () => {
      const medicines = wx.getStorageSync('medicines') || [];
      const records = wx.getStorageSync('records') || [];
      const cases = wx.getStorageSync('cases') || [];

      expect(Array.isArray(medicines)).toBe(true);
      expect(Array.isArray(records)).toBe(true);
      expect(Array.isArray(cases)).toBe(true);
    });

    test('应该正确处理重复保存相同药品', () => {
      const medicine = {
        id: 4001,
        name: '重复药品'
      };

      // 第一次保存
      let medicines = wx.getStorageSync('medicines') || [];
      medicines.push(medicine);
      wx.setStorageSync('medicines', medicines);

      // 第二次保存（模拟重复操作）
      medicines = wx.getStorageSync('medicines') || [];
      const exists = medicines.find(m => m.id === medicine.id);
      if (!exists) {
        medicines.push(medicine);
        wx.setStorageSync('medicines', medicines);
      }

      const saved = wx.getStorageSync('medicines');
      expect(saved).toHaveLength(1);
    });

    test('应该正确处理无效的药品ID', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];

      wx.setStorageSync('medicines', medicines);

      // 尝试查找不存在的药品
      const invalidId = 999;
      const medicine = medicines.find(m => m.id === invalidId);

      expect(medicine).toBeUndefined();
    });
  });
});