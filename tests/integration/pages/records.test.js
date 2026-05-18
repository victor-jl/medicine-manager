/**
 * pages/records/records.js 集成测试
 * 测试记录管理、删除和服药记录功能
 */

describe('记录页面 - records.js 业务逻辑', () => {
  let page;

  beforeEach(() => {
    jest.resetModules();
    global.__wxStorage = {};
    global.wx.navigateTo = jest.fn();
    global.wx.showToast = jest.fn();
    global.wx.showModal = jest.fn();

    page = require('../../../pages/records/records');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadData - 数据加载', () => {
    test('应正确加载所有数据', () => {
      const medicines = [{ id: 1, name: '药品1' }];
      const records = [{ id: 1, medicineName: '记录1' }];
      const cases = [{ id: 1, content: '病例1' }];
      
      global.__wxStorage['medicines'] = medicines;
      global.__wxStorage['records'] = records;
      global.__wxStorage['cases'] = cases;

      const mockThis = { setData: jest.fn() };
      page.loadData.call(mockThis);

      expect(mockThis.setData).toHaveBeenCalledWith(
        expect.objectContaining({
          medicines: expect.any(Array),
          records: expect.any(Array),
          cases: expect.any(Array)
        })
      );
    });

    test('数据应按倒序排列', () => {
      const medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' },
        { id: 3, name: '药品3' }
      ];
      
      global.__wxStorage['medicines'] = medicines;
      global.__wxStorage['records'] = [];
      global.__wxStorage['cases'] = [];

      const mockThis = { setData: jest.fn() };
      page.loadData.call(mockThis);

      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(setDataCall.medicines[0].name).toBe('药品3');
      expect(setDataCall.medicines[2].name).toBe('药品1');
    });

    test('空数据应正常处理', () => {
      global.__wxStorage['medicines'] = [];
      global.__wxStorage['records'] = [];
      global.__wxStorage['cases'] = [];

      const mockThis = { setData: jest.fn() };
      
      expect(() => page.loadData.call(mockThis)).not.toThrow();
    });

    test('null数据应正常处理', () => {
      global.__wxStorage['medicines'] = null;
      global.__wxStorage['records'] = null;
      global.__wxStorage['cases'] = null;

      const mockThis = { setData: jest.fn() };
      
      expect(() => page.loadData.call(mockThis)).not.toThrow();
    });
  });

  describe('switchTab - 标签页切换', () => {
    test('应切换到 medicines 标签', () => {
      const mockThis = { setData: jest.fn() };
      const mockEvent = { currentTarget: { dataset: { tab: 'medicines' } } };

      page.switchTab.call(mockThis, mockEvent);

      expect(mockThis.setData).toHaveBeenCalledWith({
        currentTab: 'medicines'
      });
    });

    test('应切换到 records 标签', () => {
      const mockThis = { setData: jest.fn() };
      const mockEvent = { currentTarget: { dataset: { tab: 'records' } } };

      page.switchTab.call(mockThis, mockEvent);

      expect(mockThis.setData).toHaveBeenCalledWith({
        currentTab: 'records'
      });
    });

    test('应切换到 cases 标签', () => {
      const mockThis = { setData: jest.fn() };
      const mockEvent = { currentTarget: { dataset: { tab: 'cases' } } };

      page.switchTab.call(mockThis, mockEvent);

      expect(mockThis.setData).toHaveBeenCalledWith({
        currentTab: 'cases'
      });
    });

    test('应处理未知标签', () => {
      const mockThis = { setData: jest.fn() };
      const mockEvent = { currentTarget: { dataset: { tab: 'unknown' } } };

      page.switchTab.call(mockThis, mockEvent);

      expect(mockThis.setData).toHaveBeenCalledWith({
        currentTab: 'unknown'
      });
    });
  });

  describe('deleteMedicine - 删除药品', () => {
    test('应显示确认对话框', () => {
      const mockEvent = { currentTarget: { dataset: { id: 1 } } };

      page.deleteMedicine.call({ data: {} }, mockEvent);

      expect(global.wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认删除',
          content: '确定要删除这个药品吗？'
        })
      );
    });

    test('确认后应删除药品', () => {
      global.__wxStorage['medicines'] = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.deleteMedicine.call(mockThis, { currentTarget: { dataset: { id: 1 } } });

      expect(global.__wxStorage['medicines'].length).toBe(1);
      expect(global.__wxStorage['medicines'][0].id).toBe(2);
    });

    test('取消后不应删除药品', () => {
      global.__wxStorage['medicines'] = [
        { id: 1, name: '药品1' }
      ];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: false });
      });

      page.deleteMedicine.call(mockThis, { currentTarget: { dataset: { id: 1 } } });

      expect(global.__wxStorage['medicines'].length).toBe(1);
      expect(mockThis.loadData).not.toHaveBeenCalled();
    });

    test('删除成功应刷新数据', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '药品1' }];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.deleteMedicine.call(mockThis, { currentTarget: { dataset: { id: 1 } } });

      expect(mockThis.loadData).toHaveBeenCalled();
    });

    test('删除不存在药品ID应正常处理', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '药品1' }];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.deleteMedicine.call(mockThis, { currentTarget: { dataset: { id: 999 } } });

      expect(mockThis.loadData).toHaveBeenCalled();
    });
  });

  describe('deleteRecord - 删除记录', () => {
    test('应显示确认对话框', () => {
      const mockEvent = { currentTarget: { dataset: { id: 1 } } };

      page.deleteRecord.call({ data: {} }, mockEvent);

      expect(global.wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认删除',
          content: '确定要删除这条记录吗？'
        })
      );
    });

    test('确认后应删除记录', () => {
      global.__wxStorage['records'] = [
        { id: 1, medicineName: '记录1' },
        { id: 2, medicineName: '记录2' }
      ];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.deleteRecord.call(mockThis, { currentTarget: { dataset: { id: 1 } } });

      expect(global.__wxStorage['records'].length).toBe(1);
      expect(global.__wxStorage['records'][0].id).toBe(2);
    });

    test('取消后不应删除记录', () => {
      global.__wxStorage['records'] = [{ id: 1, medicineName: '记录1' }];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: false });
      });

      page.deleteRecord.call(mockThis, { currentTarget: { dataset: { id: 1 } } });

      expect(global.__wxStorage['records'].length).toBe(1);
    });
  });

  describe('addCase - 添加病例', () => {
    test('应显示输入对话框', () => {
      page.addCase.call({ data: {} });

      expect(global.wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '添加病例',
          editable: true,
          placeholderText: '请输入病例描述'
        })
      );
    });

    test('确认并有内容时应添加病例', () => {
      global.__wxStorage['cases'] = [];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({
          confirm: true,
          content: '这是病例内容'
        });
      });

      page.addCase.call(mockThis);

      expect(global.__wxStorage['cases'].length).toBe(1);
      expect(global.__wxStorage['cases'][0].content).toBe('这是病例内容');
    });

    test('确认但无内容时不应添加', () => {
      global.__wxStorage['cases'] = [];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({
          confirm: true,
          content: ''
        });
      });

      page.addCase.call(mockThis);

      expect(global.__wxStorage['cases'].length).toBe(0);
    });

    test('取消时不应添加', () => {
      global.__wxStorage['cases'] = [];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: false });
      });

      page.addCase.call(mockThis);

      expect(global.__wxStorage['cases'].length).toBe(0);
      expect(mockThis.loadData).not.toHaveBeenCalled();
    });

    test('添加成功应显示提示', () => {
      global.__wxStorage['cases'] = [];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({
          confirm: true,
          content: '病例内容'
        });
      });

      page.addCase.call(mockThis);

      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '添加成功',
          icon: 'success'
        })
      );
    });

    test('添加成功应刷新数据', () => {
      global.__wxStorage['cases'] = [];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({
          confirm: true,
          content: '病例内容'
        });
      });

      page.addCase.call(mockThis);

      expect(mockThis.loadData).toHaveBeenCalled();
    });

    test('应生成唯一ID', () => {
      global.__wxStorage['cases'] = [];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({
          confirm: true,
          content: '病例内容'
        });
      });

      page.addCase.call(mockThis);

      expect(global.__wxStorage['cases'][0].id).toBeDefined();
      expect(typeof global.__wxStorage['cases'][0].id).toBe('number');
    });

    test('应记录创建时间', () => {
      global.__wxStorage['cases'] = [];

      const mockThis = {
        data: {},
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({
          confirm: true,
          content: '病例内容'
        });
      });

      page.addCase.call(mockThis);

      expect(global.__wxStorage['cases'][0].createTime).toBeDefined();
    });
  });

  describe('recordTake - 记录服药', () => {
    test('应找到对应药品', () => {
      const medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];
      global.__wxStorage['medicines'] = medicines;
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: { medicines },
        loadData: jest.fn()
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.recordTake.call(mockThis, { currentTarget: { dataset: { id: 2 } } });

      expect(global.__wxStorage['records'].length).toBe(1);
      expect(global.__wxStorage['records'][0].medicineName).toBe('药品2');
    });

    test('应创建包含药品ID和名称的记录', () => {
      global.__wxStorage['medicines'] = [{ id: 123, name: '测试药品' }];
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: { medicines: [{ id: 123, name: '测试药品' }] },
        loadData: jest.fn()
      };

      page.recordTake.call(mockThis, { currentTarget: { dataset: { id: 123 } } });

      const record = global.__wxStorage['records'][0];
      expect(record.medicineId).toBe(123);
      expect(record.medicineName).toBe('测试药品');
      expect(record.takeTime).toBeDefined();
    });

    test('应追加到现有记录', () => {
      global.__wxStorage['records'] = [{ id: 1, medicineName: '已有' }];
      global.__wxStorage['medicines'] = [{ id: 2, name: '新药品' }];

      const mockThis = {
        data: { medicines: [{ id: 2, name: '新药品' }] },
        loadData: jest.fn()
      };

      page.recordTake.call(mockThis, { currentTarget: { dataset: { id: 2 } } });

      expect(global.__wxStorage['records'].length).toBe(2);
    });

    test('应显示成功提示', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '测试' }];
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: { medicines: [{ id: 1, name: '测试' }] },
        loadData: jest.fn()
      };

      page.recordTake.call(mockThis, { currentTarget: { dataset: { id: 1 } } });

      expect(global.wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '记录成功',
          icon: 'success'
        })
      );
    });
  });

  describe('goToDetail - 跳转详情', () => {
    test('应导航到详情页并传递ID', () => {
      const mockEvent = { currentTarget: { dataset: { id: 123 } } };

      page.goToDetail(mockEvent);

      expect(global.wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=123'
      });
    });

    test('应处理字符串ID', () => {
      const mockEvent = { currentTarget: { dataset: { id: 'abc' } } };

      page.goToDetail(mockEvent);

      expect(global.wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=abc'
      });
    });
  });

  describe('生命周期', () => {
    test('onShow 应调用 loadData', () => {
      const mockThis = { loadData: jest.fn() };

      page.onShow.call(mockThis);

      expect(mockThis.loadData).toHaveBeenCalled();
    });

    test('onLoad 应初始化病例存储', () => {
      global.__wxStorage['cases'] = null;

      const mockThis = { data: {} };

      page.onLoad.call(mockThis);

      expect(global.__wxStorage['cases']).toEqual([]);
    });

    test('onLoad 不应覆盖已有病例数据', () => {
      const existingCases = [{ id: 1, content: '已有' }];
      global.__wxStorage['cases'] = existingCases;

      const mockThis = { data: {} };

      page.onLoad.call(mockThis);

      expect(global.__wxStorage['cases']).toEqual(existingCases);
    });
  });
});
