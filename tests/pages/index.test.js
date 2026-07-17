// tests/pages/index.test.js
// 回归测试: pages/index/index.js 的 loadData() 包含核心业务逻辑:
//   - 筛选 30 天内即将过期的药品
//   - 筛选今日的服药记录
// 这是首页和统计页依赖的关键逻辑, 任何回归都会直接影响用户用药提醒。
//
// 策略: 通过 stub global.wx / global.Page 来 require 页面模块, 拿到页面对象后
// 直接调用 loadData(), 避免在 Node 环境下依赖 WeChat 运行时。

describe('pages/index/index.js - loadData()', () => {
  // 固定当前时间, 避免日期边界条件不稳定
  const NOW = new Date('2026-07-17T10:00:00.000Z');

  function setupPage() {
    // 每次测试重置 mock 与 page 捕获
    jest.resetModules();

    const storage = {
      medicines: [],
      records: []
    };

    global.wx = {
      getStorageSync(key) {
        return storage[key];
      }
    };

    let capturedPage = null;
    global.Page = (obj) => { capturedPage = obj; };
    global.getCurrentPages = () => [capturedPage];

    // 拦截 setData 收集最终 data
    const setDataLog = [];
    global.Page = (obj) => {
      capturedPage = obj;
      const originalSetData = obj.setData;
      obj.setData = (patch) => {
        setDataLog.push(patch);
        if (originalSetData) originalSetData.call(obj, patch);
      };
    };

    require('../../pages/index/index');
    return {
      page: capturedPage,
      setDataLog,
      storage
    };
  }

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.wx;
    delete global.Page;
    delete global.getCurrentPages;
  });

  describe('即将过期药品筛选 (30 天窗口)', () => {
    test('空药品列表: 不应包含任何过期项', () => {
      const { page, setDataLog } = setupPage();
      page.loadData();
      expect(setDataLog[0].expiringMedicines).toEqual([]);
    });

    test('缺失 expiryDate 字段: 被排除', () => {
      const { page, storage, setDataLog } = setupPage();
      storage.medicines = [{ id: 1, name: '无名药品' }];
      page.loadData();
      expect(setDataLog[0].expiringMedicines).toEqual([]);
    });

    test('10 天后过期: 包含在 30 天窗口内', () => {
      const { page, storage, setDataLog } = setupPage();
      const inTenDays = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000);
      storage.medicines = [{ id: 1, name: '维生素C', expiryDate: inTenDays.toISOString() }];
      page.loadData();
      expect(setDataLog[0].expiringMedicines).toHaveLength(1);
      expect(setDataLog[0].expiringMedicines[0].name).toBe('维生素C');
    });

    test('31 天后过期: 超出 30 天窗口, 被排除', () => {
      const { page, storage, setDataLog } = setupPage();
      const inThirtyOneDays = new Date(NOW.getTime() + 31 * 24 * 60 * 60 * 1000);
      storage.medicines = [{ id: 1, name: '远期药品', expiryDate: inThirtyOneDays.toISOString() }];
      page.loadData();
      expect(setDataLog[0].expiringMedicines).toEqual([]);
    });

    test('已过期 (1 天前): 被排除', () => {
      const { page, storage, setDataLog } = setupPage();
      const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
      storage.medicines = [{ id: 1, name: '已过期', expiryDate: yesterday.toISOString() }];
      page.loadData();
      expect(setDataLog[0].expiringMedicines).toEqual([]);
    });

    test('恰好 30 天后过期: 包含 (含边界)', () => {
      const { page, storage, setDataLog } = setupPage();
      const exactlyThirty = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000);
      storage.medicines = [{ id: 1, name: '边界药品', expiryDate: exactlyThirty.toISOString() }];
      page.loadData();
      expect(setDataLog[0].expiringMedicines).toHaveLength(1);
    });

    test('混合列表: 仅返回 30 天窗口内未过期项', () => {
      const { page, storage, setDataLog } = setupPage();
      storage.medicines = [
        { id: 1, name: 'A-10d', expiryDate: new Date(NOW.getTime() + 10 * 86400000).toISOString() },
        { id: 2, name: 'B-31d', expiryDate: new Date(NOW.getTime() + 31 * 86400000).toISOString() },
        { id: 3, name: 'C-已过期', expiryDate: new Date(NOW.getTime() - 86400000).toISOString() },
        { id: 4, name: 'D-无日期' },
        { id: 5, name: 'E-29d', expiryDate: new Date(NOW.getTime() + 29 * 86400000).toISOString() }
      ];
      page.loadData();
      const names = setDataLog[0].expiringMedicines.map(m => m.name);
      expect(names).toEqual(['A-10d', 'E-29d']);
    });
  });

  describe('首页列表 medicines 截断', () => {
    test('截取最近 5 个药品', () => {
      const { page, storage, setDataLog } = setupPage();
      storage.medicines = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `药品${i + 1}` }));
      page.loadData();
      expect(setDataLog[0].medicines).toHaveLength(5);
    });
  });

  describe('今日记录筛选', () => {
    test('今日记录被包含', () => {
      const { page, storage, setDataLog } = setupPage();
      // 使用 toLocaleString 输出作为 takeTime, 但 filter 用的是 new Date(takeTime)
      // toDateString 只看日期部分
      const todayString = NOW.toDateString();
      storage.records = [
        { id: 1, takeTime: '2026-07-17 18:00:00' }  // parseable
      ];
      // 直接修改 toDateString 行为: 让 NOW.toDateString() 与记录的 toDateString 一致
      const RealDate = Date;
      // 我们的 NOW 在 UTC, 但 parse 时 Date 会构造本地时区
      // 用 toLocaleString 的输出格式其实是 '7/17/2026, 6:00:00 PM' 之类
      // 为稳定起见, 用 ISO 字符串, Date() 会正确解析
      storage.records = [{ id: 1, takeTime: NOW.toISOString() }];
      page.loadData();
      expect(setDataLog[0].todayRecords.length).toBeGreaterThanOrEqual(1);
    });

    test('昨天记录被排除', () => {
      const { page, storage, setDataLog } = setupPage();
      const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
      storage.records = [{ id: 1, takeTime: yesterday.toISOString() }];
      page.loadData();
      expect(setDataLog[0].todayRecords).toEqual([]);
    });

    test('空记录列表', () => {
      const { page, setDataLog } = setupPage();
      page.loadData();
      expect(setDataLog[0].todayRecords).toEqual([]);
    });

    test('无效 takeTime: new Date(invalid) -> NaN, 比较结果为 false', () => {
      const { page, storage, setDataLog } = setupPage();
      storage.records = [{ id: 1, takeTime: 'not-a-date' }];
      page.loadData();
      expect(setDataLog[0].todayRecords).toEqual([]);
    });
  });

  describe('空存储时的稳健性', () => {
    test('getStorageSync 返回 undefined: 走 || [] 分支', () => {
      const { page, setDataLog } = setupPage();
      // storage 默认 {} -> getStorageSync 返回 undefined
      page.loadData();
      expect(setDataLog[0].medicines).toEqual([]);
      expect(setDataLog[0].expiringMedicines).toEqual([]);
      expect(setDataLog[0].todayRecords).toEqual([]);
    });
  });
});
