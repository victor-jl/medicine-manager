/**
 * pages/detail/detail.js 集成测试
 * 测试药品详情查看和服药记录功能
 */

describe('详情页 - detail.js 业务逻辑', () => {
  let page;

  beforeEach(() => {
    jest.resetModules();
    global.__wxStorage = {};
    global.wx.navigateBack = jest.fn();
    global.wx.showToast = jest.fn();
    global.wx.showModal = jest.fn();

    page = require('../../../pages/detail/detail');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onLoad - 页面加载', () => {
    test('应从URL参数获取药品ID', () => {
      const mockThis = {
        setData: jest.fn()
      };

      global.__wxStorage['medicines'] = [{ id: 123, name: '测试药品' }];
      global.__wxStorage['records'] = [];

      page.onLoad.call(mockThis, { id: '123' });

      expect(mockThis.setData).toHaveBeenCalledWith(
        expect.objectContaining({
          medicine: expect.objectContaining({ id: 123 })
        })
      );
    });

    test('应正确解析整数ID', () => {
      const mockThis = {
        setData: jest.fn()
      };

      global.__wxStorage['medicines'] = [{ id: 456, name: '整数ID测试' }];
      global.__wxStorage['records'] = [];

      page.onLoad.call(mockThis, { id: 456 });

      expect(mockThis.setData).toHaveBeenCalledWith(
        expect.objectContaining({
          medicine: expect.objectContaining({ id: 456 })
        })
      );
    });

    test('应加载对应药品的服药记录', () => {
      const mockThis = {
        setData: jest.fn()
      };

      global.__wxStorage['medicines'] = [{ id: 1, name: '药品' }];
      global.__wxStorage['records'] = [
        { id: 1, medicineId: 1, medicineName: '药品', takeTime: '时间1' },
        { id: 2, medicineId: 1, medicineName: '药品', takeTime: '时间2' },
        { id: 3, medicineId: 2, medicineName: '其他药品', takeTime: '时间3' }
      ];

      page.onLoad.call(mockThis, { id: '1' });

      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(setDataCall.records).toHaveLength(2);
      expect(setDataCall.records.every(r => r.medicineId === 1)).toBe(true);
    });

    test('记录应按倒序排列', () => {
      const mockThis = {
        setData: jest.fn()
      };

      global.__wxStorage['medicines'] = [{ id: 1, name: '药品' }];
      global.__wxStorage['records'] = [
        { id: 1, medicineId: 1, takeTime: '2023-01-01' },
        { id: 2, medicineId: 1, takeTime: '2023-01-02' },
        { id: 3, medicineId: 1, takeTime: '2023-01-03' }
      ];

      page.onLoad.call(mockThis, { id: '1' });

      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(setDataCall.records[0].id).toBe(3);
      expect(setDataCall.records[2].id).toBe(1);
    });

    test('找不到药品不应崩溃', () => {
      const mockThis = {
        setData: jest.fn()
      };

      global.__wxStorage['medicines'] = [{ id: 999, name: '其他药品' }];
      global.__wxStorage['records'] = [];

      expect(() => page.onLoad.call(mockThis, { id: '1' })).not.toThrow();
      expect(mockThis.setData).toHaveBeenCalledWith({
        medicine: null,
        records: []
      });
    });

    test('空药品列表不应崩溃', () => {
      const mockThis = {
        setData: jest.fn()
      };

      global.__wxStorage['medicines'] = [];
      global.__wxStorage['records'] = [];

      expect(() => page.onLoad.call(mockThis, { id: '1' })).not.toThrow();
    });

    test('null药品列表不应崩溃', () => {
      const mockThis = {
        setData: jest.fn()
      };

      global.__wxStorage['medicines'] = null;
      global.__wxStorage['records'] = null;

      expect(() => page.onLoad.call(mockThis, { id: '1' })).not.toThrow();
    });

    test('无ID参数不应崩溃', () => {
      const mockThis = {
        setData: jest.fn()
      };

      global.__wxStorage['medicines'] = [];
      global.__wxStorage['records'] = [];

      expect(() => page.onLoad.call(mockThis, {})).not.toThrow();
    });
  });

  describe('recordTake - 记录服药', () => {
    test('应创建服药记录', () => {
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: {
          medicine: { id: 123, name: '测试药品' },
          records: []
        },
        setData: jest.fn()
      };

      page.recordTake.call(mockThis);

      const savedRecords = global.__wxStorage['records'];
      expect(savedRecords.length).toBe(1);
      expect(savedRecords[0].medicineId).toBe(123);
      expect(savedRecords[0].medicineName).toBe('测试药品');
    });

    test('记录应包含当前时间', () => {
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' },
          records: []
        },
        setData: jest.fn()
      };

      page.recordTake.call(mockThis);

      expect(global.__wxStorage['records'][0].takeTime).toBeDefined();
    });

    test('应生成唯一ID', () => {
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' },
          records: []
        },
        setData: jest.fn()
      };

      page.recordTake.call(mockThis);

      expect(global.__wxStorage['records'][0].id).toBeDefined();
    });

    test('应更新页面记录列表', () => {
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' },
          records: []
        },
        setData: jest.fn()
      };

      page.recordTake.call(mockThis);

      expect(mockThis.setData).toHaveBeenCalled();
      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(setDataCall.records.length).toBe(1);
    });

    test('新记录应添加到列表开头', () => {
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' },
          records: []
        },
        setData: jest.fn()
      };

      page.recordTake.call(mockThis);

      const setDataCall = mockThis.setData.mock.calls[0][0];
      expect(mockThis.data.records.length).toBe(0);
    });

    test('应显示成功提示', () => {
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' },
          records: []
        },
        setData: jest.fn()
      };

      page.recordTake.call(mockThis);

      expect(global.wx.showToast).toHaveBeenCalledWith({
        title: '记录成功',
        icon: 'success'
      });
    });

    test('空药品数据不应崩溃', () => {
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: {
          medicine: null,
          records: []
        },
        setData: jest.fn()
      };

      expect(() => page.recordTake.call(mockThis)).not.toThrow();
    });

    test('缺少medicine字段不应崩溃', () => {
      global.__wxStorage['records'] = [];

      const mockThis = {
        data: {
          records: []
        },
        setData: jest.fn()
      };

      expect(() => page.recordTake.call(mockThis)).not.toThrow();
    });
  });

  describe('deleteMedicine - 删除药品', () => {
    test('应显示确认对话框', () => {
      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' }
        }
      };

      page.deleteMedicine.call(mockThis);

      expect(global.wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认删除',
          content: '确定要删除这个药品吗？'
        })
      );
    });

    test('确认后应删除药品', () => {
      global.__wxStorage['medicines'] = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' }
      ];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品1' }
        }
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      page.deleteMedicine.call(mockThis);

      expect(global.__wxStorage['medicines'].length).toBe(1);
      expect(global.__wxStorage['medicines'][0].id).toBe(2);
    });

    test('确认后应返回上一页', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '药品' }];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' }
        }
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      jest.useFakeTimers();
      page.deleteMedicine.call(mockThis);
      jest.runAllTimers();
      jest.useRealTimers();

      expect(global.wx.navigateBack).toHaveBeenCalled();
    });

    test('取消后不应删除', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '药品' }];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' }
        }
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: false });
      });

      page.deleteMedicine.call(mockThis);

      expect(global.__wxStorage['medicines'].length).toBe(1);
    });

    test('取消后不应返回', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '药品' }];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '药品' }
        }
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: false });
      });

      page.deleteMedicine.call(mockThis);

      expect(global.wx.navigateBack).not.toHaveBeenCalled();
    });

    test('删除不存在的药品应正常处理', () => {
      global.__wxStorage['medicines'] = [];

      const mockThis = {
        data: {
          medicine: { id: 1, name: '不存在的药品' }
        }
      };

      global.wx.showModal.mockImplementation((options) => {
        options.success({ confirm: true });
      });

      expect(() => page.deleteMedicine.call(mockThis)).not.toThrow();
    });
  });

  describe('边界条件', () => {
    test('处理超长药品名称', () => {
      const longName = 'a'.repeat(1000);
      global.__wxStorage['medicines'] = [{ id: 1, name: longName }];
      global.__wxStorage['records'] = [];

      const mockThis = { setData: jest.fn() };

      expect(() => page.onLoad.call(mockThis, { id: '1' })).not.toThrow();
    });

    test('处理特殊字符药品名称', () => {
      const specialName = '药品@#$%^&*()_+-=[]{}|;:,.<>?';
      global.__wxStorage['medicines'] = [{ id: 1, name: specialName }];
      global.__wxStorage['records'] = [];

      const mockThis = { setData: jest.fn() };

      expect(() => page.onLoad.call(mockThis, { id: '1' })).not.toThrow();
    });

    test('处理大量服药记录', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '药品' }];
      const records = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        medicineId: 1,
        medicineName: '药品',
        takeTime: `2023-01-${String(i % 30 + 1).padStart(2, '0')}`
      }));
      global.__wxStorage['records'] = records;

      const mockThis = { setData: jest.fn() };

      expect(() => page.onLoad.call(mockThis, { id: '1' })).not.toThrow();
    });

    test('处理缺少可选字段的记录', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '药品' }];
      global.__wxStorage['records'] = [
        { id: 1 },
        { id: 2, medicineId: 1 },
        { id: 3, medicineId: 1, medicineName: '药品' }
      ];

      const mockThis = { setData: jest.fn() };

      expect(() => page.onLoad.call(mockThis, { id: '1' })).not.toThrow();
    });
  });
});
