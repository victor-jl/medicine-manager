// pages/__tests__/medicine.test.js
// 测试药品管理的核心业务逻辑（不依赖微信小程序环境）

// 模拟药品数据管理逻辑
class MedicineManager {
  constructor() {
    this.medicines = [];
    this.records = [];
    this.idCounter = 1;
  }

  // 生成唯一 ID
  _generateId() {
    return Date.now() + this.idCounter++;
  }

  // 添加药品
  addMedicine(medicineData) {
    if (!medicineData.name) {
      throw new Error('药品名称不能为空');
    }

    const medicine = {
      id: this._generateId(),
      name: medicineData.name,
      expiryDate: medicineData.expiryDate || '',
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

    this.medicines.push(medicine);
    return medicine;
  }

  // 删除药品
  deleteMedicine(id) {
    const index = this.medicines.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error('药品不存在');
    }
    this.medicines.splice(index, 1);
    return true;
  }

  // 获取药品详情
  getMedicine(id) {
    return this.medicines.find(m => m.id === id);
  }

  // 记录服药
  recordTake(medicineId) {
    const medicine = this.getMedicine(medicineId);
    if (!medicine) {
      throw new Error('药品不存在');
    }

    const record = {
      id: this._generateId(),
      medicineId: medicineId,
      medicineName: medicine.name,
      takeTime: new Date().toLocaleString()
    };

    this.records.push(record);
    return record;
  }

  // 获取即将过期的药品（30天内）
  getExpiringMedicines(daysThreshold = 30) {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    return this.medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thresholdDate && expiry >= now;
    });
  }

  // 获取过期药品
  getExpiredMedicines() {
    const now = new Date();
    return this.medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry < now;
    });
  }

  // 获取今日服药记录
  getTodayRecords() {
    const today = new Date().toDateString();
    return this.records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });
  }

  // 获取指定药品的服药记录
  getMedicineRecords(medicineId) {
    return this.records.filter(r => r.medicineId === medicineId);
  }

  // 清空所有数据
  clearAll() {
    this.medicines = [];
    this.records = [];
    this.idCounter = 1;
  }
}

describe('Medicine Management Logic', () => {
  let manager;

  beforeEach(() => {
    manager = new MedicineManager();
  });

  describe('药品添加', () => {
    test('应成功添加完整信息的药品', () => {
      const medicineData = {
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        description: '规格: 0.5g*12粒',
        specification: '0.5g*12粒',
        manufacturer: '某某制药有限公司',
        usage: '口服，一次1粒，一日3次',
        approvalNumber: '国药准字H12345678',
        storage: '密封，在阴凉处保存',
        ingredients: '阿莫西林三水合物'
      };

      const medicine = manager.addMedicine(medicineData);

      expect(medicine.name).toBe('阿莫西林胶囊');
      expect(medicine.expiryDate).toBe('2025-12-31');
      expect(medicine.id).toBeDefined();
      expect(medicine.createTime).toBeDefined();
      expect(manager.medicines.length).toBe(1);
    });

    test('应拒绝添加没有名称的药品', () => {
      const medicineData = {
        expiryDate: '2025-12-31'
      };

      expect(() => manager.addMedicine(medicineData)).toThrow('药品名称不能为空');
      expect(manager.medicines.length).toBe(0);
    });

    test('应允许添加仅包含名称的药品', () => {
      const medicineData = {
        name: '布洛芬片'
      };

      const medicine = manager.addMedicine(medicineData);

      expect(medicine.name).toBe('布洛芬片');
      expect(medicine.expiryDate).toBe('');
      expect(medicine.description).toBe('');
      expect(manager.medicines.length).toBe(1);
    });

    test('应处理药品名称为空字符串的情况', () => {
      const medicineData = {
        name: ''
      };

      expect(() => manager.addMedicine(medicineData)).toThrow('药品名称不能为空');
      expect(manager.medicines.length).toBe(0);
    });

    test('应处理药品名称为 null 的情况', () => {
      const medicineData = {
        name: null
      };

      expect(() => manager.addMedicine(medicineData)).toThrow('药品名称不能为空');
      expect(manager.medicines.length).toBe(0);
    });
  });

  describe('药品删除', () => {
    test('应成功删除存在的药品', () => {
      manager.addMedicine({ name: '药品A' });
      manager.addMedicine({ name: '药品B' });

      const medicineA = manager.medicines[0];
      manager.deleteMedicine(medicineA.id);

      expect(manager.medicines.length).toBe(1);
      expect(manager.medicines[0].name).toBe('药品B');
    });

    test('应拒绝删除不存在的药品', () => {
      manager.addMedicine({ name: '药品A' });

      expect(() => manager.deleteMedicine(99999)).toThrow('药品不存在');
      expect(manager.medicines.length).toBe(1);
    });

    test('删除药品后不应影响其他药品', () => {
      manager.addMedicine({ name: '药品A', expiryDate: '2025-01-01' });
      manager.addMedicine({ name: '药品B', expiryDate: '2025-02-02' });
      manager.addMedicine({ name: '药品C', expiryDate: '2025-03-03' });

      const medicineA = manager.medicines[0];
      manager.deleteMedicine(medicineA.id);

      expect(manager.medicines.length).toBe(2);
      expect(manager.medicines[0].expiryDate).toBe('2025-02-02');
      expect(manager.medicines[1].expiryDate).toBe('2025-03-03');
    });
  });

  describe('药品查询', () => {
    test('应成功获取存在的药品', () => {
      const added = manager.addMedicine({ name: '药品A' });
      const found = manager.getMedicine(added.id);

      expect(found).toBeDefined();
      expect(found.name).toBe('药品A');
    });

    test('应返回 undefined 查询不存在的药品', () => {
      const found = manager.getMedicine(99999);
      expect(found).toBeUndefined();
    });
  });

  describe('服药记录', () => {
    test('应成功记录服药', () => {
      const medicine = manager.addMedicine({ name: '阿莫西林胶囊' });
      const record = manager.recordTake(medicine.id);

      expect(record.medicineId).toBe(medicine.id);
      expect(record.medicineName).toBe('阿莫西林胶囊');
      expect(record.takeTime).toBeDefined();
      expect(manager.records.length).toBe(1);
    });

    test('应拒绝记录不存在药品的服药', () => {
      expect(() => manager.recordTake(99999)).toThrow('药品不存在');
      expect(manager.records.length).toBe(0);
    });

    test('应获取指定药品的服药记录', () => {
      const medicineA = manager.addMedicine({ name: '药品A' });
      const medicineB = manager.addMedicine({ name: '药品B' });

      manager.recordTake(medicineA.id);
      manager.recordTake(medicineB.id);
      manager.recordTake(medicineA.id);

      const recordsA = manager.getMedicineRecords(medicineA.id);

      expect(recordsA.length).toBe(2);
      expect(recordsA.every(r => r.medicineId === medicineA.id)).toBe(true);
    });
  });

  describe('过期药品检测', () => {
    beforeEach(() => {
      // 清空并添加测试药品
      manager.clearAll();
    });

    test('应检测出即将过期的药品（30天内）', () => {
      const now = new Date();
      const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      manager.addMedicine({
        name: '即将过期药品',
        expiryDate: fifteenDaysLater.toISOString().split('T')[0]
      });

      manager.addMedicine({
        name: '长期有效药品',
        expiryDate: '2030-12-31'
      });

      const expiring = manager.getExpiringMedicines(30);

      expect(expiring.length).toBe(1);
      expect(expiring[0].name).toBe('即将过期药品');
    });

    test('应检测出已过期的药品', () => {
      manager.addMedicine({
        name: '已过期药品',
        expiryDate: '2020-01-01'
      });

      manager.addMedicine({
        name: '未过期药品',
        expiryDate: '2030-12-31'
      });

      const expired = manager.getExpiredMedicines();

      expect(expired.length).toBe(1);
      expect(expired[0].name).toBe('已过期药品');
    });

    test('应忽略没有有效期信息的药品', () => {
      manager.addMedicine({
        name: '无有效期药品'
      });

      const expiring = manager.getExpiringMedicines(30);
      const expired = manager.getExpiredMedicines();

      expect(expiring.length).toBe(0);
      expect(expired.length).toBe(0);
    });

    test('应正确处理正好在临界点的药品', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      manager.addMedicine({
        name: '临界药品',
        expiryDate: thirtyDaysLater.toISOString().split('T')[0]
      });

      const expiring = manager.getExpiringMedicines(30);

      // 正好30天后应该被包含
      expect(expiring.length).toBe(1);
      expect(expiring[0].name).toBe('临界药品');
    });

    test('应排除有效期超过阈值的药品', () => {
      const now = new Date();
      const fortyDaysLater = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000);

      manager.addMedicine({
        name: '长期药品',
        expiryDate: fortyDaysLater.toISOString().split('T')[0]
      });

      const expiring = manager.getExpiringMedicines(30);

      expect(expiring.length).toBe(0);
    });
  });

  describe('今日服药记录', () => {
    test('应获取今日服药记录', () => {
      const medicine = manager.addMedicine({ name: '药品A' });

      manager.recordTake(medicine.id);

      const todayRecords = manager.getTodayRecords();

      expect(todayRecords.length).toBe(1);
      expect(todayRecords[0].medicineName).toBe('药品A');
    });

    test('应不包含非今日服药记录', () => {
      const medicine = manager.addMedicine({ name: '药品A' });

      // 手动添加一个旧记录
      const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 昨天
      manager.records.push({
        id: 999,
        medicineId: medicine.id,
        medicineName: '药品A',
        takeTime: oldDate.toLocaleString()
      });

      manager.recordTake(medicine.id);

      const todayRecords = manager.getTodayRecords();

      expect(todayRecords.length).toBe(1);
    });
  });

  describe('数据完整性', () => {
    test('应保持药品和记录的一致性', () => {
      const medicineA = manager.addMedicine({ name: '药品A' });
      const medicineB = manager.addMedicine({ name: '药品B' });

      manager.recordTake(medicineA.id);
      manager.recordTake(medicineB.id);
      manager.deleteMedicine(medicineA.id);

      // 删除药品后，记录应该仍然存在（虽然药品已删除）
      expect(manager.records.length).toBe(2);
      expect(manager.getMedicineRecords(medicineA.id).length).toBe(1);
    });

    test('应正确处理多次服药记录', () => {
      const medicine = manager.addMedicine({ name: '药品A' });

      for (let i = 0; i < 5; i++) {
        manager.recordTake(medicine.id);
      }

      expect(manager.getMedicineRecords(medicine.id).length).toBe(5);
    });

    test('清空数据应完全删除所有药品和记录', () => {
      manager.addMedicine({ name: '药品A' });
      manager.addMedicine({ name: '药品B' });
      manager.recordTake(manager.medicines[0].id);
      manager.recordTake(manager.medicines[1].id);

      manager.clearAll();

      expect(manager.medicines.length).toBe(0);
      expect(manager.records.length).toBe(0);
    });
  });
});

// 测试日期计算辅助函数
describe('Date Calculation Utilities', () => {
  test('应正确计算30天后的日期', () => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const diffDays = Math.floor((thirtyDaysLater - now) / (24 * 60 * 60 * 1000));

    expect(diffDays).toBe(30);
  });

  test('应正确判断日期是否在范围内', () => {
    const now = new Date();
    const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    expect(fifteenDaysLater >= now && fifteenDaysLater <= thirtyDaysLater).toBe(true);
  });

  test('应正确判断过期日期', () => {
    const now = new Date();
    const pastDate = new Date('2020-01-01');

    expect(pastDate < now).toBe(true);
  });

  test('应正确判断未来日期', () => {
    const now = new Date();
    const futureDate = new Date('2030-12-31');

    expect(futureDate > now).toBe(true);
  });
});