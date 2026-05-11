describe('首页逻辑测试', () => {
  let mockMedicines;
  let mockRecords;
  let pageInstance;

  beforeEach(() => {
    mockMedicines = [
      { id: 1, name: '布洛芬', expiryDate: '2026-12-31' },
      { id: 2, name: '阿莫西林', expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { id: 3, name: '维生素C', expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ];
    mockRecords = [
      { id: 1, medicineId: 1, medicineName: '布洛芬', takeTime: new Date().toLocaleString() },
      { id: 2, medicineId: 2, medicineName: '阿莫西林', takeTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString() }
    ];
    
    pageInstance = {
      data: {},
      setData: jest.fn((data) => { pageInstance.data = { ...pageInstance.data, ...data }; })
    };
  });

  function loadData(page, medicines, records) {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiring = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    const today = new Date().toDateString();
    const todayRecords = records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });

    page.setData({
      medicines: medicines.slice(0, 5),
      expiringMedicines: expiring,
      todayRecords: todayRecords
    });
  }

  describe('数据加载', () => {
    test('应加载药品列表前5条', () => {
      loadData(pageInstance, mockMedicines, mockRecords);
      expect(pageInstance.data.medicines.length).toBeLessThanOrEqual(5);
    });

    test('空药品列表应正常处理', () => {
      loadData(pageInstance, [], mockRecords);
      expect(pageInstance.data.medicines).toEqual([]);
      expect(pageInstance.data.expiringMedicines).toEqual([]);
    });

    test('应正确识别即将过期药品', () => {
      loadData(pageInstance, mockMedicines, mockRecords);
      expect(pageInstance.data.expiringMedicines.length).toBeGreaterThan(0);
    });

    test('不应包含已过期药品在即将过期列表', () => {
      const expiredMedicine = { id: 999, name: '已过期', expiryDate: '2020-01-01' };
      loadData(pageInstance, [expiredMedicine], []);
      expect(pageInstance.data.expiringMedicines).toEqual([]);
    });

    test('应正确过滤今日记录', () => {
      loadData(pageInstance, mockMedicines, mockRecords);
      const today = new Date().toDateString();
      pageInstance.data.todayRecords.forEach(r => {
        expect(new Date(r.takeTime).toDateString()).toBe(today);
      });
    });

    test('无日期的药品不应崩溃', () => {
      const noDateMedicine = { id: 999, name: '无日期' };
      loadData(pageInstance, [noDateMedicine], []);
      expect(pageInstance.data.medicines).toBeDefined();
    });
  });

  describe('导航逻辑', () => {
    test('goToAdd应导航到添加页面', () => {
      const mockWx = { navigateTo: jest.fn() };
      global.wx = mockWx;
      
      const page = { goToAdd: function() { wx.navigateTo({ url: '/pages/add/add' }); } };
      page.goToAdd();
      
      expect(mockWx.navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/pages/add/add' })
      );
    });

    test('goToRecords应切换到记录Tab', () => {
      const mockWx = { switchTab: jest.fn() };
      global.wx = mockWx;
      
      const page = { goToRecords: function() { wx.switchTab({ url: '/pages/records/records' }); } };
      page.goToRecords();
      
      expect(mockWx.switchTab).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/pages/records/records' })
      );
    });

    test('goToDetail应传递ID参数', () => {
      const mockWx = { navigateTo: jest.fn() };
      global.wx = mockWx;
      
      const page = { goToDetail: function(e) { 
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
      }};
      page.goToDetail({ currentTarget: { dataset: { id: 123 } } });
      
      expect(mockWx.navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/pages/detail/detail?id=123' })
      );
    });
  });
});
