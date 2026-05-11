describe('药品数据操作', () => {
  let medicines;
  let records;

  beforeEach(() => {
    medicines = [];
    records = [];
  });

  function addMedicine(medicine) {
    const newMedicine = {
      id: Date.now() + Math.random(),
      ...medicine,
      createTime: new Date().toLocaleString()
    };
    medicines.push(newMedicine);
    return newMedicine;
  }

  function deleteMedicine(id) {
    medicines = medicines.filter(m => m.id !== id);
    return medicines;
  }

  function addRecord(record) {
    const newRecord = {
      id: Date.now() + Math.random(),
      ...record,
      takeTime: new Date().toLocaleString()
    };
    records.push(newRecord);
    return newRecord;
  }

  function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    return records;
  }

  function getMedicineById(id) {
    return medicines.find(m => m.id === id);
  }

  function getRecordsByMedicineId(medicineId) {
    return records.filter(r => r.medicineId === medicineId);
  }

  function getTodayRecords() {
    const today = new Date().toDateString();
    return records.filter(r => new Date(r.takeTime).toDateString() === today);
  }

  describe('添加药品', () => {
    test('应成功添加有效药品', () => {
      const medicine = {
        name: '布洛芬',
        expiryDate: '2026-12-31'
      };
      const result = addMedicine(medicine);
      expect(result.id).toBeTruthy();
      expect(result.name).toBe('布洛芬');
      expect(result.createTime).toBeTruthy();
    });

    test('应保存所有字段', () => {
      const medicine = {
        name: '阿莫西林',
        expiryDate: '2026-12-31',
        specification: '0.25g',
        manufacturer: 'XXX制药',
        usage: '口服',
        approvalNumber: '国药准字H123456',
        storage: '遮光密封',
        ingredients: '阿莫西林'
      };
      const result = addMedicine(medicine);
      expect(result.specification).toBe('0.25g');
      expect(result.manufacturer).toBe('XXX制药');
      expect(result.usage).toBe('口服');
    });

    test('应生成唯一ID', () => {
      const m1 = addMedicine({ name: '药品1' });
      const m2 = addMedicine({ name: '药品2' });
      expect(m1.id).not.toBe(m2.id);
    });
  });

  describe('删除药品', () => {
    test('应成功删除存在的药品', () => {
      const medicine = addMedicine({ name: '测试药品' });
      const id = medicine.id;
      deleteMedicine(id);
      expect(medicines.find(m => m.id === id)).toBeUndefined();
    });

    test('删除不存在的ID不应影响列表', () => {
      addMedicine({ name: '药品1' });
      const originalLength = medicines.length;
      deleteMedicine(99999);
      expect(medicines.length).toBe(originalLength);
    });
  });

  describe('添加服药记录', () => {
    test('应成功添加记录', () => {
      const record = addRecord({
        medicineId: 1,
        medicineName: '布洛芬'
      });
      expect(record.id).toBeTruthy();
      expect(record.medicineName).toBe('布洛芬');
    });

    test('应生成时间戳', () => {
      const record = addRecord({
        medicineId: 1,
        medicineName: '布洛芬'
      });
      expect(record.takeTime).toBeTruthy();
    });
  });

  describe('删除记录', () => {
    test('应成功删除存在的记录', () => {
      const record = addRecord({
        medicineId: 1,
        medicineName: '测试'
      });
      const id = record.id;
      deleteRecord(id);
      expect(records.find(r => r.id === id)).toBeUndefined();
    });
  });

  describe('查询药品', () => {
    test('应通过ID找到药品', () => {
      const medicine = addMedicine({ name: '查找测试' });
      const found = getMedicineById(medicine.id);
      expect(found).toBeTruthy();
      expect(found.name).toBe('查找测试');
    });

    test('查找不存在的ID应返回undefined', () => {
      const found = getMedicineById(99999);
      expect(found).toBeUndefined();
    });
  });

  describe('查询服药记录', () => {
    test('应返回指定药品的所有记录', () => {
      const medicine = addMedicine({ name: '记录测试' });
      addRecord({ medicineId: medicine.id, medicineName: '记录测试' });
      addRecord({ medicineId: medicine.id, medicineName: '记录测试' });
      addRecord({ medicineId: 999, medicineName: '其他' });
      
      const medicineRecords = getRecordsByMedicineId(medicine.id);
      expect(medicineRecords.length).toBe(2);
    });

    test('无记录时返回空数组', () => {
      const medicine = addMedicine({ name: '无记录测试' });
      const medicineRecords = getRecordsByMedicineId(medicine.id);
      expect(medicineRecords.length).toBe(0);
    });
  });

  describe('今日记录查询', () => {
    test('应返回今日的记录', () => {
      const today = new Date().toISOString();
      records.push({
        id: 1,
        medicineName: '今日药品',
        takeTime: new Date().toLocaleString()
      });
      records.push({
        id: 2,
        medicineName: '昨日药品',
        takeTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString()
      });
      
      const todayRecords = getTodayRecords();
      expect(todayRecords.length).toBeGreaterThanOrEqual(1);
      expect(todayRecords.some(r => r.medicineName === '今日药品')).toBe(true);
    });
  });

  describe('数据隔离', () => {
    test('多次添加应累加数据', () => {
      addMedicine({ name: '药品1' });
      addMedicine({ name: '药品2' });
      expect(medicines.length).toBe(2);
      addMedicine({ name: '药品3' });
      expect(medicines.length).toBe(3);
    });

    test('删除后其他数据应保持不变', () => {
      addMedicine({ name: '保留' });
      const m2 = addMedicine({ name: '删除' });
      deleteMedicine(m2.id);
      expect(medicines.length).toBe(1);
      expect(medicines[0].name).toBe('保留');
    });
  });
});
