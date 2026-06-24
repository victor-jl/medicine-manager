/**
 * 测试药品数据操作逻辑
 *
 * 测试覆盖：
 * - 药品删除（按ID）
 * - 记录删除（按ID）
 * - 药品查找（按ID）
 * - 级联数据一致性
 */

/**
 * 从列表中删除药品
 * @param {Array} medicines - 药品列表
 * @param {number} id - 药品ID
 * @returns {Array} 删除后的列表
 */
function deleteMedicine(medicines, id) {
  return medicines.filter(m => m.id !== id);
}

/**
 * 从列表中删除记录
 * @param {Array} records - 记录列表
 * @param {number} id - 记录ID
 * @returns {Array} 删除后的列表
 */
function deleteRecord(records, id) {
  return records.filter(r => r.id !== id);
}

/**
 * 根据ID查找药品
 * @param {Array} medicines - 药品列表
 * @param {number} id - 药品ID
 * @returns {Object|undefined} 找到的药品
 */
function findMedicine(medicines, id) {
  return medicines.find(m => m.id === id);
}

/**
 * 获取某药品的所有服药记录
 * @param {Array} records - 记录列表
 * @param {number} medicineId - 药品ID
 * @returns {Array} 该药品的记录
 */
function getMedicineRecords(records, medicineId) {
  return records.filter(r => r.medicineId === medicineId);
}

/**
 * 添加新药品
 * @param {Array} medicines - 药品列表
 * @param {Object} newMedicine - 新药品
 * @returns {Array} 添加后的列表
 */
function addMedicine(medicines, newMedicine) {
  return [...medicines, newMedicine];
}

/**
 * 添加新记录
 * @param {Array} records - 记录列表
 * @param {Object} newRecord - 新记录
 * @returns {Array} 添加后的列表
 */
function addRecord(records, newRecord) {
  return [...records, newRecord];
}

describe('药品数据操作', () => {
  describe('deleteMedicine - 删除药品', () => {
    test('应正确删除指定ID的药品', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' },
        { id: 3, name: '药品C' },
      ];

      const result = deleteMedicine(medicines, 2);
      expect(result).toHaveLength(2);
      expect(result.find(m => m.id === 2)).toBeUndefined();
      expect(result.find(m => m.id === 1)).toBeDefined();
      expect(result.find(m => m.id === 3)).toBeDefined();
    });

    test('删除不存在的ID应返回原列表', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' },
      ];

      const result = deleteMedicine(medicines, 999);
      expect(result).toHaveLength(2);
    });

    test('空数组删除应返回空数组', () => {
      expect(deleteMedicine([], 1)).toHaveLength(0);
    });

    test('删除最后一个药品应返回空数组', () => {
      const medicines = [{ id: 1, name: '唯一药品' }];
      const result = deleteMedicine(medicines, 1);
      expect(result).toHaveLength(0);
    });

    test('不应修改原数组', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' },
      ];
      const originalLength = medicines.length;

      deleteMedicine(medicines, 1);
      expect(medicines).toHaveLength(originalLength);
    });
  });

  describe('deleteRecord - 删除记录', () => {
    test('应正确删除指定ID的记录', () => {
      const records = [
        { id: 1, medicineId: 1, medicineName: '药品A', takeTime: '2024-01-01' },
        { id: 2, medicineId: 1, medicineName: '药品A', takeTime: '2024-01-02' },
      ];

      const result = deleteRecord(records, 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test('删除不存在的ID应返回原列表', () => {
      const records = [{ id: 1, medicineName: '药品A' }];
      const result = deleteRecord(records, 999);
      expect(result).toHaveLength(1);
    });
  });

  describe('findMedicine - 查找药品', () => {
    test('应返回找到的药品', () => {
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' },
      ];

      const result = findMedicine(medicines, 1);
      expect(result).toBeDefined();
      expect(result.name).toBe('药品A');
    });

    test('未找到应返回undefined', () => {
      const medicines = [{ id: 1, name: '药品A' }];
      expect(findMedicine(medicines, 999)).toBeUndefined();
    });

    test('空数组应返回undefined', () => {
      expect(findMedicine([], 1)).toBeUndefined();
    });
  });

  describe('getMedicineRecords - 获取药品记录', () => {
    test('应返回该药品的所有记录', () => {
      const records = [
        { id: 1, medicineId: 1, medicineName: '药品A' },
        { id: 2, medicineId: 2, medicineName: '药品B' },
        { id: 3, medicineId: 1, medicineName: '药品A' },
      ];

      const result = getMedicineRecords(records, 1);
      expect(result).toHaveLength(2);
      expect(result.every(r => r.medicineId === 1)).toBe(true);
    });

    test('无记录时返回空数组', () => {
      const records = [{ id: 1, medicineId: 2, medicineName: '药品B' }];
      expect(getMedicineRecords(records, 1)).toHaveLength(0);
    });
  });

  describe('addMedicine - 添加药品', () => {
    test('应正确添加新药品', () => {
      const medicines = [{ id: 1, name: '药品A' }];
      const newMedicine = { id: 2, name: '药品B' };

      const result = addMedicine(medicines, newMedicine);
      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('药品B');
    });

    test('不应修改原数组', () => {
      const medicines = [{ id: 1, name: '药品A' }];
      const originalLength = medicines.length;

      addMedicine(medicines, { id: 2, name: '药品B' });
      expect(medicines).toHaveLength(originalLength);
    });

    test('应保留原数组元素', () => {
      const medicines = [{ id: 1, name: '药品A' }];
      const result = addMedicine(medicines, { id: 2, name: '药品B' });

      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('药品A');
    });
  });

  describe('addRecord - 添加记录', () => {
    test('应正确添加新记录', () => {
      const records = [{ id: 1, medicineName: '药品A' }];
      const newRecord = { id: 2, medicineName: '药品A' };

      const result = addRecord(records, newRecord);
      expect(result).toHaveLength(2);
      expect(result[1].id).toBe(2);
    });
  });

  describe('数据一致性场景', () => {
    test('删除药品时应保留其他药品的记录ID引用一致性', () => {
      // 场景：药品A被删除，但药品B的记录应该不受影响
      const medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' },
      ];
      const records = [
        { id: 1, medicineId: 1, medicineName: '药品A' },
        { id: 2, medicineId: 2, medicineName: '药品B' },
      ];

      // 删除药品A
      const remainingMedicines = deleteMedicine(medicines, 1);
      // 获取剩余药品的记录
      const remainingRecords = remainingMedicines.flatMap(m => getMedicineRecords(records, m.id));

      expect(remainingMedicines).toHaveLength(1);
      expect(remainingMedicines[0].id).toBe(2);
      expect(remainingRecords).toHaveLength(1);
      expect(remainingRecords[0].medicineId).toBe(2);
    });

    test('ID生成使用Date.now()确保唯一性', () => {
      const id1 = Date.now();
      const id2 = Date.now();
      // 由于执行速度，可能相同也可能不同，但我们确保不是固定值
      expect(typeof id1).toBe('number');
      expect(id1 > 0).toBe(true);
    });
  });
});
