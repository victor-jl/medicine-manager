// tests/pages/detail.test.js
// pages/detail/detail.js 单元测试 - 详情页面模块

describe('pages/detail/detail.js - 详情页面模块', () => {
  let pageConfig = null;
  let pageInstance = null;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    pageConfig = null;
    pageInstance = null;

    global.Page = jest.fn((config) => {
      pageConfig = config;
      return config;
    });

    require('../../pages/detail/detail.js');

    pageInstance = pageConfig;

    pageInstance.setData = jest.fn((data) => {
      Object.assign(pageInstance.data, data);
    });

    Object.keys(pageConfig).forEach(key => {
      if (typeof pageConfig[key] === 'function' && key !== 'setData') {
        pageInstance[key] = pageConfig[key].bind(pageInstance);
      }
    });
  });

  describe('onLoad - 页面加载', () => {
    test('应加载指定ID的药品详情', () => {
      const mockMedicine = {
        id: 1,
        name: '阿莫西林',
        expiryDate: '2026-06-01'
      };
      const mockRecords = [
        { id: 1, medicineId: 1, medicineName: '阿莫西林' },
        { id: 2, medicineId: 1, medicineName: '阿莫西林' }
      ];

      wx.getStorageSync
        .mockReturnValueOnce([mockMedicine])
        .mockReturnValueOnce(mockRecords);

      pageInstance.onLoad({ id: '1' });

      expect(pageInstance.data.medicine).toEqual(mockMedicine);
      expect(pageInstance.data.records).toHaveLength(2);
    });

    test('药品不存在时不应设置数据', () => {
      wx.getStorageSync.mockReturnValue([]);

      pageInstance.onLoad({ id: '999' });

      expect(pageInstance.data.medicine).toBeNull();
    });

    test('应筛选该药品的服药记录', () => {
      const mockMedicines = [{ id: 1, name: '阿莫西林' }];
      const mockRecords = [
        { id: 1, medicineId: 1 },
        { id: 2, medicineId: 2 },
        { id: 3, medicineId: 1 }
      ];

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce(mockRecords);

      pageInstance.onLoad({ id: '1' });

      expect(pageInstance.data.records).toHaveLength(2);
      expect(pageInstance.data.records.every(r => r.medicineId === 1)).toBe(true);
    });

    test('记录应按倒序排列', () => {
      const mockMedicines = [{ id: 1, name: '阿莫西林' }];
      const mockRecords = [
        { id: 1, medicineId: 1, takeTime: '2024-01-01' },
        { id: 2, medicineId: 1, takeTime: '2024-01-02' },
        { id: 3, medicineId: 1, takeTime: '2024-01-03' }
      ];

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce(mockRecords);

      pageInstance.onLoad({ id: '1' });

      expect(pageInstance.data.records[0].id).toBe(3);
      expect(pageInstance.data.records[2].id).toBe(1);
    });
  });

  describe('recordTake - 记录服药', () => {
    test('应创建新的服药记录', () => {
      const mockMedicine = {
        id: 1,
        name: '阿莫西林'
      };
      const mockRecords = [];

      pageInstance.data.medicine = mockMedicine;
      pageInstance.data.records = mockRecords;

      pageInstance.recordTake();

      expect(wx.setStorageSync).toHaveBeenCalledWith('records', expect.any(Array));
    });

    test('记录后应显示成功提示', () => {
      pageInstance.data.medicine = { id: 1, name: '阿莫西林' };
      pageInstance.data.records = [];

      pageInstance.recordTake();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '记录成功',
        icon: 'success'
      });
    });
  });

  describe('deleteMedicine - 删除药品', () => {
    test('用户确认时应删除药品', () => {
      const mockMedicine = { id: 1, name: '阿莫西林' };
      const mockMedicines = [{ id: 1, name: '阿莫西林' }];

      wx.getStorageSync
        .mockReturnValueOnce(mockMedicines)
        .mockReturnValueOnce([]);

      pageInstance.data.medicine = mockMedicine;
      pageInstance.deleteMedicine();

      const modalCallback = wx.showModal.mock.calls[0][0].success;
      modalCallback({ confirm: true });

      const setDataCall = wx.setStorageSync.mock.calls[0];
      expect(setDataCall[0]).toBe('medicines');
      expect(setDataCall[1]).toEqual([]);
    });

    test('删除后应显示成功提示', () => {
      const mockMedicine = { id: 1, name: '阿莫西林' };
      wx.getStorageSync
        .mockReturnValueOnce([{ id: 1, name: '阿莫西林' }])
        .mockReturnValueOnce([]);

      pageInstance.data.medicine = mockMedicine;
      pageInstance.deleteMedicine();

      const modalCallback = wx.showModal.mock.calls[0][0].success;
      modalCallback({ confirm: true });

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '删除成功',
        icon: 'success'
      });
    });
  });
});
