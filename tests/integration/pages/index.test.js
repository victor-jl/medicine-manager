/**
 * pages/index/index.js 集成测试
 * 测试首页药品展示、过期提醒和服药记录功能
 */

describe('首页 - index.js 业务逻辑', () => {
  let page;

  beforeEach(() => {
    jest.resetModules();
    global.__wxStorage = {};
    global.wx.navigateTo = jest.fn();
    global.wx.switchTab = jest.fn();
    
    const indexModule = require('../../../pages/index/index');
    page = indexModule;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadData - 数据加载逻辑', () => {
    test('应正确加载所有药品数据', () => {
      const medicines = [
        { id: 1, name: '阿莫西林', expiryDate: '2026-12-31' },
        { id: 2, name: '布洛芬', expiryDate: '2026-06-30' }
      ];
      global.__wxStorage['medicines'] = medicines;
      
      const records = [
        { id: 1, medicineId: 1, takeTime: new Date().toLocaleString() }
      ];
      global.__wxStorage['records'] = records;
      
      const mockThis = {
        setData: jest.fn()
      };
      
      page.loadData.call(mockThis);
      
      expect(mockThis.setData).toHaveBeenCalled();
      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(setDataCall.medicines).toBeDefined();
    });

    test('应正确识别30天内即将过期的药品', () => {
      const now = new Date();
      const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
      const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      
      const medicines = [
        { id: 1, name: '15天后过期', expiryDate: in15Days.toISOString().split('T')[0] },
        { id: 2, name: '45天后过期', expiryDate: in45Days.toISOString().split('T')[0] },
        { id: 3, name: '已过期', expiryDate: pastDate.toISOString().split('T')[0] },
        { id: 4, name: '无有效期', expiryDate: '' }
      ];
      global.__wxStorage['medicines'] = medicines;
      global.__wxStorage['records'] = [];
      
      const mockThis = { setData: jest.fn() };
      page.loadData.call(mockThis);
      
      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(setDataCall.expiringMedicines).toHaveLength(1);
      expect(setDataCall.expiringMedicines[0].name).toBe('15天后过期');
    });

    test('应正确获取今日服药记录', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      const records = [
        { id: 1, medicineId: 1, takeTime: today.toLocaleString(), medicineName: '今日记录' },
        { id: 2, medicineId: 2, takeTime: yesterday.toLocaleString(), medicineName: '昨日记录' }
      ];
      global.__wxStorage['medicines'] = [];
      global.__wxStorage['records'] = records;
      
      const mockThis = { setData: jest.fn() };
      page.loadData.call(mockThis);
      
      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(setDataCall.todayRecords).toHaveLength(1);
      expect(setDataCall.todayRecords[0].medicineName).toBe('今日记录');
    });

    test('空存储应正常处理', () => {
      global.__wxStorage['medicines'] = null;
      global.__wxStorage['records'] = null;
      
      const mockThis = { setData: jest.fn() };
      
      expect(() => page.loadData.call(mockThis)).not.toThrow();
      expect(mockThis.setData).toHaveBeenCalled();
    });
  });

  describe('导航功能', () => {
    test('goToAdd 应导航到添加页面', () => {
      page.goToAdd();
      expect(global.wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/add/add'
      });
    });

    test('goToRecords 应切换到记录Tab', () => {
      page.goToRecords();
      expect(global.wx.switchTab).toHaveBeenCalledWith({
        url: '/pages/records/records'
      });
    });

    test('goToDetail 应导航到详情页并传递ID', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {
            id: 123
          }
        }
      };
      
      page.goToDetail(mockEvent);
      
      expect(global.wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=123'
      });
    });

    test('goToDetail 应处理字符串ID', () => {
      const mockEvent = {
        currentTarget: {
          dataset: {
            id: 'abc123'
          }
        }
      };
      
      page.goToDetail(mockEvent);
      
      expect(global.wx.navigateTo).toHaveBeenCalledWith({
        url: '/pages/detail/detail?id=abc123'
      });
    });
  });

  describe('onShow 生命周期', () => {
    test('onShow 应调用 loadData', () => {
      const mockThis = {
        loadData: jest.fn()
      };
      
      page.onShow.call(mockThis);
      
      expect(mockThis.loadData).toHaveBeenCalled();
    });
  });

  describe('边界条件', () => {
    test('loadData 应处理缺少expiryDate的药品', () => {
      const medicines = [
        { id: 1, name: '无有效期', expiryDate: '' },
        { id: 2, name: 'null有效期', expiryDate: null }
      ];
      global.__wxStorage['medicines'] = medicines;
      global.__wxStorage['records'] = [];
      
      const mockThis = { setData: jest.fn() };
      
      expect(() => page.loadData.call(mockThis)).not.toThrow();
    });

    test('loadData 应处理缺少takeTime的记录', () => {
      const medicines = [];
      const records = [
        { id: 1, medicineId: 1, takeTime: null },
        { id: 2, medicineId: 2, takeTime: undefined }
      ];
      global.__wxStorage['medicines'] = medicines;
      global.__wxStorage['records'] = records;
      
      const mockThis = { setData: jest.fn() };
      
      expect(() => page.loadData.call(mockThis)).not.toThrow();
    });

    test('loadData 应正确限制药品列表为前5条', () => {
      const medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' },
        { id: 3, name: '药品3' },
        { id: 4, name: '药品4' },
        { id: 5, name: '药品5' },
        { id: 6, name: '药品6' },
        { id: 7, name: '药品7' }
      ];
      global.__wxStorage['medicines'] = medicines;
      global.__wxStorage['records'] = [];
      
      const mockThis = { setData: jest.fn() };
      page.loadData.call(mockThis);
      
      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(setDataCall.medicines).toHaveLength(5);
    });

    test('loadData 应处理日期字符串转换错误', () => {
      const medicines = [
        { id: 1, name: '非法日期', expiryDate: 'not-a-date' }
      ];
      global.__wxStorage['medicines'] = medicines;
      global.__wxStorage['records'] = [];
      
      const mockThis = { setData: jest.fn() };
      
      expect(() => page.loadData.call(mockThis)).not.toThrow();
    });
  });
});
