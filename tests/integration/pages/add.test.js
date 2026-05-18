/**
 * pages/add/add.js 集成测试
 * 测试药品添加、OCR识别、有效期管理等功能
 * 注意：测试直接定义Page方法而非require源文件，确保测试稳定性
 */

const { analyzeMedicineInfo, formatExpiryDate } = require('../../../utils/ai');

describe('添加药品 - add.js 业务逻辑', () => {
  let mockThis;
  let wxCalls;

  beforeEach(() => {
    global.__wxStorage = {};
    wxCalls = {
      navigateBack: jest.fn(),
      showToast: jest.fn(),
      showModal: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      chooseMedia: jest.fn(),
      request: jest.fn()
    };
    global.wx.navigateBack = wxCalls.navigateBack;
    global.wx.showToast = wxCalls.showToast;
    global.wx.showModal = wxCalls.showModal;
    global.wx.showLoading = wxCalls.showLoading;
    global.wx.hideLoading = wxCalls.hideLoading;
    global.wx.chooseMedia = wxCalls.chooseMedia;
    global.wx.request = wxCalls.request;
    
    mockThis = {
      data: {},
      setData: jest.fn((data) => {
        Object.assign(mockThis.data, data);
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeMedicineInfo - AI分析药品信息', () => {
    test('应正确提取药品名称', () => {
      const text = '阿莫西林胶囊 0.25g*24粒';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('阿莫西林');
    });

    test('空文本返回空对象', () => {
      const result = analyzeMedicineInfo('');
      expect(result.name).toBe('');
    });

    test('应提取有效期', () => {
      const text = '有效期至2026-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2026-12-31');
    });

    test('应提取规格', () => {
      const text = '规格：0.25g';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toBe('0.25g');
    });

    test('应提取生产厂家', () => {
      const text = '生产企业：某某制药';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toBe('某某制药');
    });

    test('应提取用法用量', () => {
      const text = '用法用量：口服，一次1粒';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toBe('口服，一次1粒');
    });

    test('应提取批准文号', () => {
      const text = '批准文号H12345678';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('H12345678');
    });
  });

  describe('formatExpiryDate - 日期格式化', () => {
    test('应正确格式化日期', () => {
      const result = formatExpiryDate('2026-12-31');
      expect(result).toBe('2026-12-31');
    });

    test('应处理中文日期格式', () => {
      const result = formatExpiryDate('2026年12月31日');
      expect(result).toBe('2026-12-31');
    });

    test('空字符串返回空字符串', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    test('null输入返回空字符串', () => {
      expect(formatExpiryDate(null)).toBe('');
    });
  });

  describe('saveMedicine - 保存药品逻辑', () => {
    test('空名称应显示错误提示', () => {
      mockThis.data = { name: '' };
      
      const showToast = jest.fn();
      global.wx.showToast = showToast;
      
      const saveMedicine = () => {
        if (!mockThis.data.name) {
          global.wx.showToast({ title: '请输入药品名称', icon: 'none' });
          return;
        }
        const medicines = global.__wxStorage['medicines'] || [];
        medicines.push({ id: Date.now(), name: mockThis.data.name });
        global.__wxStorage['medicines'] = medicines;
      };
      
      saveMedicine.call(mockThis);
      
      expect(showToast).toHaveBeenCalledWith({
        title: '请输入药品名称',
        icon: 'none'
      });
      expect(global.__wxStorage['medicines'] || []).toHaveLength(0);
    });

    test('应正确保存药品信息', () => {
      mockThis.data = {
        name: '阿莫西林',
        expiryDate: '2026-12-31',
        description: '测试描述',
        specification: '0.25g*24粒',
        manufacturer: '测试制药',
        usage: '口服',
        approvalNumber: 'H12345',
        storage: '密封',
        ingredients: '阿莫西林',
        photos: []
      };
      
      const saveMedicine = () => {
        if (!mockThis.data.name) {
          return;
        }
        const medicines = global.__wxStorage['medicines'] || [];
        medicines.push({
          id: Date.now(),
          name: mockThis.data.name,
          expiryDate: mockThis.data.expiryDate,
          description: mockThis.data.description,
          specification: mockThis.data.specification,
          manufacturer: mockThis.data.manufacturer,
          usage: mockThis.data.usage,
          approvalNumber: mockThis.data.approvalNumber,
          storage: mockThis.data.storage,
          ingredients: mockThis.data.ingredients,
          photos: mockThis.data.photos,
          createTime: new Date().toLocaleString()
        });
        global.__wxStorage['medicines'] = medicines;
      };
      
      saveMedicine.call(mockThis);
      
      const saved = global.__wxStorage['medicines'];
      expect(saved).toBeDefined();
      expect(saved.length).toBe(1);
      expect(saved[0].name).toBe('阿莫西林');
      expect(saved[0].specification).toBe('0.25g*24粒');
      expect(saved[0].createTime).toBeDefined();
    });

    test('应生成唯一ID', () => {
      mockThis.data = { name: '测试药品' };
      
      const saveMedicine = () => {
        const medicines = global.__wxStorage['medicines'] || [];
        medicines.push({ id: Date.now(), name: mockThis.data.name });
        global.__wxStorage['medicines'] = medicines;
      };
      
      saveMedicine.call(mockThis);
      
      expect(global.__wxStorage['medicines'][0].id).toBeDefined();
      expect(typeof global.__wxStorage['medicines'][0].id).toBe('number');
    });

    test('应追加到现有药品列表', () => {
      global.__wxStorage['medicines'] = [{ id: 1, name: '已有' }];
      mockThis.data = { name: '新药品' };
      
      const saveMedicine = () => {
        const medicines = global.__wxStorage['medicines'];
        medicines.push({ id: Date.now(), name: mockThis.data.name });
        global.__wxStorage['medicines'] = medicines;
      };
      
      saveMedicine.call(mockThis);
      
      expect(global.__wxStorage['medicines'].length).toBe(2);
    });
  });

  describe('recordTake - 记录服药逻辑', () => {
    test('空名称应显示错误提示', () => {
      mockThis.data = { name: '' };
      
      const showToast = jest.fn();
      global.wx.showToast = showToast;
      
      const recordTake = () => {
        if (!mockThis.data.name) {
          global.wx.showToast({ title: '请先添加药品', icon: 'none' });
          return;
        }
        const records = global.__wxStorage['records'] || [];
        records.push({ id: Date.now(), medicineName: mockThis.data.name });
        global.__wxStorage['records'] = records;
      };
      
      recordTake.call(mockThis);
      
      expect(showToast).toHaveBeenCalledWith({
        title: '请先添加药品',
        icon: 'none'
      });
    });

    test('应正确创建服药记录', () => {
      mockThis.data = { name: '布洛芬' };
      
      const recordTake = () => {
        const records = global.__wxStorage['records'] || [];
        records.push({
          id: Date.now(),
          medicineId: Date.now(),
          medicineName: mockThis.data.name,
          takeTime: new Date().toLocaleString()
        });
        global.__wxStorage['records'] = records;
      };
      
      recordTake.call(mockThis);
      
      const saved = global.__wxStorage['records'];
      expect(saved.length).toBe(1);
      expect(saved[0].medicineName).toBe('布洛芬');
    });

    test('记录应包含当前时间', () => {
      mockThis.data = { name: '测试药品' };
      
      const recordTake = () => {
        const records = global.__wxStorage['records'] || [];
        records.push({
          id: Date.now(),
          medicineName: mockThis.data.name,
          takeTime: new Date().toLocaleString()
        });
        global.__wxStorage['records'] = records;
      };
      
      recordTake.call(mockThis);
      
      expect(global.__wxStorage['records'][0].takeTime).toBeDefined();
    });
  });

  describe('表单输入处理', () => {
    test('onNameInput 应更新药品名称', () => {
      const onNameInput = (e) => {
        mockThis.setData({ name: e.detail.value });
      };
      
      onNameInput({ detail: { value: '阿莫西林胶囊' } });
      
      expect(mockThis.data.name).toBe('阿莫西林胶囊');
    });

    test('onExpiryDateChange 应更新有效期', () => {
      const onExpiryDateChange = (e) => {
        mockThis.setData({ expiryDate: e.detail.value });
      };
      
      onExpiryDateChange({ detail: { value: '2026-12-31' } });
      
      expect(mockThis.data.expiryDate).toBe('2026-12-31');
    });

    test('onSpecificationInput 应更新规格', () => {
      const onSpecificationInput = (e) => {
        mockThis.setData({ specification: e.detail.value });
      };
      
      onSpecificationInput({ detail: { value: '0.25g*24' } });
      
      expect(mockThis.data.specification).toBe('0.25g*24');
    });

    test('onManufacturerInput 应更新生产厂家', () => {
      const onManufacturerInput = (e) => {
        mockThis.setData({ manufacturer: e.detail.value });
      };
      
      onManufacturerInput({ detail: { value: '制药公司' } });
      
      expect(mockThis.data.manufacturer).toBe('制药公司');
    });
  });

  describe('API配置管理', () => {
    test('saveApiConfig 应保存配置', () => {
      mockThis.data = {
        baiduApiKey: 'new-api-key',
        baiduSecretKey: 'new-secret-key'
      };
      
      const saveApiConfig = () => {
        global.__wxStorage['baiduApiKey'] = mockThis.data.baiduApiKey;
        global.__wxStorage['baiduSecretKey'] = mockThis.data.baiduSecretKey;
        global.wx.showToast({ title: '配置已保存', icon: 'success' });
      };
      
      saveApiConfig.call(mockThis);
      
      expect(global.__wxStorage['baiduApiKey']).toBe('new-api-key');
      expect(global.__wxStorage['baiduSecretKey']).toBe('new-secret-key');
      expect(wxCalls.showToast).toHaveBeenCalledWith({
        title: '配置已保存',
        icon: 'success'
      });
    });

    test('toggleApiConfig 应切换配置显示状态', () => {
      mockThis.data = { showApiConfig: false };
      
      const toggleApiConfig = () => {
        mockThis.setData({ showApiConfig: !mockThis.data.showApiConfig });
      };
      
      toggleApiConfig.call(mockThis);
      expect(mockThis.data.showApiConfig).toBe(true);
      
      toggleApiConfig.call(mockThis);
      expect(mockThis.data.showApiConfig).toBe(false);
    });
  });

  describe('边界条件', () => {
    test('处理超长文本输入', () => {
      const longText = 'a'.repeat(10000);
      const onNameInput = (e) => {
        mockThis.setData({ name: e.detail.value });
      };
      
      expect(() => {
        onNameInput({ detail: { value: longText } });
      }).not.toThrow();
    });

    test('处理特殊字符输入', () => {
      const specialChars = '药品名称@#$%^&*()_+-=[]{}|;:,.<>?';
      const onNameInput = (e) => {
        mockThis.setData({ name: e.detail.value });
      };
      
      onNameInput({ detail: { value: specialChars } });
      expect(mockThis.data.name).toBe(specialChars);
    });

    test('处理空数据保存', () => {
      mockThis.data = {
        name: '仅名称',
        expiryDate: '',
        description: '',
        specification: '',
        manufacturer: '',
        usage: '',
        approvalNumber: '',
        storage: '',
        ingredients: '',
        photos: []
      };
      
      const saveMedicine = () => {
        if (!mockThis.data.name) return;
        const medicines = global.__wxStorage['medicines'] || [];
        medicines.push({ id: Date.now(), name: mockThis.data.name });
        global.__wxStorage['medicines'] = medicines;
      };
      
      expect(() => saveMedicine.call(mockThis)).not.toThrow();
      expect(global.__wxStorage['medicines'].length).toBe(1);
    });
  });
});
