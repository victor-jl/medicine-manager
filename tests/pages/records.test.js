let basePageConfig;

beforeAll(() => {
  jest.isolateModules(() => {
    require('../../pages/records/records');
    basePageConfig = global.__testHelpers.getLastPageConfig();
  });
});

function getPage() {
  return global.__testHelpers.createPageInstance(basePageConfig);
}

describe('pages/records/records', () => {
  it('switchTab 应更新 currentTab', () => {
    const page = getPage();
    page.setData({ currentTab: 'medicines' });
    page.switchTab({ currentTarget: { dataset: { tab: 'records' } } });
    expect(page.data.currentTab).toBe('records');
  });

  it('loadData 应将列表按倒序展示', () => {
    const page = getPage();
    wx.setStorageSync('medicines', [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
    wx.setStorageSync('records', [{ id: 1 }, { id: 2 }]);
    wx.setStorageSync('cases', [{ id: 1 }, { id: 2 }]);

    page.loadData();

    const data = page.setData.mock.calls[page.setData.mock.calls.length - 1][0];
    expect(data.medicines[0].id).toBe(2);
    expect(data.records[0].id).toBe(2);
    expect(data.cases[0].id).toBe(2);
  });

  it('addCase 在输入内容后应添加病例', () => {
    const page = getPage();
    wx.showModal = jest.fn((options) => {
      if (options.success) options.success({ confirm: true, content: '新病例' });
    });

    page.addCase();

    const cases = wx.getStorageSync('cases');
    expect(cases).toHaveLength(1);
    expect(cases[0].content).toBe('新病例');
  });

  it('addCase 在用户取消时不应添加病例', () => {
    const page = getPage();
    wx.showModal = jest.fn((options) => {
      if (options.success) options.success({ confirm: false, content: '新病例' });
    });

    page.addCase();

    expect(wx.getStorageSync('cases')).toHaveLength(0);
  });

  it('deleteMedicine 应删除指定药品并重载数据', () => {
    const page = getPage();
    page.loadData = jest.fn();
    wx.setStorageSync('medicines', [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);

    page.deleteMedicine({ currentTarget: { dataset: { id: 1 } } });

    const medicines = wx.getStorageSync('medicines');
    expect(medicines).toHaveLength(1);
    expect(medicines[0].id).toBe(2);
    expect(page.loadData).toHaveBeenCalled();
  });

  it('deleteRecord 应删除指定记录', () => {
    const page = getPage();
    page.loadData = jest.fn();
    wx.setStorageSync('records', [{ id: 1 }, { id: 2 }]);

    page.deleteRecord({ currentTarget: { dataset: { id: 2 } } });

    const records = wx.getStorageSync('records');
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(1);
  });

  it('recordTake 应为指定药品生成服药记录', () => {
    const page = getPage();
    page.setData({ medicines: [{ id: 5, name: '药品E' }] });
    page.loadData = jest.fn();

    page.recordTake({ currentTarget: { dataset: { id: 5 } } });

    const records = wx.getStorageSync('records');
    expect(records).toHaveLength(1);
    expect(records[0].medicineId).toBe(5);
    expect(records[0].medicineName).toBe('药品E');
  });

  it('goToDetail 应携带 id 导航到详情页', () => {
    const page = getPage();
    page.goToDetail({ currentTarget: { dataset: { id: 9 } } });
    expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/detail/detail?id=9' });
  });
});
