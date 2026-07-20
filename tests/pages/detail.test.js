let basePageConfig;

beforeAll(() => {
  jest.isolateModules(() => {
    require('../../pages/detail/detail');
    basePageConfig = global.__testHelpers.getLastPageConfig();
  });
});

function getPage() {
  return global.__testHelpers.createPageInstance(basePageConfig);
}

describe('pages/detail/detail', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('onLoad 应加载指定药品及其服药记录', () => {
    const page = getPage();
    wx.setStorageSync('medicines', [
      { id: 1, name: '药品A' },
      { id: 2, name: '药品B' }
    ]);
    wx.setStorageSync('records', [
      { id: 10, medicineId: 2, medicineName: '药品B', takeTime: '2026/7/20 08:00' },
      { id: 11, medicineId: 1, medicineName: '药品A', takeTime: '2026/7/20 09:00' }
    ]);

    page.onLoad({ id: '2' });

    expect(page.setData).toHaveBeenCalledWith({
      medicine: { id: 2, name: '药品B' },
      records: [{ id: 10, medicineId: 2, medicineName: '药品B', takeTime: '2026/7/20 08:00' }]
    });
  });

  it('药品不存在时不应设置数据', () => {
    const page = getPage();
    wx.setStorageSync('medicines', [{ id: 1, name: '药品A' }]);
    page.setData = jest.fn();
    page.onLoad({ id: '999' });
    expect(page.setData).not.toHaveBeenCalled();
  });

  it('recordTake 应添加服药记录并更新页面', () => {
    const page = getPage();
    page.setData({ medicine: { id: 3, name: '药品C' }, records: [] });

    page.recordTake();

    const records = wx.getStorageSync('records');
    expect(records).toHaveLength(1);
    expect(records[0].medicineId).toBe(3);
    expect(records[0].medicineName).toBe('药品C');
  });

  it('deleteMedicine 应删除当前药品并返回', () => {
    const page = getPage();
    wx.setStorageSync('medicines', [
      { id: 1, name: '药品A' },
      { id: 2, name: '药品B' }
    ]);
    page.setData({ medicine: { id: 1, name: '药品A' } });

    page.deleteMedicine();

    const medicines = wx.getStorageSync('medicines');
    expect(medicines).toHaveLength(1);
    expect(medicines[0].id).toBe(2);
    expect(wx.showToast).toHaveBeenCalledWith({ title: '删除成功', icon: 'success' });
  });
});
