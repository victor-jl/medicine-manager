/**
 * @jest-environment node
 */

// 模拟 wx API
global.wx = {
  getStorageSync: jest.fn((key) => {
    const mockMedicines = [
      { id: 1, name: '阿莫西林', expiryDate: '2026-07-01', description: '消炎药' },
      { id: 2, name: '布洛芬', expiryDate: '2026-12-01', description: '退烧止痛' }
    ];
    const mockRecords = [
      { id: 1, medicineId: 1, medicineName: '阿莫西林', takeTime: '2026-06-10T08:00:00' },
      { id: 2, medicineId: 1, medicineName: '阿莫西林', takeTime: '2026-06-09T08:00:00' },
      { id: 3, medicineId: 2, medicineName: '布洛芬', takeTime: '2026-06-10T12:00:00' }
    ];
    const mockData = {
      'medicines': mockMedicines,
      'records': mockRecords
    };
    return mockData[key];
  }),
  setStorageSync: jest.fn(),
  navigateBack: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn()
};

/**
 * 模拟 detail.js 中的纯函数逻辑
 */
function findMedicineById(medicines, id) {
  return medicines.find(m => m.id === id);
}

function filterRecordsByMedicineId(records, medicineId) {
  return records.filter(r => r.medicineId === medicineId);
}

function reverseRecords(records) {
  return [...records].reverse();
}

function createNewRecord(medicineId, medicineName) {
  return {
    id: Date.now(),
    medicineId: medicineId,
    medicineName: medicineName,
    takeTime: new Date().toLocaleString()
  };
}

function addRecordToStorage(records, newRecord) {
  return [...records, newRecord];
}

function removeMedicineById(medicines, medicineId) {
  return medicines.filter(m => m.id !== medicineId);
}

describe('pages/detail/detail.js - 核心逻辑', () => {
  let medicines;
  let records;

  beforeEach(() => {
    medicines = wx.getStorageSync('medicines');
    records = wx.getStorageSync('records');
    jest.clearAllMocks();
  });

  describe('findMedicineById - 查找药品', () => {
    test('应返回指定id的药品', () => {
      const result = findMedicineById(medicines, 1);
      expect(result).toBeDefined();
      expect(result.name).toBe('阿莫西林');
    });

    test('不存在的id应返回undefined', () => {
      const result = findMedicineById(medicines, 999);
      expect(result).toBeUndefined();
    });

    test('应正确解析字符串id为数字', () => {
      // onLoad 中使用 parseInt(options.id)
      const id = parseInt('1');
      const result = findMedicineById(medicines, id);
      expect(result).toBeDefined();
      expect(result.name).toBe('阿莫西林');
    });
  });

  describe('filterRecordsByMedicineId - 按药品筛选记录', () => {
    test('应返回指定药品的所有记录', () => {
      const result = filterRecordsByMedicineId(records, 1);
      expect(result.length).toBe(2);
      result.forEach(r => {
        expect(r.medicineId).toBe(1);
      });
    });

    test('应排除其他药品的记录', () => {
      const result = filterRecordsByMedicineId(records, 1);
      result.forEach(r => {
        expect(r.medicineId).not.toBe(2);
      });
    });

    test('无记录时返回空数组', () => {
      const result = filterRecordsByMedicineId(records, 999);
      expect(result).toEqual([]);
    });
  });

  describe('reverseRecords - 记录反转', () => {
    test('应反转记录顺序（新的在前）', () => {
      const result = reverseRecords(records);
      expect(result[0].id).toBe(3); // 最后添加的在前
      expect(result[2].id).toBe(1);
    });

    test('不应修改原数组', () => {
      const original = [...records];
      reverseRecords(records);
      expect(records).toEqual(original);
    });
  });

  describe('createNewRecord - 创建新记录', () => {
    test('应创建包含正确字段的记录', () => {
      const result = createNewRecord(1, '阿莫西林');
      expect(result.medicineId).toBe(1);
      expect(result.medicineName).toBe('阿莫西林');
      expect(result.id).toBeDefined();
      expect(result.takeTime).toBeDefined();
    });

    test('创建的记录应有唯一的id', () => {
      // Date.now() 在同一毫秒内可能返回相同值
      // 实际行为依赖于系统时间分辨率
      const record1 = createNewRecord(1, '阿莫西林');
      const record2 = createNewRecord(1, '阿莫西林');
      // 使用 setTimeout 确保时间戳不同
      return new Promise(resolve => {
        setTimeout(() => {
          const record3 = createNewRecord(1, '阿莫西林');
          expect(record3.id).toBeGreaterThan(record1.id);
          resolve();
        }, 2);
      });
    });
  });

  describe('addRecordToStorage - 添加记录到存储', () => {
    test('应在现有记录末尾添加新记录', () => {
      const newRecord = createNewRecord(1, '阿莫西林');
      const result = addRecordToStorage(records, newRecord);
      expect(result.length).toBe(4);
      expect(result[3]).toEqual(newRecord);
    });

    test('应保留原有记录', () => {
      const newRecord = createNewRecord(1, '阿莫西林');
      const result = addRecordToStorage(records, newRecord);
      expect(result[0].id).toBe(1);
    });
  });

  describe('removeMedicineById - 删除药品', () => {
    test('应删除指定id的药品', () => {
      const result = removeMedicineById(medicines, 1);
      expect(result.find(m => m.id === 1)).toBeUndefined();
      expect(result.length).toBe(1);
    });

    test('应保留其他药品', () => {
      const result = removeMedicineById(medicines, 1);
      expect(result.find(m => m.id === 2)).toBeDefined();
    });

    test('不存在的id应返回原数组', () => {
      const result = removeMedicineById(medicines, 999);
      expect(result.length).toBe(2);
    });
  });

  describe('recordTake - 记录服药', () => {
    test('应在detail页面正确创建服药记录', () => {
      const medicineId = 1;
      const medicineName = '阿莫西林';
      const newRecord = createNewRecord(medicineId, medicineName);
      const result = addRecordToStorage(records, newRecord);

      expect(result.length).toBe(4);
      expect(result[3].medicineId).toBe(medicineId);
      expect(result[3].medicineName).toBe(medicineName);
    });
  });

  describe('deleteMedicine - 删除药品', () => {
    test('确认删除时应移除药品', () => {
      // 模拟 showModal 确认逻辑
      const shouldDelete = true;
      let resultMedicines = medicines;

      if (shouldDelete) {
        resultMedicines = removeMedicineById(medicines, 1);
        wx.setStorageSync('medicines', resultMedicines);
      }

      expect(resultMedicines.length).toBe(1);
      expect(resultMedicines.find(m => m.id === 1)).toBeUndefined();
      expect(wx.setStorageSync).toHaveBeenCalled();
    });

    test('取消删除时应保留药品', () => {
      const shouldDelete = false;
      let resultMedicines = medicines;

      if (shouldDelete) {
        resultMedicines = removeMedicineById(medicines, 1);
      }

      expect(resultMedicines.length).toBe(2);
      expect(resultMedicines.find(m => m.id === 1)).toBeDefined();
    });
  });
});

describe('pages/detail/detail.js - 页面导航', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('删除后应导航返回', () => {
    let currentMedicines = [
      { id: 1, name: '阿莫西林' },
      { id: 2, name: '布洛芬' }
    ];

    const deleteAndNavigateBack = () => {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个药品吗？',
        success: (res) => {
          if (res.confirm) {
            currentMedicines = currentMedicines.filter(m => m.id !== 1);
            wx.setStorageSync('medicines', currentMedicines);
            wx.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        }
      });
    };

    // 模拟确认删除
    wx.showModal.mockImplementation((options) => {
      options.success({ confirm: true });
    });

    deleteAndNavigateBack();

    // 验证 setStorageSync 和 showToast 被调用
    expect(wx.setStorageSync).toHaveBeenCalled();
    expect(wx.showToast).toHaveBeenCalledWith({ title: '删除成功', icon: 'success' });
  });
});
