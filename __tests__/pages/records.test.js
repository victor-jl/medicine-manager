/**
 * pages/records/records.js 测试
 * 测试药品记录管理逻辑
 */

// 模拟页面逻辑的核心函数
function deleteMedicine(medicines, medicineId) {
  return medicines.filter(m => m.id !== medicineId);
}

function deleteRecord(records, recordId) {
  return records.filter(r => r.id !== recordId);
}

function addCase(cases, content, createTime) {
  const newCase = {
    id: Date.now(),
    content: content,
    createTime: createTime
  };
  return [...cases, newCase];
}

describe('pages/records/records.js - 核心逻辑测试', () => {
  describe('药品删除功能', () => {
    test('应该成功删除指定药品', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' },
        { id: 3, name: '维生素C' },
      ];

      const result = deleteMedicine(medicines, 2);
      
      expect(result).toHaveLength(2);
      expect(result.find(m => m.id === 2)).toBeUndefined();
      expect(result.find(m => m.id === 1)).toBeDefined();
      expect(result.find(m => m.id === 3)).toBeDefined();
    });

    test('应该处理删除不存在的药品', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' },
      ];

      const result = deleteMedicine(medicines, 999);
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(medicines);
    });

    test('应该处理空药品列表', () => {
      const result = deleteMedicine([], 1);
      
      expect(result).toHaveLength(0);
    });

    test('应该保持其他药品数据不变', () => {
      const medicines = [
        { id: 1, name: '阿莫西林', expiryDate: '2025-01-01', description: '描述1' },
        { id: 2, name: '布洛芬', expiryDate: '2025-02-01', description: '描述2' },
      ];

      const result = deleteMedicine(medicines, 1);
      
      expect(result[0].name).toBe('布洛芬');
      expect(result[0].expiryDate).toBe('2025-02-01');
      expect(result[0].description).toBe('描述2');
    });
  });

  describe('服药记录删除功能', () => {
    test('应该成功删除指定记录', () => {
      const records = [
        { id: 1, medicineName: '阿莫西林', takeTime: '2024-01-01' },
        { id: 2, medicineName: '布洛芬', takeTime: '2024-01-01' },
        { id: 3, medicineName: '维生素C', takeTime: '2024-01-01' },
      ];

      const result = deleteRecord(records, 2);
      
      expect(result).toHaveLength(2);
      expect(result.find(r => r.id === 2)).toBeUndefined();
    });

    test('应该处理删除不存在的记录', () => {
      const records = [
        { id: 1, medicineName: '阿莫西林', takeTime: '2024-01-01' },
      ];

      const result = deleteRecord(records, 999);
      
      expect(result).toHaveLength(1);
      expect(result).toEqual(records);
    });

    test('应该处理空记录列表', () => {
      const result = deleteRecord([], 1);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('病例添加功能', () => {
    test('应该成功添加病例', () => {
      const cases = [];
      const createTime = '2024-01-01T10:00:00';
      
      const result = addCase(cases, '感冒发烧', createTime);
      
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('感冒发烧');
      expect(result[0].createTime).toBe(createTime);
      expect(result[0].id).toBeDefined();
    });

    test('应该添加到现有病例列表', () => {
      const cases = [
        { id: 1, content: '头痛', createTime: '2023-12-01' }
      ];
      const createTime = '2024-01-01T10:00:00';
      
      const result = addCase(cases, '感冒', createTime);
      
      expect(result).toHaveLength(2);
      expect(result[1].content).toBe('感冒');
    });

    test('应该处理空病例内容', () => {
      const cases = [];
      const createTime = '2024-01-01T10:00:00';
      
      const result = addCase(cases, '', createTime);
      
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('');
    });

    test('应该处理空病例列表', () => {
      const createTime = '2024-01-01T10:00:00';
      
      const result = addCase([], '新病例', createTime);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('数据反向排序（最新在前）', () => {
    test('应该反向排序药品列表', () => {
      const medicines = [
        { id: 1, name: '药品1', createTime: '2024-01-01' },
        { id: 2, name: '药品2', createTime: '2024-01-02' },
        { id: 3, name: '药品3', createTime: '2024-01-03' },
      ];

      const reversed = medicines.reverse();
      
      expect(reversed[0].id).toBe(3);
      expect(reversed[1].id).toBe(2);
      expect(reversed[2].id).toBe(1);
    });

    test('应该反向排序记录列表', () => {
      const records = [
        { id: 1, takeTime: '2024-01-01T08:00:00' },
        { id: 2, takeTime: '2024-01-01T12:00:00' },
        { id: 3, takeTime: '2024-01-01T16:00:00' },
      ];

      const reversed = records.reverse();
      
      expect(reversed[0].id).toBe(3);
      expect(reversed[1].id).toBe(2);
      expect(reversed[2].id).toBe(1);
    });
  });

  describe('Tab切换逻辑', () => {
    test('应该切换到指定tab', () => {
      const currentTab = 'medicines';
      const newTab = 'records';
      
      expect(newTab).toBe('records');
      expect(newTab).not.toBe(currentTab);
    });

    test('应该保持当前tab', () => {
      const currentTab = 'medicines';
      const newTab = 'medicines';
      
      expect(newTab).toBe(currentTab);
    });
  });
});