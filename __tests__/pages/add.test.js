/**
 * pages/add/add.js 单元测试
 * 
 * 测试覆盖：
 * 1. 药品保存验证（必填字段检查）
 * 2. API 配置验证
 * 3. 服药记录创建
 * 4. 数据完整性验证
 */

// 模拟 Page 函数
global.Page = function(pageConfig) {
  global.__pageConfig__ = pageConfig;
};

// 模拟 AI 模块（不存在时创建空模块）
jest.mock('../utils/ai', () => ({
  analyzeMedicineInfo: jest.fn((text) => ({
    name: '测试药品',
    expiryDate: '2025-12-01',
    specification: '0.5g',
    manufacturer: '测试厂家',
    usage: '口服',
    approvalNumber: '国药准字H12345',
    storage: '常温',
    ingredients: '测试成分'
  })),
  formatExpiryDate: jest.fn((date) => date || '2025-12-01')
}), { virtual: true });

// 加载页面代码
require('../pages/add/add');

describe('add 页面', () => {
  let page;

  beforeEach(() => {
    global.__mockStorage__ = {};
    jest.clearAllMocks();
    
    // 创建页面实例
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
      ...global.__pageConfig__
    };
  });

  describe('saveMedicine - 药品保存验证', () => {
    test('无药品名称时应提示错误', () => {
      page.data.name = '';
      
      page.saveMedicine();
      
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请输入药品名称',
        icon: 'none'
      });
    });

    test('有药品名称时应成功保存', () => {
      page.data.name = '阿莫西林';
      page.data.expiryDate = '2025-12-01';
      
      global.__mockStorage__ = {
        medicines: []
      };

      page.saveMedicine();

      const savedMedicines = global.__mockStorage__['medicines'];
      expect(savedMedicines).toBeDefined();
      expect(savedMedicines.length).toBe(1);
      expect(savedMedicines[0].name).toBe('阿莫西林');
      expect(savedMedicines[0].expiryDate).toBe('2025-12-01');
    });

    test('保存时应生成唯一 ID', () => {
      page.data.name = '测试药品';
      
      global.__mockStorage__ = {
        medicines: []
      };

      page.saveMedicine();

      const savedMedicine = global.__mockStorage__['medicines'][0];
      expect(savedMedicine.id).toBeDefined();
      expect(typeof savedMedicine.id).toBe('number');
    });

    test('保存时应记录创建时间', () => {
      page.data.name = '测试药品';
      
      global.__mockStorage__ = {
        medicines: []
      };

      page.saveMedicine();

      const savedMedicine = global.__mockStorage__['medicines'][0];
      expect(savedMedicine.createTime).toBeDefined();
    });

    test('保存成功后应显示成功提示', () => {
      page.data.name = '测试药品';
      
      global.__mockStorage__ = {
        medicines: []
      };

      page.saveMedicine();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '保存成功',
        icon: 'success'
      });
    });

    test('保存成功后应延迟返回上一页', () => {
      page.data.name = '测试药品';
      
      global.__mockStorage__ = {
        medicines: []
      };

      page.saveMedicine();

      // setTimeout 应被调用（1500ms 后返回）
      expect(wx.navigateBack).not.toHaveBeenCalled(); // 立即检查，还未执行
    });

    test('保存时应包含所有字段', () => {
      page.data = {
        name: '完整药品',
        expiryDate: '2025-12-01',
        description: '测试描述',
        specification: '0.5g×12粒',
        manufacturer: '测试厂家',
        usage: '口服，一日三次',
        approvalNumber: '国药准字H12345678',
        storage: '密封，常温保存',
        ingredients: '阿莫西林',
        photos: ['photo1.jpg']
      };

      global.__mockStorage__ = {
        medicines: []
      };

      page.saveMedicine();

      const savedMedicine = global.__mockStorage__['medicines'][0];
      expect(savedMedicine.name).toBe('完整药品');
      expect(savedMedicine.expiryDate).toBe('2025-12-01');
      expect(savedMedicine.description).toBe('测试描述');
      expect(savedMedicine.specification).toBe('0.5g×12粒');
      expect(savedMedicine.manufacturer).toBe('测试厂家');
      expect(savedMedicine.usage).toBe('口服，一日三次');
      expect(savedMedicine.approvalNumber).toBe('国药准字H12345678');
      expect(savedMedicine.storage).toBe('密封，常温保存');
      expect(savedMedicine.ingredients).toBe('阿莫西林');
      expect(savedMedicine.photos).toEqual(['photo1.jpg']);
    });

    test('保存到已有列表时应追加而非覆盖', () => {
      page.data.name = '新药品';
      
      global.__mockStorage__ = {
        medicines: [
          { id: 1, name: '已有药品' }
        ]
      };

      page.saveMedicine();

      const savedMedicines = global.__mockStorage__['medicines'];
      expect(savedMedicines.length).toBe(2);
      expect(savedMedicines[0].name).toBe('已有药品');
      expect(savedMedicines[1].name).toBe('新药品');
    });
  });

  describe('recordTake - 服药记录', () => {
    test('无药品名称时应提示错误', () => {
      page.data.name = '';
      
      page.recordTake();
      
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '请先添加药品',
        icon: 'none'
      });
    });

    test('有药品名称时应成功记录', () => {
      page.data.name = '阿莫西林';
      
      global.__mockStorage__ = {
        records: []
      };

      page.recordTake();

      const savedRecords = global.__mockStorage__['records'];
      expect(savedRecords).toBeDefined();
      expect(savedRecords.length).toBe(1);
      expect(savedRecords[0].medicineName).toBe('阿莫西林');
    });

    test('记录时应生成唯一 ID', () => {
      page.data.name = '测试药品';
      
      global.__mockStorage__ = {
        records: []
      };

      page.recordTake();

      const savedRecord = global.__mockStorage__['records'][0];
      expect(savedRecord.id).toBeDefined();
      expect(typeof savedRecord.id).toBe('number');
    });

    test('记录时应包含服药时间', () => {
      page.data.name = '测试药品';
      
      global.__mockStorage__ = {
        records: []
      };

      page.recordTake();

      const savedRecord = global.__mockStorage__['records'][0];
      expect(savedRecord.takeTime).toBeDefined();
    });

    test('记录成功后应显示成功提示', () => {
      page.data.name = '测试药品';
      
      global.__mockStorage__ = {
        records: []
      };

      page.recordTake();

      expect(wx.showToast).toHaveBeenCalledWith({
        title: '记录成功',
        icon: 'success'
      });
    });
  });

  describe('API 配置管理', () => {
    test('onLoad 应保存默认 API 配置', () => {
      page.onLoad();

      expect(global.__mockStorage__['baiduApiKey']).toBe('AWWs4izOHOWa7jhiKkCASDts');
      expect(global.__mockStorage__['baiduSecretKey']).toBe('fbxKdLTrl5gz1OmLtTUD9UcOLopQP0ru');
    });

    test('saveApiConfig 应保存用户配置', () => {
      page.data.baiduApiKey = 'user_api_key';
      page.data.baiduSecretKey = 'user_secret_key';

      page.saveApiConfig();

      expect(global.__mockStorage__['baiduApiKey']).toBe('user_api_key');
      expect(global.__mockStorage__['baiduSecretKey']).toBe('user_secret_key');
      expect(wx.showToast).toHaveBeenCalledWith({
        title: '配置已保存',
        icon: 'success'
      });
    });

    test('onApiKeyInput 应更新 API Key', () => {
      const mockEvent = {
        detail: { value: 'new_api_key' }
      };

      page.onApiKeyInput(mockEvent);

      expect(page.data.baiduApiKey).toBe('new_api_key');
    });

    test('onSecretKeyInput 应更新 Secret Key', () => {
      const mockEvent = {
        detail: { value: 'new_secret_key' }
      };

      page.onSecretKeyInput(mockEvent);

      expect(page.data.baiduSecretKey).toBe('new_secret_key');
    });
  });

  describe('输入处理', () => {
    test('onNameInput 应更新药品名称', () => {
      const mockEvent = {
        detail: { value: '新药品名称' }
      };

      page.onNameInput(mockEvent);

      expect(page.data.name).toBe('新药品名称');
    });

    test('onExpiryDateChange 应更新有效期', () => {
      const mockEvent = {
        detail: { value: '2025-12-01' }
      };

      page.onExpiryDateChange(mockEvent);

      expect(page.data.expiryDate).toBe('2025-12-01');
    });

    test('onDescriptionInput 应更新描述', () => {
      const mockEvent = {
        detail: { value: '新描述内容' }
      };

      page.onDescriptionInput(mockEvent);

      expect(page.data.description).toBe('新描述内容');
    });

    test('各字段输入处理应正确更新对应字段', () => {
      const testCases = [
        { method: 'onSpecificationInput', field: 'specification', value: '0.5g' },
        { method: 'onManufacturerInput', field: 'manufacturer', value: '测试厂家' },
        { method: 'onUsageInput', field: 'usage', value: '口服' },
        { method: 'onApprovalNumberInput', field: 'approvalNumber', value: '国药准字H12345' },
        { method: 'onStorageInput', field: 'storage', value: '常温' },
        { method: 'onIngredientsInput', field: 'ingredients', value: '测试成分' }
      ];

      testCases.forEach(({ method, field, value }) => {
        const mockEvent = {
          detail: { value }
        };

        page[method](mockEvent);

        expect(page.data[field]).toBe(value);
      });
    });
  });

  describe('toggleApiConfig', () => {
    test('应切换 API 配置显示状态', () => {
      page.data.showApiConfig = false;
      
      page.toggleApiConfig();
      
      expect(page.data.showApiConfig).toBe(true);
      
      page.toggleApiConfig();
      
      expect(page.data.showApiConfig).toBe(false);
    });
  });

  describe('doIdentify - OCR 识别', () => {
    test('无 API 配置时应提示配置', async () => {
      global.__mockStorage__ = {};

      await page.doIdentify('/path/to/image.jpg');

      expect(wx.showModal).toHaveBeenCalled();
      expect(wx.showModal.mock.calls[0][0].title).toBe('需要配置API');
    });

    test('有 API 配置时应开始识别', async () => {
      global.__mockStorage__ = {
        baiduApiKey: 'test_key',
        baiduSecretKey: 'test_secret'
      };

      // Mock callBaiduOCR
      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth')) {
          options.success({
            data: {
              access_token: 'test_token'
            }
          });
        } else if (options.url.includes('ocr')) {
          options.success({
            data: {
              words_result: [
                { words: '阿莫西林胶囊' }
              ]
            }
          });
        }
      });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_data')
      });

      await page.doIdentify('/path/to/image.jpg');

      expect(page.data.isIdentifying).toBe(false);
    });

    test('识别过程应显示加载提示', async () => {
      global.__mockStorage__ = {
        baiduApiKey: 'test_key',
        baiduSecretKey: 'test_secret'
      };

      wx.request.mockImplementation((options) => {
        if (options.url.includes('oauth')) {
          options.success({
            data: {
              access_token: 'test_token'
            }
          });
        } else if (options.url.includes('ocr')) {
          options.success({
            data: {
              words_result: [{ words: 'test' }]
            }
          });
        }
      });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_data')
      });

      await page.doIdentify('/path/to/image.jpg');

      expect(wx.showLoading).toHaveBeenCalledWith({ title: '识别中...' });
      expect(wx.hideLoading).toHaveBeenCalled();
    });

    test('识别失败应显示错误提示', async () => {
      global.__mockStorage__ = {
        baiduApiKey: 'test_key',
        baiduSecretKey: 'test_secret'
      };

      wx.request.mockImplementation((options) => {
        options.fail(new Error('识别失败'));
      });

      wx.getFileSystemManager.mockReturnValue({
        readFileSync: jest.fn(() => 'base64_data')
      });

      await page.doIdentify('/path/to/image.jpg');

      expect(wx.showToast).toHaveBeenCalledWith({
        title: expect.stringContaining('识别失败'),
        icon: 'none'
      });
      expect(page.data.isIdentifying).toBe(false);
    });
  });
});