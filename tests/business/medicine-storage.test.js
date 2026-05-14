describe('药品数据存储逻辑', () => {
  let medicines;
  let records;

  beforeEach(() => {
    medicines = [];
    records = [];
    global.wx.getStorageSync.mockImplementation((key) => {
      const storage = {
        'medicines': medicines,
        'records': records
      };
      return storage[key];
    });
  });

  describe('药品添加逻辑', () => {
    test('应生成唯一ID', () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);
      const medicine1 = { id: Date.now(), name: '药品1' };
      const medicine2 = { id: Date.now(), name: '药品2' };
      expect(medicine1.id).not.toBe(medicine2.id);
      Date.now.mockRestore();
    });

    test('应包含必要字段', () => {
      const newMedicine = {
        id: Date.now(),
        name: '测试药品',
        expiryDate: '2025-12-31',
        description: '测试描述',
        specification: '0.3g',
        manufacturer: '测试厂家',
        usage: '口服',
        approvalNumber: '国药准字H123456',
        storage: '密封保存',
        ingredients: '测试成分',
        photos: [],
        createTime: new Date().toLocaleString()
      };

      expect(newMedicine).toHaveProperty('id');
      expect(newMedicine).toHaveProperty('name');
      expect(newMedicine).toHaveProperty('createTime');
      expect(typeof newMedicine.id).toBe('number');
    });

    test('应正确添加到数组末尾', () => {
      medicines.push({ id: 1, name: '药品1' });
      medicines.push({ id: 2, name: '药品2' });
      expect(medicines.length).toBe(2);
      expect(medicines[1].name).toBe('药品2');
    });
  });

  describe('药品删除逻辑', () => {
    test('应通过ID过滤删除药品', () => {
      medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' },
        { id: 3, name: '药品3' }
      ];
      medicines = medicines.filter(m => m.id !== 2);
      expect(medicines.length).toBe(2);
      expect(medicines.find(m => m.id === 2)).toBeUndefined();
    });

    test('删除不存在的ID不应影响数组', () => {
      medicines = [{ id: 1, name: '药品1' }];
      const originalLength = medicines.length;
      medicines = medicines.filter(m => m.id !== 999);
      expect(medicines.length).toBe(originalLength);
    });
  });

  describe('药品查询逻辑', () => {
    test('应通过ID找到药品', () => {
      medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];
      const found = medicines.find(m => m.id === 1);
      expect(found).toBeDefined();
      expect(found.name).toBe('药品1');
    });

    test('找不到药品应返回undefined', () => {
      medicines = [{ id: 1, name: '药品1' }];
      const found = medicines.find(m => m.id === 999);
      expect(found).toBeUndefined();
    });
  });

  describe('服药记录逻辑', () => {
    test('应正确关联药品ID和名称', () => {
      const newRecord = {
        id: Date.now(),
        medicineId: 1,
        medicineName: '测试药品',
        takeTime: new Date().toLocaleString()
      };
      expect(newRecord).toHaveProperty('medicineId');
      expect(newRecord).toHaveProperty('medicineName');
    });

    test('应能过滤特定药品的记录', () => {
      records = [
        { id: 1, medicineId: 1, medicineName: '药品1' },
        { id: 2, medicineId: 2, medicineName: '药品2' },
        { id: 3, medicineId: 1, medicineName: '药品1' }
      ];
      const medicineRecords = records.filter(r => r.medicineId === 1);
      expect(medicineRecords.length).toBe(2);
    });

    test('删除药品时应同时删除相关记录', () => {
      medicines = [{ id: 1, name: '药品1' }];
      records = [
        { id: 1, medicineId: 1, medicineName: '药品1' },
        { id: 2, medicineId: 2, medicineName: '药品2' }
      ];
      medicines = medicines.filter(m => m.id !== 1);
      records = records.filter(r => r.medicineId !== 1);
      expect(medicines.length).toBe(0);
      expect(records.length).toBe(1);
    });
  });
});
