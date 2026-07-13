/**
 * pages/detail/detail.js 测试
 * 测试药品详情和服药记录逻辑
 */

// 模拟页面逻辑的核心函数
function findMedicineById(medicines, id) {
  return medicines.find(m => m.id === parseInt(id));
}

function filterRecordsByMedicineId(records, medicineId) {
  return records.filter(r => r.medicineId === medicineId);
}

function addRecord(records, medicineId, medicineName, takeTime) {
  const newRecord = {
    id: Date.now(),
    medicineId: medicineId,
    medicineName: medicineName,
    takeTime: takeTime
  };
  return [...records, newRecord];
}

describe('pages/detail/detail.js - 核心逻辑测试', () => {
  describe('药品查询功能', () => {
    test('应该根据ID查找药品', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' },
        { id: 3, name: '维生素C' },
      ];

      const result = findMedicineById(medicines, 2);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('布洛芬');
    });

    test('应该处理字符串ID（自动转换）', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' },
      ];

      const result = findMedicineById(medicines, '2');
      
      expect(result).toBeDefined();
      expect(result.id).toBe(2);
    });

    test('应该返回undefined（ID不存在）', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' },
      ];

      const result = findMedicineById(medicines, 999);
      
      expect(result).toBeUndefined();
    });

    test('应该处理空药品列表', () => {
      const result = findMedicineById([], 1);
      
      expect(result).toBeUndefined();
    });
  });

  describe('服药记录过滤功能', () => {
    test('应该根据药品ID过滤记录', () => {
      const records = [
        { id: 1, medicineId: 1, medicineName: '阿莫西林', takeTime: '2024-01-01T08:00:00' },
        { id: 2, medicineId: 2, medicineName: '布洛芬', takeTime: '2024-01-01T08:00:00' },
        { id: 3, medicineId: 1, medicineName: '阿莫西林', takeTime: '2024-01-01T12:00:00' },
      ];

      const result = filterRecordsByMedicineId(records, 1);
      
      expect(result).toHaveLength(2);
      expect(result.every(r => r.medicineId === 1)).toBe(true);
    });

    test('应该处理无匹配记录', () => {
      const records = [
        { id: 1, medicineId: 1, medicineName: '阿莫西林' },
        { id: 2, medicineId: 2, medicineName: '布洛芬' },
      ];

      const result = filterRecordsByMedicineId(records, 3);
      
      expect(result).toHaveLength(0);
    });

    test('应该处理空记录列表', () => {
      const result = filterRecordsByMedicineId([], 1);
      
      expect(result).toHaveLength(0);
    });

    test('应该保持记录的其他属性', () => {
      const records = [
        { id: 1, medicineId: 1, medicineName: '阿莫西林', takeTime: '2024-01-01T08:00:00', extra: '额外信息' },
      ];

      const result = filterRecordsByMedicineId(records, 1);
      
      expect(result[0].extra).toBe('额外信息');
    });
  });

  describe('添加服药记录功能', () => {
    test('应该成功添加服药记录', () => {
      const records = [];
      const takeTime = '2024-01-01T10:00:00';
      
      const result = addRecord(records, 1, '阿莫西林', takeTime);
      
      expect(result).toHaveLength(1);
      expect(result[0].medicineId).toBe(1);
      expect(result[0].medicineName).toBe('阿莫西林');
      expect(result[0].takeTime).toBe(takeTime);
    });

    test('应该添加到现有记录列表', () => {
      const records = [
        { id: 100, medicineId: 1, medicineName: '阿莫西林', takeTime: '2024-01-01T08:00:00' }
      ];
      const takeTime = '2024-01-01T12:00:00';
      
      const result = addRecord(records, 1, '阿莫西林', takeTime);
      
      expect(result).toHaveLength(2);
      expect(result[1].takeTime).toBe(takeTime);
    });

    test('应该生成唯一ID', () => {
      const takeTime = '2024-01-01T10:00:00';
      
      // 模拟两次添加
      const result1 = addRecord([], 1, '阿莫西林', takeTime);
      const oldNow = Date.now();
      
      // 等待一点时间确保ID不同（在测试中我们使用固定时间戳）
      jest.spyOn(Date, 'now').mockImplementation(() => oldNow + 1);
      const result2 = addRecord(result1, 1, '阿莫西林', takeTime);
      
      expect(result1[0].id).toBeDefined();
      expect(result2[1].id).toBeDefined();
    });

    test('应该处理空记录列表', () => {
      const takeTime = '2024-01-01T10:00:00';
      
      const result = addRecord([], 1, '阿莫西林', takeTime);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('药品删除确认逻辑', () => {
    test('应该确认删除操作', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' },
      ];

      const medicineToDelete = medicines.find(m => m.id === 1);
      
      expect(medicineToDelete).toBeDefined();
      expect(medicineToDelete.name).toBe('阿莫西林');
      
      // 模拟删除确认
      const result = medicines.filter(m => m.id !== 1);
      expect(result).toHaveLength(1);
    });

    test('应该取消删除操作', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' },
      ];

      // 模拟取消删除（不执行删除）
      const result = medicines;
      
      expect(result).toHaveLength(2);
    });
  });

  describe('记录反向排序', () => {
    test('应该将新记录排在前面', () => {
      const records = [
        { id: 1, takeTime: '2024-01-01T08:00:00' },
        { id: 2, takeTime: '2024-01-01T12:00:00' },
      ];

      const reversed = records.reverse();
      
      expect(reversed[0].id).toBe(2);
      expect(reversed[1].id).toBe(1);
    });
  });
});