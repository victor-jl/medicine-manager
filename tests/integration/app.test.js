/**
 * app.js 集成测试
 * 测试应用初始化和全局数据管理
 */

describe('应用入口 - app.js 业务逻辑', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    global.__wxStorage = {};
    global.wx.getStorageSync = jest.fn((key) => {
      return global.__wxStorage[key];
    });
    global.wx.setStorageSync = jest.fn((key, value) => {
      global.__wxStorage[key] = value;
    });

    app = require('../../app');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onLaunch - 应用启动', () => {
    test('应初始化本地存储', () => {
      global.__wxStorage['medicines'] = [];
      global.__wxStorage['records'] = [];
      global.__wxStorage['cases'] = [];

      app.onLaunch();

      expect(global.wx.getStorageSync).toHaveBeenCalledWith('medicines');
      expect(global.wx.getStorageSync).toHaveBeenCalledWith('records');
      expect(global.wx.getStorageSync).toHaveBeenCalledWith('cases');
    });

    test('空medicines应设置为空数组', () => {
      global.__wxStorage['medicines'] = [];
      global.__wxStorage['records'] = null;
      global.__wxStorage['cases'] = undefined;

      app.onLaunch();

      expect(global.__wxStorage['medicines']).toEqual([]);
      expect(global.__wxStorage['records']).toEqual([]);
      expect(global.__wxStorage['cases']).toEqual([]);
    });

    test('已存在数据不应被覆盖', () => {
      const existingMedicines = [{ id: 1, name: '已有药品' }];
      const existingRecords = [{ id: 1, medicineName: '已有记录' }];
      const existingCases = [{ id: 1, content: '已有病例' }];

      global.__wxStorage['medicines'] = existingMedicines;
      global.__wxStorage['records'] = existingRecords;
      global.__wxStorage['cases'] = existingCases;

      app.onLaunch();

      expect(global.__wxStorage['medicines']).toEqual(existingMedicines);
      expect(global.__wxStorage['records']).toEqual(existingRecords);
      expect(global.__wxStorage['cases']).toEqual(existingCases);
    });

    test('空数组不应重新初始化', () => {
      global.__wxStorage['medicines'] = [];
      global.__wxStorage['records'] = [];
      global.__wxStorage['cases'] = [];

      app.onLaunch();

      expect(global.wx.setStorageSync).not.toHaveBeenCalled();
    });

    test('null值应初始化为空数组', () => {
      global.__wxStorage['medicines'] = null;
      global.__wxStorage['records'] = null;
      global.__wxStorage['cases'] = null;

      app.onLaunch();

      expect(global.__wxStorage['medicines']).toEqual([]);
      expect(global.__wxStorage['records']).toEqual([]);
      expect(global.__wxStorage['cases']).toEqual([]);
    });

    test('undefined值应初始化为空数组', () => {
      global.__wxStorage['medicines'] = undefined;
      global.__wxStorage['records'] = undefined;
      global.__wxStorage['cases'] = undefined;

      app.onLaunch();

      expect(global.__wxStorage['medicines']).toEqual([]);
      expect(global.__wxStorage['records']).toEqual([]);
      expect(global.__wxStorage['cases']).toEqual([]);
    });
  });

  describe('globalData - 全局数据', () => {
    test('应定义全局数据对象', () => {
      expect(app.globalData).toBeDefined();
    });

    test('userInfo初始应为null', () => {
      expect(app.globalData.userInfo).toBeNull();
    });

    test('globalData应可修改', () => {
      const testUserInfo = { name: '测试用户' };
      app.globalData.userInfo = testUserInfo;

      expect(app.globalData.userInfo).toEqual(testUserInfo);
    });
  });

  describe('边界条件', () => {
    test('处理大量已有数据', () => {
      const manyMedicines = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `药品${i}`
      }));
      const manyRecords = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        medicineName: `记录${i}`
      }));
      const manyCases = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        content: `病例${i}`
      }));

      global.__wxStorage['medicines'] = manyMedicines;
      global.__wxStorage['records'] = manyRecords;
      global.__wxStorage['cases'] = manyCases;

      expect(() => app.onLaunch()).not.toThrow();
      expect(global.__wxStorage['medicines']).toEqual(manyMedicines);
    });

    test('处理包含特殊字符的数据', () => {
      const specialData = {
        medicines: [{ id: 1, name: '药品@#$%^&' }],
        records: [{ id: 1, content: '内容<script>alert(1)</script>' }],
        cases: [{ id: 1, content: '病例内容' }]
      };

      global.__wxStorage['medicines'] = specialData.medicines;
      global.__wxStorage['records'] = specialData.records;
      global.__wxStorage['cases'] = specialData.cases;

      expect(() => app.onLaunch()).not.toThrow();
    });

    test('处理循环引用的数据', () => {
      const circularData = { id: 1 };
      circularData.self = circularData;

      global.__wxStorage['medicines'] = circularData;
      global.__wxStorage['records'] = [];
      global.__wxStorage['cases'] = [];

      expect(() => app.onLaunch()).not.toThrow();
    });

    test('处理异常数据类型', () => {
      global.__wxStorage['medicines'] = 'string data';
      global.__wxStorage['records'] = 12345;
      global.__wxStorage['cases'] = { nested: { data: true } };

      expect(() => app.onLaunch()).not.toThrow();
    });
  });
});
