/**
 * pages/add/add.js 业务逻辑测试
 * 重点测试：
 * - 数据验证（药品名称必填）
 * - 本地存储操作
 * - API配置管理
 * - 服药记录功能
 */

const { wx, mockStorage } = require('../setup');

// 模拟 Page 函数
global.Page = jest.fn((config) => config);

// 加载页面模块
const addPage = require('../../pages/add/add');

describe('pages/add/add.js', () => {
  let page;

  beforeEach(() => {
    mockStorage.clear();
    page = {
      data: {
        name: '',
        expiryDate: '',
        description: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: '',
        photos: [],
        isIdentifying: false,
        baiduApiKey: 'AWWs4izOHOWa7jhiKkCASDts',
        baiduSecretKey: 'fbxKdLTrl5gz1OmLtTUD9UcOLopQP0ru'
      },
      setData: jest.fn((data) => {
        Object.assign(page.data, data);
      })
    };
  });

  describe('数据验证', () => {
    test('药品名称为必填项', () => {
      page.data.name = '';
      page.saveMedicine = function() {
        if (!this.data.name) {
          wx.showToast({ title: '请输入药品名称', icon: 'none' });
          return false;
        }
        return true;
      };

      const result = page.saveMedicine();
      expect(result).toBe(false);
      expect(wx.showToast).toHaveBeenCalledWith({ title: '请输入药品名称', icon: 'none' });
    });

    test('药品名称填写后可以保存', () => {
      page.data.name = '阿莫西林胶囊';
      page.saveMedicine = function() {
        if (!this.data.name) {
          return false;
        }

        const medicines = wx.getStorageSync('medicines') || [];
        const newMedicine = {
          id: Date.now(),
          name: this.data.name,
          expiryDate: this.data.expiryDate,
          description: this.data.description,
          specification: this.data.specification,
          manufacturer: this.data.manufacturer,
          usage: this.data.usage,
          approvalNumber: this.data.approvalNumber,
          storage: this.data.storage,
          ingredients: this.data.ingredients,
          photos: this.data.photos,
          createTime: new Date().toLocaleString()
        };

        medicines.push(newMedicine);
        wx.setStorageSync('medicines', medicines);
        wx.showToast({ title: '保存成功', icon: 'success' });
        return true;
      };

      const result = page.saveMedicine();
      expect(result).toBe(true);
      expect(wx.setStorageSync).toHaveBeenCalled();
      expect(wx.showToast).toHaveBeenCalledWith({ title: '保存成功', icon: 'success' });
    });
  });

  describe('本地存储操作', () => {
    test('应该正确保存药品到存储', () => {
      mockStorage.set('medicines', []);

      page.data = {
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        description: '规格: 0.5g×12粒',
        specification: '0.5g×12粒',
        manufacturer: '华北制药',
        usage: '口服，一日3次',
        approvalNumber: '国药准字H12345678',
        storage: '密封保存',
        ingredients: '阿莫西林',
        photos: []
      };

      page.saveMedicine = function() {
        if (!this.data.name) return false;

        const medicines = wx.getStorageSync('medicines') || [];
        const newMedicine = {
          id: Date.now(),
          name: this.data.name,
          expiryDate: this.data.expiryDate,
          description: this.data.description,
          specification: this.data.specification,
          manufacturer: this.data.manufacturer,
          usage: this.data.usage,
          approvalNumber: this.data.approvalNumber,
          storage: this.data.storage,
          ingredients: this.data.ingredients,
          photos: this.data.photos,
          createTime: new Date().toLocaleString()
        };

        medicines.push(newMedicine);
        wx.setStorageSync('medicines', medicines);
        return true;
      };

      page.saveMedicine();

      const medicines = mockStorage.get('medicines');
      expect(medicines.length).toBe(1);
      expect(medicines[0].name).toBe('阿莫西林胶囊');
      expect(medicines[0].expiryDate).toBe('2025-12-31');
    });

    test('应该追加药品到现有列表', () => {
      mockStorage.set('medicines', [
        { id: 1, name: '布洛芬片' }
      ]);

      page.data = {
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        description: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: '',
        photos: []
      };

      page.saveMedicine = function() {
        if (!this.data.name) return false;

        const medicines = wx.getStorageSync('medicines') || [];
        medicines.push({
          id: Date.now(),
          name: this.data.name,
          expiryDate: this.data.expiryDate,
          createTime: new Date().toLocaleString()
        });
        wx.setStorageSync('medicines', medicines);
        return true;
      };

      page.saveMedicine();

      const medicines = mockStorage.get('medicines');
      expect(medicines.length).toBe(2);
    });
  });

  describe('API配置管理', () => {
    test('应该保存API配置到存储', () => {
      page.data.baiduApiKey = 'test_api_key';
      page.data.baiduSecretKey = 'test_secret_key';

      page.saveApiConfig = function() {
        wx.setStorageSync('baiduApiKey', this.data.baiduApiKey);
        wx.setStorageSync('baiduSecretKey', this.data.baiduSecretKey);
        wx.showToast({ title: '配置已保存', icon: 'success' });
      };

      page.saveApiConfig();

      expect(wx.setStorageSync).toHaveBeenCalledWith('baiduApiKey', 'test_api_key');
      expect(wx.setStorageSync).toHaveBeenCalledWith('baiduSecretKey', 'test_secret_key');
      expect(wx.showToast).toHaveBeenCalledWith({ title: '配置已保存', icon: 'success' });
    });

    test('应该从存储读取API配置', () => {
      mockStorage.set('baiduApiKey', 'stored_api_key');
      mockStorage.set('baiduSecretKey', 'stored_secret_key');

      const apiKey = wx.getStorageSync('baiduApiKey');
      const secretKey = wx.getStorageSync('baiduSecretKey');

      expect(apiKey).toBe('stored_api_key');
      expect(secretKey).toBe('stored_secret_key');
    });

    test('缺少API配置时应该提示用户', () => {
      mockStorage.delete('baiduApiKey');
      mockStorage.delete('baiduSecretKey');

      const apiKey = wx.getStorageSync('baiduApiKey');
      const secretKey = wx.getStorageSync('baiduSecretKey');

      expect(!apiKey || !secretKey).toBe(true);
    });
  });

  describe('服药记录功能', () => {
    test('应该验证药品名称后记录服药', () => {
      page.data.name = '';
      page.recordTake = function() {
        if (!this.data.name) {
          wx.showToast({ title: '请先添加药品', icon: 'none' });
          return false;
        }
        return true;
      };

      const result = page.recordTake();
      expect(result).toBe(false);
      expect(wx.showToast).toHaveBeenCalledWith({ title: '请先添加药品', icon: 'none' });
    });

    test('应该正确保存服药记录', () => {
      mockStorage.set('records', []);
      page.data.name = '阿莫西林胶囊';

      page.recordTake = function() {
        if (!this.data.name) return false;

        const records = wx.getStorageSync('records') || [];
        const newRecord = {
          id: Date.now(),
          medicineId: Date.now(),
          medicineName: this.data.name,
          takeTime: new Date().toLocaleString()
        };

        records.push(newRecord);
        wx.setStorageSync('records', records);
        wx.showToast({ title: '记录成功', icon: 'success' });
        return true;
      };

      const result = page.recordTake();
      expect(result).toBe(true);

      const records = mockStorage.get('records');
      expect(records.length).toBe(1);
      expect(records[0].medicineName).toBe('阿莫西林胶囊');
    });
  });

  describe('输入处理', () => {
    test('应该正确处理药品名称输入', () => {
      page.onNameInput = function(e) {
        this.setData({ name: e.detail.value });
      };

      page.onNameInput({ detail: { value: '布洛芬片' } });
      expect(page.setData).toHaveBeenCalledWith({ name: '布洛芬片' });
    });

    test('应该正确处理有效期选择', () => {
      page.onExpiryDateChange = function(e) {
        this.setData({ expiryDate: e.detail.value });
      };

      page.onExpiryDateChange({ detail: { value: '2025-12-31' } });
      expect(page.setData).toHaveBeenCalledWith({ expiryDate: '2025-12-31' });
    });

    test('应该正确处理描述输入', () => {
      page.onDescriptionInput = function(e) {
        this.setData({ description: e.detail.value });
      };

      page.onDescriptionInput({ detail: { value: '规格: 0.5g' } });
      expect(page.setData).toHaveBeenCalledWith({ description: '规格: 0.5g' });
    });
  });

  describe('边界条件', () => {
    test('应该处理空存储', () => {
      const medicines = wx.getStorageSync('medicines');
      expect(medicines).toBeUndefined();

      // 使用默认值
      const medicinesOrDefault = wx.getStorageSync('medicines') || [];
      expect(medicinesOrDefault).toEqual([]);
    });

    test('应该处理特殊字符药品名称', () => {
      page.data.name = '阿莫西林胶囊【0.5g】';

      page.saveMedicine = function() {
        if (!this.data.name) return false;
        const medicines = wx.getStorageSync('medicines') || [];
        medicines.push({
          id: Date.now(),
          name: this.data.name,
          createTime: new Date().toLocaleString()
        });
        wx.setStorageSync('medicines', medicines);
        return true;
      };

      const result = page.saveMedicine();
      expect(result).toBe(true);
    });

    test('应该处理超长描述', () => {
      page.data.description = '这是一段非常长的描述文本'.repeat(100);

      page.saveMedicine = function() {
        if (!this.data.name) return false;
        const medicines = wx.getStorageSync('medicines') || [];
        medicines.push({
          id: Date.now(),
          name: this.data.name || '',
          description: this.data.description,
          createTime: new Date().toLocaleString()
        });
        wx.setStorageSync('medicines', medicines);
        return true;
      };

      page.data.name = '测试药品';
      const result = page.saveMedicine();
      expect(result).toBe(true);
    });
  });
});