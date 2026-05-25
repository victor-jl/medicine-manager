describe('pages/records/records.js - 数据管理逻辑', () => {
  describe('药品删除操作', () => {
    function deleteMedicine(medicines, id) {
      return medicines.filter(m => m.id !== id);
    }

    test('应正确删除指定ID的药品', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' },
        { id: 3, name: '药品C' }
      ];
      const result = deleteMedicine(medicines, 2);
      expect(result).toHaveLength(2);
      expect(result.find(m => m.id === 2)).toBeUndefined();
      expect(result.find(m => m.id === 1)).toBeDefined();
      expect(result.find(m => m.id === 3)).toBeDefined();
    });

    test('删除不存在的ID应返回原数组', () => {
      const medicines = [
        { id: 1, name: '药品A' }
      ];
      const result = deleteMedicine(medicines, 999);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('删除后应保持其他药品顺序', () => {
      const medicines = [
        { id: 1, name: '第一' },
        { id: 2, name: '第二' },
        { id: 3, name: '第三' }
      ];
      const result = deleteMedicine(medicines, 2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });

    test('空数组删除应返回空数组', () => {
      const result = deleteMedicine([], 1);
      expect(result).toHaveLength(0);
    });
  });

  describe('记录删除操作', () => {
    function deleteRecord(records, id) {
      return records.filter(r => r.id !== id);
    }

    test('应正确删除指定ID的记录', () => {
      const records = [
        { id: 1, medicineName: '药品A', takeTime: '2024-01-01' },
        { id: 2, medicineName: '药品B', takeTime: '2024-01-02' }
      ];
      const result = deleteRecord(records, 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test('删除后应保留其他记录完整', () => {
      const records = [
        { id: 1, medicineName: '药品A', takeTime: '2024-01-01' },
        { id: 2, medicineName: '药品B', takeTime: '2024-01-02' },
        { id: 3, medicineName: '药品C', takeTime: '2024-01-03' }
      ];
      const result = deleteRecord(records, 2);
      expect(result).toHaveLength(2);
      expect(result.find(r => r.id === 1)).toBeDefined();
      expect(result.find(r => r.id === 3)).toBeDefined();
    });
  });

  describe('按药品ID筛选记录', () => {
    function filterRecordsByMedicineId(records, medicineId) {
      return records.filter(r => r.medicineId === medicineId);
    }

    test('应筛选指定药品的记录', () => {
      const records = [
        { id: 1, medicineId: 100, medicineName: '药品A' },
        { id: 2, medicineId: 200, medicineName: '药品B' },
        { id: 3, medicineId: 100, medicineName: '药品A' }
      ];
      const result = filterRecordsByMedicineId(records, 100);
      expect(result).toHaveLength(2);
      expect(result.every(r => r.medicineId === 100)).toBe(true);
    });

    test('无匹配记录应返回空数组', () => {
      const records = [
        { id: 1, medicineId: 100, medicineName: '药品A' }
      ];
      const result = filterRecordsByMedicineId(records, 999);
      expect(result).toHaveLength(0);
    });

    test('空数组应返回空结果', () => {
      const result = filterRecordsByMedicineId([], 100);
      expect(result).toHaveLength(0);
    });
  });

  describe('添加药品', () => {
    function addMedicine(medicines, newMedicine) {
      return [...medicines, newMedicine];
    }

    test('应正确添加新药品', () => {
      const medicines = [];
      const newMedicine = {
        id: Date.now(),
        name: '新药品',
        expiryDate: '2025-12-31'
      };
      const result = addMedicine(medicines, newMedicine);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('新药品');
    });

    test('添加应保留现有药品', () => {
      const medicines = [
        { id: 1, name: '已有药品' }
      ];
      const newMedicine = {
        id: 2,
        name: '新药品'
      };
      const result = addMedicine(medicines, newMedicine);
      expect(result).toHaveLength(2);
    });

    test('新药品应添加到数组末尾', () => {
      const medicines = [
        { id: 1, name: '第一' },
        { id: 2, name: '第二' }
      ];
      const newMedicine = { id: 3, name: '第三' };
      const result = addMedicine(medicines, newMedicine);
      expect(result[2].name).toBe('第三');
    });
  });

  describe('添加服药记录', () => {
    function addRecord(records, newRecord) {
      return [...records, newRecord];
    }

    test('应正确添加新记录', () => {
      const records = [];
      const newRecord = {
        id: Date.now(),
        medicineId: 1,
        medicineName: '测试药品',
        takeTime: new Date().toISOString()
      };
      const result = addRecord(records, newRecord);
      expect(result).toHaveLength(1);
    });

    test('记录应包含必要字段', () => {
      const newRecord = {
        id: 1,
        medicineId: 100,
        medicineName: '药品A',
        takeTime: '2024-01-01'
      };
      const records = [];
      const result = addRecord(records, newRecord);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('medicineId');
      expect(result[0]).toHaveProperty('medicineName');
      expect(result[0]).toHaveProperty('takeTime');
    });
  });

  describe('数据反转（用于列表显示）', () => {
    function reverseArray(arr) {
      return [...arr].reverse();
    }

    test('应正确反转数组顺序', () => {
      const data = [1, 2, 3, 4, 5];
      const result = reverseArray(data);
      expect(result[0]).toBe(5);
      expect(result[4]).toBe(1);
    });

    test('应不影响原数组', () => {
      const data = [1, 2, 3];
      const copy = [...data];
      reverseArray(data);
      expect(data).toEqual(copy);
    });

    test('空数组应返回空数组', () => {
      const result = reverseArray([]);
      expect(result).toHaveLength(0);
    });

    test('单元素数组应保持不变', () => {
      const data = [1];
      const result = reverseArray(data);
      expect(result).toEqual([1]);
    });
  });

  describe('查找药品', () => {
    function findMedicine(medicines, id) {
      return medicines.find(m => m.id === id);
    }

    test('应找到存在的药品', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];
      const result = findMedicine(medicines, 1);
      expect(result.name).toBe('药品A');
    });

    test('找不到应返回undefined', () => {
      const medicines = [
        { id: 1, name: '药品A' }
      ];
      const result = findMedicine(medicines, 999);
      expect(result).toBeUndefined();
    });

    test('空数组应返回undefined', () => {
      const result = findMedicine([], 1);
      expect(result).toBeUndefined();
    });
  });

  describe('病例管理', () => {
    function addCase(cases, newCase) {
      return [...cases, newCase];
    }

    function deleteCase(cases, id) {
      return cases.filter(c => c.id !== id);
    }

    test('应正确添加病例', () => {
      const cases = [];
      const newCase = {
        id: Date.now(),
        content: '病例描述',
        createTime: new Date().toISOString()
      };
      const result = addCase(cases, newCase);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('病例描述');
    });

    test('应正确删除病例', () => {
      const cases = [
        { id: 1, content: '病例A' },
        { id: 2, content: '病例B' }
      ];
      const result = deleteCase(cases, 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });
});
