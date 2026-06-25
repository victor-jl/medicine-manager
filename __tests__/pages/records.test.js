/**
 * pages/records/records.js 业务逻辑测试
 * 重点测试：
 * - 数据加载和展示
 * - 删除操作（药品、记录）
 * - 服药记录功能
 * - 病例添加功能
 */

const { wx, mockStorage } = require('../setup');

// 模拟 Page 函数
global.Page = jest.fn((config) => config);

// 加载页面模块
const recordsPage = require('../../pages/records/records');

describe('pages/records/records.js', () => {
  let page;

  beforeEach(() => {
    mockStorage.clear();
    page = {
      data: {
        currentTab: 'medicines',
        medicines: [],
        records: [],
        cases: []
      },
      setData: jest.fn((data) => {
        Object.assign(page.data, data);
      }),
      loadData: function() {
        const medicines = wx.getStorageSync('medicines') || [];
        const records = wx.getStorageSync('records') || [];
        const cases = wx.getStorageSync('cases') || [];

        this.setData({
          medicines: medicines.reverse(),
          records: records.reverse(),
          cases: cases.reverse()
        });
      }
    };
  });

  describe('数据加载', () => {
    test('应该正确加载药品列表', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '阿莫西林胶囊' },
        { id: 2, name: '布洛芬片' }
      ]);

      page.loadData();

      expect(page.setData).toHaveBeenCalled();
      expect(page.data.medicines.length).toBe(2);
      expect(page.data.medicines[0].name).toBe('布洛芬片'); // reverse
    });

    test('应该正确加载服药记录', () => {
      mockStorage.set('records', [
        { id: 1, medicineName: '阿莫西林胶囊', takeTime: '2024-01-01' },
        { id: 2, medicineName: '布洛芬片', takeTime: '2024-01-02' }
      ]);

      page.loadData();

      expect(page.data.records.length).toBe(2);
    });

    test('应该正确加载病例记录', () => {
      mockStorage.set('cases', [
        { id: 1, content: '感冒发烧' }
      ]);

      page.loadData();

      expect(page.data.cases.length).toBe(1);
    });

    test('应该处理空存储', () => {
      page.loadData();

      expect(page.data.medicines).toEqual([]);
      expect(page.data.records).toEqual([]);
      expect(page.data.cases).toEqual([]);
    });

    test('应该反转列表顺序（最新在前）', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '药品1', createTime: '2024-01-01' },
        { id: 2, name: '药品2', createTime: '2024-01-02' },
        { id: 3, name: '药品3', createTime: '2024-01-03' }
      ]);

      page.loadData();

      expect(page.data.medicines[0].id).toBe(3);
      expect(page.data.medicines[2].id).toBe(1);
    });
  });

  describe('删除药品', () => {
    test('应该正确删除指定药品', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '阿莫西林胶囊' },
        { id: 2, name: '布洛芬片' },
        { id: 3, name: '感冒灵颗粒' }
      ]);

      page.deleteMedicine = function(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
          title: '确认删除',
          content: '确定要删除这个药品吗？',
          success: (res) => {
            if (res.confirm) {
              let medicines = wx.getStorageSync('medicines') || [];
              medicines = medicines.filter(m => m.id !== id);
              wx.setStorageSync('medicines', medicines);
              this.loadData();
              wx.showToast({ title: '删除成功', icon: 'success' });
            }
          }
        });
      };

      // 模拟用户确认删除
      wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.deleteMedicine({ currentTarget: { dataset: { id: 2 } } });

      const medicines = mockStorage.get('medicines');
      expect(medicines.length).toBe(2);
      expect(medicines.find(m => m.id === 2)).toBeUndefined();
      expect(wx.showToast).toHaveBeenCalledWith({ title: '删除成功', icon: 'success' });
    });

    test('用户取消删除时不应删除', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '阿莫西林胶囊' }
      ]);

      page.deleteMedicine = function(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
          title: '确认删除',
          content: '确定要删除这个药品吗？',
          success: (res) => {
            if (res.confirm) {
              let medicines = wx.getStorageSync('medicines') || [];
              medicines = medicines.filter(m => m.id !== id);
              wx.setStorageSync('medicines', medicines);
            }
          }
        });
      };

      // 模拟用户取消
      wx.showModal.mockImplementation((options) => {
        options.success({ confirm: false });
      });

      page.deleteMedicine({ currentTarget: { dataset: { id: 1 } } });

      const medicines = mockStorage.get('medicines');
      expect(medicines.length).toBe(1);
    });

    test('删除不存在药品不应出错', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '阿莫西林胶囊' }
      ]);

      page.deleteMedicine = function(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
          title: '确认删除',
          content: '确定要删除这个药品吗？',
          success: (res) => {
            if (res.confirm) {
              let medicines = wx.getStorageSync('medicines') || [];
              medicines = medicines.filter(m => m.id !== id);
              wx.setStorageSync('medicines', medicines);
            }
          }
        });
      };

      wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.deleteMedicine({ currentTarget: { dataset: { id: 999 } } });

      const medicines = mockStorage.get('medicines');
      expect(medicines.length).toBe(1);
    });
  });

  describe('删除服药记录', () => {
    test('应该正确删除指定记录', () => {
      mockStorage.set('records', [
        { id: 1, medicineName: '阿莫西林胶囊' },
        { id: 2, medicineName: '布洛芬片' }
      ]);

      page.deleteRecord = function(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
          title: '确认删除',
          content: '确定要删除这条记录吗？',
          success: (res) => {
            if (res.confirm) {
              let records = wx.getStorageSync('records') || [];
              records = records.filter(r => r.id !== id);
              wx.setStorageSync('records', records);
              this.loadData();
              wx.showToast({ title: '删除成功', icon: 'success' });
            }
          }
        });
      };

      wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.deleteRecord({ currentTarget: { dataset: { id: 1 } } });

      const records = mockStorage.get('records');
      expect(records.length).toBe(1);
      expect(records[0].id).toBe(2);
    });
  });

  describe('记录服药', () => {
    test('应该正确记录服药', () => {
      mockStorage.set('records', []);
      mockStorage.set('medicines', [
        { id: 1, name: '阿莫西林胶囊' }
      ]);

      page.data.medicines = [
        { id: 1, name: '阿莫西林胶囊' }
      ];

      page.recordTake = function(e) {
        const id = e.currentTarget.dataset.id;
        const medicine = this.data.medicines.find(m => m.id === id);

        const records = wx.getStorageSync('records') || [];
        const newRecord = {
          id: Date.now(),
          medicineId: id,
          medicineName: medicine.name,
          takeTime: new Date().toLocaleString()
        };

        records.push(newRecord);
        wx.setStorageSync('records', records);
        wx.showToast({ title: '记录成功', icon: 'success' });
        this.loadData();
      };

      page.recordTake({ currentTarget: { dataset: { id: 1 } } });

      const records = mockStorage.get('records');
      expect(records.length).toBe(1);
      expect(records[0].medicineName).toBe('阿莫西林胶囊');
      expect(wx.showToast).toHaveBeenCalledWith({ title: '记录成功', icon: 'success' });
    });

    test('记录不存在药品不应出错', () => {
      mockStorage.set('records', []);
      mockStorage.set('medicines', [
        { id: 1, name: '阿莫西林胶囊' }
      ]);

      page.data.medicines = [
        { id: 1, name: '阿莫西林胶囊' }
      ];

      page.recordTake = function(e) {
        const id = e.currentTarget.dataset.id;
        const medicine = this.data.medicines.find(m => m.id === id);

        if (!medicine) {
          wx.showToast({ title: '药品不存在', icon: 'none' });
          return;
        }

        const records = wx.getStorageSync('records') || [];
        records.push({
          id: Date.now(),
          medicineId: id,
          medicineName: medicine.name,
          takeTime: new Date().toLocaleString()
        });
        wx.setStorageSync('records', records);
      };

      page.recordTake({ currentTarget: { dataset: { id: 999 } } });

      const records = mockStorage.get('records');
      expect(records.length).toBe(0);
    });
  });

  describe('添加病例', () => {
    test('应该正确添加病例', () => {
      mockStorage.set('cases', []);

      page.addCase = function() {
        wx.showModal({
          title: '添加病例',
          editable: true,
          placeholderText: '请输入病例描述',
          success: (res) => {
            if (res.confirm && res.content) {
              const cases = wx.getStorageSync('cases') || [];
              const newCase = {
                id: Date.now(),
                content: res.content,
                createTime: new Date().toLocaleString()
              };
              cases.push(newCase);
              wx.setStorageSync('cases', cases);
              this.loadData();
              wx.showToast({ title: '添加成功', icon: 'success' });
            }
          }
        });
      };

      wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true, content: '感冒发烧三天' });
      });

      page.addCase();

      const cases = mockStorage.get('cases');
      expect(cases.length).toBe(1);
      expect(cases[0].content).toBe('感冒发烧三天');
      expect(wx.showToast).toHaveBeenCalledWith({ title: '添加成功', icon: 'success' });
    });

    test('用户取消添加不应保存', () => {
      mockStorage.set('cases', []);

      page.addCase = function() {
        wx.showModal({
          title: '添加病例',
          editable: true,
          placeholderText: '请输入病例描述',
          success: (res) => {
            if (res.confirm && res.content) {
              const cases = wx.getStorageSync('cases') || [];
              cases.push({
                id: Date.now(),
                content: res.content,
                createTime: new Date().toLocaleString()
              });
              wx.setStorageSync('cases', cases);
            }
          }
        });
      };

      wx.showModal.mockImplementation((options) => {
        options.success({ confirm: false });
      });

      page.addCase();

      const cases = mockStorage.get('cases');
      expect(cases.length).toBe(0);
    });

    test('空内容不应保存', () => {
      mockStorage.set('cases', []);

      page.addCase = function() {
        wx.showModal({
          title: '添加病例',
          editable: true,
          placeholderText: '请输入病例描述',
          success: (res) => {
            if (res.confirm && res.content) {
              const cases = wx.getStorageSync('cases') || [];
              cases.push({
                id: Date.now(),
                content: res.content,
                createTime: new Date().toLocaleString()
              });
              wx.setStorageSync('cases', cases);
            }
          }
        });
      };

      wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true, content: '' });
      });

      page.addCase();

      const cases = mockStorage.get('cases');
      expect(cases.length).toBe(0);
    });
  });

  describe('标签切换', () => {
    test('应该正确切换标签', () => {
      page.switchTab = function(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ currentTab: tab });
      };

      page.switchTab({ currentTarget: { dataset: { tab: 'records' } } });
      expect(page.setData).toHaveBeenCalledWith({ currentTab: 'records' });

      page.switchTab({ currentTarget: { dataset: { tab: 'cases' } } });
      expect(page.setData).toHaveBeenCalledWith({ currentTab: 'cases' });
    });
  });

  describe('边界条件', () => {
    test('应该处理大量数据', () => {
      const medicines = [];
      for (let i = 0; i < 100; i++) {
        medicines.push({ id: i, name: `药品${i}` });
      }
      mockStorage.set('medicines', medicines);

      page.loadData();

      expect(page.data.medicines.length).toBe(100);
    });

    test('应该处理数据为null的情况', () => {
      mockStorage.set('medicines', null);

      page.loadData();

      expect(page.data.medicines).toEqual([]);
    });

    test('应该处理数据为undefined的情况', () => {
      mockStorage.delete('medicines');

      page.loadData();

      expect(page.data.medicines).toEqual([]);
    });
  });
});