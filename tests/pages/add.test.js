jest.mock('../../utils/ai', () => ({
  analyzeMedicineInfo: jest.fn((text) => ({
    name: '识别药品',
    expiryDate: '2026-08-01',
    specification: '0.5g*24粒',
    manufacturer: '测试制药',
    usage: '每日两次',
    approvalNumber: '国药准字Z20260001',
    storage: '密封',
    ingredients: '测试成分'
  })),
  formatExpiryDate: jest.fn((date) => date || '')
}));

let basePageConfig;

beforeAll(() => {
  jest.isolateModules(() => {
    require('../../pages/add/add');
    basePageConfig = global.__testHelpers.getLastPageConfig();
  });
});

function getPage() {
  return global.__testHelpers.createPageInstance(basePageConfig);
}

describe('pages/add/add', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('onLoad 应写入默认百度 API 配置到本地存储', () => {
    const page = getPage();
    page.onLoad();
    expect(wx.setStorageSync).toHaveBeenCalledWith('baiduApiKey', 'AWWs4izOHOWa7jhiKkCASDts');
    expect(wx.setStorageSync).toHaveBeenCalledWith('baiduSecretKey', 'fbxKdLTrl5gz1OmLtTUD9UcOLopQP0ru');
  });

  it('saveApiConfig 应持久化当前 API 配置', () => {
    const page = getPage();
    page.setData({ baiduApiKey: 'newKey', baiduSecretKey: 'newSecret' });
    page.saveApiConfig();
    expect(wx.setStorageSync).toHaveBeenCalledWith('baiduApiKey', 'newKey');
    expect(wx.setStorageSync).toHaveBeenCalledWith('baiduSecretKey', 'newSecret');
    expect(wx.showToast).toHaveBeenCalledWith({ title: '配置已保存', icon: 'success' });
  });

  it('未输入药品名称时 saveMedicine 应阻止保存', () => {
    const page = getPage();
    page.setData({ name: '' });
    page.saveMedicine();
    expect(wx.showToast).toHaveBeenCalledWith({ title: '请输入药品名称', icon: 'none' });
    expect(wx.getStorageSync('medicines')).toHaveLength(0);
  });

  it('saveMedicine 应将药品写入本地存储并包含所有字段', () => {
    const page = getPage();
    page.setData({
      name: '测试药品',
      expiryDate: '2026-08-01',
      description: '备注',
      specification: '0.5g',
      manufacturer: '厂家',
      usage: '用法',
      approvalNumber: '准字',
      storage: '贮藏',
      ingredients: '成分',
      photos: ['path']
    });

    page.saveMedicine();

    const medicines = wx.getStorageSync('medicines');
    expect(medicines).toHaveLength(1);
    expect(medicines[0]).toMatchObject({
      name: '测试药品',
      expiryDate: '2026-08-01',
      specification: '0.5g',
      manufacturer: '厂家',
      usage: '用法',
      approvalNumber: '准字',
      storage: '贮藏',
      ingredients: '成分',
      photos: ['path']
    });
  });

  it('recordTake 在未输入药品名称时应阻止', () => {
    const page = getPage();
    page.setData({ name: '' });
    page.recordTake();
    expect(wx.showToast).toHaveBeenCalledWith({ title: '请先添加药品', icon: 'none' });
  });

  it('recordTake 应生成服药记录', () => {
    const page = getPage();
    page.setData({ name: '测试药品' });
    page.recordTake();

    const records = wx.getStorageSync('records');
    expect(records).toHaveLength(1);
    expect(records[0].medicineName).toBe('测试药品');
  });

  it('toggleApiConfig 应切换 showApiConfig 状态', () => {
    const page = getPage();
    page.setData({ showApiConfig: false });
    page.toggleApiConfig();
    expect(page.data.showApiConfig).toBe(true);
    page.toggleApiConfig();
    expect(page.data.showApiConfig).toBe(false);
  });

  it('doIdentify 在未配置 API 时应弹出提示并返回', async () => {
    const page = getPage();
    wx.setStorageSync('baiduApiKey', '');
    wx.setStorageSync('baiduSecretKey', '');

    await page.doIdentify('imagePath');

    expect(wx.showModal).toHaveBeenCalled();
    expect(wx.showLoading).not.toHaveBeenCalled();
  });
});
