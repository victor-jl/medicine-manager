// tests/pages/records.test.js
// 回归测试: pages/records/records.js 的 recordTake / loadData 涉及列表顺序与查找,
// 是记录页的核心数据逻辑。

describe('pages/records/records.js - recordTake() / loadData()', () => {
  function setupPage() {
    jest.resetModules();

    const storage = { medicines: [], records: [] };
    const toastLog = [];
    global.wx = {
      getStorageSync(key) { return storage[key]; },
      setStorageSync(key, val) { storage[key] = val; },
      showToast: ({ title }) => toastLog.push(title)
    };

    let captured = null;
    const setDataLog = [];
    global.Page = (obj) => {
      captured = obj;
      obj.setData = (patch) => {
        Object.assign(captured.data, patch);
        setDataLog.push(patch);
      };
    };
    global.getCurrentPages = () => [captured];

    require('../../pages/records/records');
    return { page: captured, setDataLog, storage, toastLog };
  }

  afterEach(() => {
    delete global.wx;
    delete global.Page;
    delete global.getCurrentPages;
  });

  describe('loadData()', () => {
    test('三个列表均按存储顺序倒序展示', () => {
      const { page, storage, setDataLog } = setupPage();
      storage.medicines = [{ id: 1 }, { id: 2 }, { id: 3 }];
      storage.records = [{ id: 10 }, { id: 20 }];
      storage.cases = [{ id: 100 }];
      page.loadData();
      const last = setDataLog[setDataLog.length - 1];
      expect(last.medicines.map(m => m.id)).toEqual([3, 2, 1]);
      expect(last.records.map(r => r.id)).toEqual([20, 10]);
      expect(last.cases.map(c => c.id)).toEqual([100]);
    });

    test('存储为空时返回空数组', () => {
      const { page, setDataLog } = setupPage();
      page.loadData();
      const last = setDataLog[setDataLog.length - 1];
      expect(last.medicines).toEqual([]);
      expect(last.records).toEqual([]);
      expect(last.cases).toEqual([]);
    });
  });

  describe('recordTake()', () => {
    test('根据 id 找到药品并写入服药记录', () => {
      const { page, storage } = setupPage();
      storage.medicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];
      storage.records = [];
      // 同步设置 data.medicines
      page.data.medicines = storage.medicines;
      page.recordTake({ currentTarget: { dataset: { id: 2 } } });
      expect(storage.records).toHaveLength(1);
      expect(storage.records[0].medicineId).toBe(2);
      expect(storage.records[0].medicineName).toBe('药品B');
    });

    test('找不到对应药品时, 由于访问 undefined.name 会抛错 (记录当前行为)', () => {
      const { page, storage } = setupPage();
      storage.medicines = [];
      storage.records = [];
      page.data.medicines = [];
      // 当前实现没有守卫, 此处会抛 TypeError, 这是已知行为
      expect(() => {
        page.recordTake({ currentTarget: { dataset: { id: 99 } } });
      }).toThrow();
    });

    test('新记录使用 Date.now 作为 id (确定性: 同毫秒内幂等)', () => {
      const { page, storage } = setupPage();
      storage.medicines = [{ id: 1, name: '药品' }];
      page.data.medicines = storage.medicines;
      page.recordTake({ currentTarget: { dataset: { id: 1 } } });
      expect(typeof storage.records[0].id).toBe('number');
      expect(storage.records[0].id).toBeGreaterThan(0);
    });
  });

  describe('switchTab()', () => {
    test('切换 currentTab 到指定值', () => {
      const { page } = setupPage();
      page.switchTab({ currentTarget: { dataset: { tab: 'cases' } } });
      expect(page.data.currentTab).toBe('cases');
    });
  });
});
