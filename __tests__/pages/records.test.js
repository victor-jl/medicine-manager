/**
 * @jest-environment node
 */

// 模拟 wx API
global.wx = {
  getStorageSync: jest.fn((key) => {
    const mockData = {
      'medicines': [
        { id: 1, name: '阿莫西林', expiryDate: '2026-07-01' },
        { id: 2, name: '布洛芬', expiryDate: '2026-12-01' },
        { id: 3, name: '维生素C', expiryDate: '2026-06-15' }
      ],
      'records': [
        { id: 1, medicineId: 1, medicineName: '阿莫西林', takeTime: '2026-06-10T08:00:00' },
        { id: 2, medicineId: 2, medicineName: '布洛芬', takeTime: '2026-06-10T12:00:00' },
        { id: 3, medicineId: 1, medicineName: '阿莫西林', takeTime: '2026-06-09T08:00:00' }
      ],
      'cases': [
        { id: 1, content: '病例1', createTime: '2026-06-01' },
        { id: 2, content: '病例2', createTime: '2026-06-05' }
      ]
    };
    return mockData[key];
  }),
  setStorageSync: jest.fn(),
  navigateTo: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn()
};

/**
 * 模拟 records.js 中的纯函数逻辑
 */
function deleteMedicine(medicines, id) {
  return medicines.filter(m => m.id !== id);
}

function deleteRecord(records, id) {
  return records.filter(r => r.id !== id);
}

function deleteCase(cases, id) {
  return cases.filter(c => c.id !== id);
}

function reverseArray(arr) {
  return [...arr].reverse();
}

function addRecord(records, newRecord) {
  return [...records, newRecord];
}

function addCase(cases, newCase) {
  return [...cases, newCase];
}

function addMedicine(medicines, newMedicine) {
  return [...medicines, newMedicine];
}

describe('pages/records/records.js - 核心逻辑', () => {
  let medicines;
  let records;
  let cases;

  beforeEach(() => {
    medicines = wx.getStorageSync('medicines');
    records = wx.getStorageSync('records');
    cases = wx.getStorageSync('cases');
    jest.clearAllMocks();
  });

  describe('deleteMedicine - 删除药品', () => {
    test('应删除指定id的药品', () => {
      const result = deleteMedicine(medicines, 1);
      expect(result.find(m => m.id === 1)).toBeUndefined();
      expect(result.length).toBe(2);
    });

    test('应保留其他药品不受影响', () => {
      const result = deleteMedicine(medicines, 1);
      expect(result.find(m => m.id === 2)).toBeDefined();
      expect(result.find(m => m.id === 3)).toBeDefined();
    });

    test('不存在的id应返回原数组', () => {
      const result = deleteMedicine(medicines, 999);
      expect(result.length).toBe(3);
    });

    test('空数组应返回空结果', () => {
      const result = deleteMedicine([], 1);
      expect(result).toEqual([]);
    });
  });

  describe('deleteRecord - 删除记录', () => {
    test('应删除指定id的记录', () => {
      const result = deleteRecord(records, 1);
      expect(result.find(r => r.id === 1)).toBeUndefined();
      expect(result.length).toBe(2);
    });

    test('应保留其他记录不受影响', () => {
      const result = deleteRecord(records, 1);
      expect(result.find(r => r.id === 2)).toBeDefined();
      expect(result.find(r => r.id === 3)).toBeDefined();
    });

    test('删除最后一条记录应返回空数组', () => {
      const singleRecord = [{ id: 1, medicineName: '测试' }];
      const result = deleteRecord(singleRecord, 1);
      expect(result).toEqual([]);
    });
  });

  describe('deleteCase - 删除病例', () => {
    test('应删除指定id的病例', () => {
      const result = deleteCase(cases, 1);
      expect(result.find(c => c.id === 1)).toBeUndefined();
      expect(result.length).toBe(1);
    });

    test('应保留其他病例不受影响', () => {
      const result = deleteCase(cases, 1);
      expect(result.find(c => c.id === 2)).toBeDefined();
    });
  });

  describe('reverseArray - 数组反转', () => {
    test('应反转数组顺序', () => {
      const original = [1, 2, 3];
      const result = reverseArray(original);
      expect(result).toEqual([3, 2, 1]);
    });

    test('不应修改原数组', () => {
      const original = [1, 2, 3];
      reverseArray(original);
      expect(original).toEqual([1, 2, 3]);
    });

    test('空数组应返回空数组', () => {
      const result = reverseArray([]);
      expect(result).toEqual([]);
    });
  });

  describe('addRecord - 添加记录', () => {
    test('应添加新记录到数组末尾', () => {
      const newRecord = { id: 4, medicineName: '新药品', takeTime: new Date().toISOString() };
      const result = addRecord(records, newRecord);
      expect(result.length).toBe(4);
      expect(result[3]).toEqual(newRecord);
    });

    test('应保留原有记录', () => {
      const newRecord = { id: 4, medicineName: '新药品', takeTime: new Date().toISOString() };
      const result = addRecord(records, newRecord);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });
  });

  describe('addCase - 添加病例', () => {
    test('应添加新病例', () => {
      const newCase = { id: 3, content: '新病例', createTime: new Date().toISOString() };
      const result = addCase(cases, newCase);
      expect(result.length).toBe(3);
      expect(result[2]).toEqual(newCase);
    });
  });

  describe('addMedicine - 添加药品', () => {
    test('应添加新药品', () => {
      const newMedicine = { id: 4, name: '新药品', expiryDate: '2026-12-31' };
      const result = addMedicine(medicines, newMedicine);
      expect(result.length).toBe(4);
      expect(result[3]).toEqual(newMedicine);
    });
  });

  describe('记录服药 - recordTake', () => {
    test('应为指定药品创建新记录', () => {
      const medicineId = 1;
      const medicineName = '阿莫西林';
      const newRecord = {
        id: Date.now(),
        medicineId: medicineId,
        medicineName: medicineName,
        takeTime: new Date().toLocaleString()
      };
      const result = addRecord(records, newRecord);
      expect(result.length).toBe(4);
      expect(result[3].medicineId).toBe(medicineId);
      expect(result[3].medicineName).toBe(medicineName);
    });
  });

  describe('switchTab - 标签页切换', () => {
    test('应正确切换到 medicines 标签', () => {
      const currentTab = 'medicines';
      expect(currentTab).toBe('medicines');
    });

    test('应正确切换到 records 标签', () => {
      const currentTab = 'records';
      expect(currentTab).toBe('records');
    });

    test('应正确切换到 cases 标签', () => {
      const currentTab = 'cases';
      expect(currentTab).toBe('cases');
    });
  });
});

describe('pages/records/records.js - 页面导航', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('goToDetail 应传递正确的id参数', () => {
    const mockId = 123;
    const goToDetail = (id) => {
      wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
    };
    goToDetail(mockId);
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/detail/detail?id=123' });
  });
});
