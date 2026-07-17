// tests/pages/detail.test.js
// 回归测试: pages/detail/detail.js 的 onLoad 负责根据 id 查找药品和对应记录,
// 是详情页的核心数据加载逻辑。Bug 修复时极易改动此处的过滤与排序。

describe('pages/detail/detail.js - onLoad()', () => {
  function setupPage() {
    jest.resetModules();

    const storage = { medicines: [], records: [] };
    global.wx = {
      getStorageSync(key) { return storage[key]; }
    };

    let captured = null;
    const setDataLog = [];
    global.Page = (obj) => {
      captured = obj;
      obj.setData = (patch) => setDataLog.push(patch);
    };
    global.getCurrentPages = () => [captured];

    require('../../pages/detail/detail');
    return { page: captured, setDataLog, storage };
  }

  afterEach(() => {
    delete global.wx;
    delete global.Page;
    delete global.getCurrentPages;
  });

  test('按 id 找到药品并加载', () => {
    const { page, storage, setDataLog } = setupPage();
    storage.medicines = [
      { id: 1, name: '药品A' },
      { id: 2, name: '药品B' }
    ];
    page.onLoad({ id: '1' });
    expect(setDataLog).toHaveLength(1);
    expect(setDataLog[0].medicine.name).toBe('药品A');
  });

  test('parseInt 兼容数字和字符串 id', () => {
    const { page, storage, setDataLog } = setupPage();
    storage.medicines = [{ id: 42, name: 'X' }];
    page.onLoad({ id: 42 });
    expect(setDataLog[0].medicine.name).toBe('X');
  });

  test('找不到药品时, 不调用 setData', () => {
    const { page, storage, setDataLog } = setupPage();
    storage.medicines = [{ id: 1, name: 'A' }];
    page.onLoad({ id: 999 });
    expect(setDataLog).toHaveLength(0);
  });

  test('id 为 NaN (options.id 缺失): find 永远不命中', () => {
    const { page, storage, setDataLog } = setupPage();
    storage.medicines = [{ id: 1, name: 'A' }];
    page.onLoad({});
    expect(setDataLog).toHaveLength(0);
  });

  test('仅返回该药品的服药记录, 且按时间倒序', () => {
    const { page, storage, setDataLog } = setupPage();
    storage.medicines = [{ id: 7, name: '药品' }];
    storage.records = [
      { id: 1, medicineId: 7, takeTime: '2026-07-15' },
      { id: 2, medicineId: 8, takeTime: '2026-07-16' },
      { id: 3, medicineId: 7, takeTime: '2026-07-17' },
      { id: 4, medicineId: 9, takeTime: '2026-07-18' }
    ];
    page.onLoad({ id: '7' });
    const records = setDataLog[0].records;
    // 仅 1, 3 属于药品 7, 倒序后是 [3, 1]
    expect(records.map(r => r.id)).toEqual([3, 1]);
  });

  test('无对应记录时, records 为空数组', () => {
    const { page, storage, setDataLog } = setupPage();
    storage.medicines = [{ id: 1, name: 'A' }];
    page.onLoad({ id: '1' });
    expect(setDataLog[0].records).toEqual([]);
  });

  test('存储为空时不崩溃', () => {
    const { page, setDataLog } = setupPage();
    expect(() => page.onLoad({ id: '1' })).not.toThrow();
    expect(setDataLog).toHaveLength(0);
  });
});
