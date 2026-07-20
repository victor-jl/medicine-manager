let basePageConfig;

beforeAll(() => {
  jest.isolateModules(() => {
    require('../../pages/index/index');
    basePageConfig = global.__testHelpers.getLastPageConfig();
  });
});

function getPage() {
  return global.__testHelpers.createPageInstance(basePageConfig);
}

describe('pages/index/index', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-20T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('onShow 应触发 loadData', () => {
    const page = getPage();
    page.loadData = jest.fn();
    page.onShow();
    expect(page.loadData).toHaveBeenCalled();
  });

  it('loadData 应过滤出30天内即将过期药品', () => {
    const page = getPage();
    wx.setStorageSync('medicines', [
      { id: 1, name: '即将过期', expiryDate: '2026-08-10' },
      { id: 2, name: '已过期', expiryDate: '2026-07-19' },
      { id: 3, name: '远期', expiryDate: '2026-12-01' },
      { id: 4, name: '无有效期' }
    ]);

    page.loadData();

    const calls = page.setData.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const data = calls[calls.length - 1][0];
    expect(data.expiringMedicines).toHaveLength(1);
    expect(data.expiringMedicines[0].name).toBe('即将过期');
  });

  it('loadData 应匹配今日的服药记录', () => {
    const page = getPage();
    wx.setStorageSync('records', [
      { id: 1, medicineName: '今日记录', takeTime: '2026/7/20 08:00:00' },
      { id: 2, medicineName: '昨日记录', takeTime: '2026/7/19 08:00:00' }
    ]);

    page.loadData();

    const data = page.setData.mock.calls[page.setData.mock.calls.length - 1][0];
    expect(data.todayRecords).toHaveLength(1);
    expect(data.todayRecords[0].medicineName).toBe('今日记录');
  });

  it('loadData 应最多展示5条药品', () => {
    const page = getPage();
    const medicines = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `药品${i + 1}`
    }));
    wx.setStorageSync('medicines', medicines);

    page.loadData();

    const data = page.setData.mock.calls[page.setData.mock.calls.length - 1][0];
    expect(data.medicines).toHaveLength(5);
  });

  it('goToAdd 应导航到添加页', () => {
    const page = getPage();
    page.goToAdd();
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/add/add' });
  });

  it('goToDetail 应携带 id 参数导航', () => {
    const page = getPage();
    page.goToDetail({ currentTarget: { dataset: { id: 42 } } });
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/detail/detail?id=42' });
  });
});
