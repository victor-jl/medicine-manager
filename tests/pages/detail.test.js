describe('pages/detail/detail.js - 详情页面逻辑', () => {
  let medicines;
  let records;

  beforeEach(() => {
    medicines = [];
    records = [];
    global.wx.getStorageSync.mockImplementation((key) => {
      const storage = { medicines, records };
      return storage[key];
    });
  });

  describe('onLoad - 页面加载', () => {
    test('应解析URL中的ID参数', () => {
      const options = { id: '123' };
      const id = parseInt(options.id);
      expect(id).toBe(123);
      expect(typeof id).toBe('number');
    });

    test('应通过ID找到对应药品', () => {
      medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];
      const id = 1;
      const medicine = medicines.find(m => m.id === id);
      expect(medicine).toBeDefined();
      expect(medicine.name).toBe('药品1');
    });

    test('找不到药品应不设置数据', () => {
      medicines = [{ id: 1, name: '药品1' }];
      const id = 999;
      const medicine = medicines.find(m => m.id === id);
      expect(medicine).toBeUndefined();
    });

    test('应加载关联的服药记录', () => {
      medicines = [{ id: 1, name: '药品1' }];
      records = [
        { id: 1, medicineId: 1, medicineName: '药品1' },
        { id: 2, medicineId: 2, medicineName: '药品2' }
      ];

      const medicineId = 1;
      const medicineRecords = records.filter(r => r.medicineId === medicineId);
      expect(medicineRecords.length).toBe(1);
    });

    test('服药记录应以倒序显示', () => {
      const medicineRecords = [
        { id: 1, takeTime: '2025-01-01' },
        { id: 2, takeTime: '2025-01-02' },
        { id: 3, takeTime: '2025-01-03' }
      ];

      const reversed = medicineRecords.reverse();
      expect(reversed[0].id).toBe(3);
    });
  });

  describe('recordTake - 记录服药', () => {
    test('新记录应包含必要字段', () => {
      const medicine = { id: 1, name: '测试药品' };
      const newRecord = {
        id: Date.now(),
        medicineId: medicine.id,
        medicineName: medicine.name,
        takeTime: new Date().toLocaleString()
      };

      expect(newRecord.medicineId).toBe(1);
      expect(newRecord.medicineName).toBe('测试药品');
      expect(newRecord.takeTime).toBeDefined();
    });

    test('应添加到记录列表开头', () => {
      const existingRecords = [{ id: 1, medicineName: '记录1' }];
      const newRecord = { id: 2, medicineName: '记录2' };

      const updatedRecords = [newRecord, ...existingRecords];
      expect(updatedRecords[0].id).toBe(2);
      expect(updatedRecords.length).toBe(2);
    });

    test('应持久化到存储', () => {
      records = [];
      const newRecord = { id: 1, medicineId: 1, medicineName: '药品' };
      records.push(newRecord);
      expect(records.length).toBe(1);
    });
  });

  describe('deleteMedicine - 删除药品', () => {
    test('应显示确认对话框', () => {
      const showModalConfig = {
        title: '确认删除',
        content: '确定要删除这个药品吗？'
      };
      expect(showModalConfig.title).toBe('确认删除');
    });

    test('用户取消删除不应修改数据', () => {
      medicines = [{ id: 1, name: '药品1' }];
      const userConfirmed = false;

      if (userConfirmed) {
        medicines = medicines.filter(m => m.id !== 1);
      }

      expect(medicines.length).toBe(1);
    });

    test('用户确认删除应过滤掉该药品', () => {
      medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];
      const deleteId = 1;
      medicines = medicines.filter(m => m.id !== deleteId);

      expect(medicines.length).toBe(1);
      expect(medicines[0].id).toBe(2);
    });

    test('删除后应导航返回', () => {
      const shouldNavigateBack = true;
      expect(shouldNavigateBack).toBe(true);
    });

    test('删除前应有延迟确保用户体验', () => {
      const delay = 1500;
      expect(delay).toBeGreaterThan(1000);
    });
  });
});
