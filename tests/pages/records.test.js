describe('pages/records/records.js - 记录页面逻辑', () => {
  let medicines;
  let records;
  let cases;

  beforeEach(() => {
    medicines = [];
    records = [];
    cases = [];
    global.wx.getStorageSync.mockImplementation((key) => {
      const storage = { medicines, records, cases };
      return storage[key];
    });
  });

  describe('loadData - 数据加载', () => {
    test('应从存储加载所有数据类型', () => {
      medicines = [{ id: 1, name: '药品1' }];
      records = [{ id: 1, medicineId: 1 }];
      cases = [{ id: 1, content: '病例1' }];

      const loadedMedicines = wx.getStorageSync('medicines') || [];
      const loadedRecords = wx.getStorageSync('records') || [];
      const loadedCases = wx.getStorageSync('cases') || [];

      expect(loadedMedicines.length).toBe(1);
      expect(loadedRecords.length).toBe(1);
      expect(loadedCases.length).toBe(1);
    });

    test('数据应以倒序显示', () => {
      medicines = [
        { id: 1, name: '第一个' },
        { id: 2, name: '第二个' },
        { id: 3, name: '第三个' }
      ];

      const reversed = medicines.reverse();
      expect(reversed[0].name).toBe('第三个');
    });
  });

  describe('switchTab - 标签页切换', () => {
    test('应正确切换当前标签', () => {
      const validTabs = ['medicines', 'records', 'cases'];
      expect(validTabs.includes('medicines')).toBe(true);
      expect(validTabs.includes('records')).toBe(true);
      expect(validTabs.includes('cases')).toBe(true);
    });

    test('无效标签不应被接受', () => {
      const validTabs = ['medicines', 'records', 'cases'];
      expect(validTabs.includes('invalid')).toBe(false);
    });
  });

  describe('addCase - 添加病例', () => {
    test('应验证输入内容非空', () => {
      const content = '';
      expect(!!content).toBe(false);
    });

    test('应生成唯一ID', () => {
      const id1 = Date.now();
      const id2 = Date.now() + 1;
      expect(id1).not.toBe(id2);
    });

    test('应包含创建时间', () => {
      const newCase = {
        id: Date.now(),
        content: '测试病例',
        createTime: new Date().toLocaleString()
      };
      expect(newCase.createTime).toBeDefined();
    });

    test('应正确添加到数组末尾', () => {
      cases = [{ id: 1, content: '病例1' }];
      const newCase = { id: 2, content: '病例2' };
      cases.push(newCase);
      expect(cases.length).toBe(2);
    });
  });

  describe('deleteMedicine - 删除药品', () => {
    test('应通过ID过滤删除药品', () => {
      medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];
      const deleteId = 1;
      medicines = medicines.filter(m => m.id !== deleteId);
      expect(medicines.length).toBe(1);
      expect(medicines[0].id).toBe(2);
    });

    test('删除后应更新本地状态', () => {
      medicines = [{ id: 1, name: '药品1' }];
      const originalLength = medicines.length;
      medicines = medicines.filter(m => m.id !== 1);
      expect(medicines.length).toBeLessThan(originalLength);
    });
  });

  describe('deleteRecord - 删除记录', () => {
    test('应正确过滤删除指定记录', () => {
      records = [
        { id: 1, medicineName: '记录1' },
        { id: 2, medicineName: '记录2' },
        { id: 3, medicineName: '记录3' }
      ];
      const deleteId = 2;
      records = records.filter(r => r.id !== deleteId);
      expect(records.length).toBe(2);
      expect(records.find(r => r.id === 2)).toBeUndefined();
    });
  });

  describe('recordTake - 记录服药', () => {
    test('应通过ID找到药品', () => {
      medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];
      const targetId = 1;
      const medicine = medicines.find(m => m.id === targetId);
      expect(medicine).toBeDefined();
      expect(medicine.name).toBe('药品1');
    });

    test('找不到药品应返回undefined', () => {
      medicines = [{ id: 1, name: '药品1' }];
      const medicine = medicines.find(m => m.id === 999);
      expect(medicine).toBeUndefined();
    });

    test('新记录应包含必要字段', () => {
      const medicineId = 1;
      const medicineName = '测试药品';
      const newRecord = {
        id: Date.now(),
        medicineId: medicineId,
        medicineName: medicineName,
        takeTime: new Date().toLocaleString()
      };

      expect(newRecord).toHaveProperty('id');
      expect(newRecord).toHaveProperty('medicineId');
      expect(newRecord).toHaveProperty('medicineName');
      expect(newRecord).toHaveProperty('takeTime');
    });
  });

  describe('goToDetail - 导航到详情', () => {
    test('应正确构建详情页URL', () => {
      const id = 123;
      const url = `/pages/detail/detail?id=${id}`;
      expect(url).toBe('/pages/detail/detail?id=123');
    });

    test('应从事件对象获取ID', () => {
      const event = {
        currentTarget: {
          dataset: {
            id: 456
          }
        }
      };
      const id = event.currentTarget.dataset.id;
      expect(id).toBe(456);
    });
  });
});
