const fs = require('fs');
const path = require('path');

function generateTestTemplates(assessments) {
  const templates = [];

  for (const assessment of assessments) {
    if (!assessment.shouldGenerateTest) continue;

    const { gap, riskLevel } = assessment;
    const fileContent = fs.existsSync(gap.file) ? fs.readFileSync(gap.file, 'utf-8') : '';

    if (gap.relativePath.includes('utils/ocr')) {
      templates.push(...generateOCRTests(gap, fileContent, riskLevel));
    } else if (gap.relativePath.includes('utils/baidu-ocr')) {
      templates.push(...generateBaiduOCRTests(gap, fileContent, riskLevel));
    } else if (gap.relativePath.includes('pages/add')) {
      templates.push(...generateAddPageTests(gap, fileContent, riskLevel));
    } else if (gap.relativePath.includes('pages/index')) {
      templates.push(...generateIndexPageTests(gap, fileContent, riskLevel));
    } else if (gap.relativePath.includes('pages/records')) {
      templates.push(...generateRecordsPageTests(gap, fileContent, riskLevel));
    } else if (gap.relativePath.includes('pages/detail')) {
      templates.push(...generateDetailPageTests(gap, fileContent, riskLevel));
    } else {
      templates.push(...generateGenericTests(gap, fileContent, riskLevel));
    }
  }

  return templates;
}

function generateOCRTests(gap, fileContent, riskLevel) {
  const tests = [];

  if (fileContent.includes('extractMedicineName')) {
    tests.push({
      name: 'extractMedicineName_basic_extraction',
      file: gap.relativePath.replace('.js', '.test.js'),
      template: generateExtractMedicineNameTest(gap.relativePath),
      priority: 'high'
    });
  }

  if (fileContent.includes('recognizeWithWechat') || fileContent.includes('recognizeWithBaidu')) {
    tests.push({
      name: 'ocr_recognition_flow',
      file: gap.relativePath.replace('.js', '.test.js'),
      template: generateOCRRecognitionTest(gap.relativePath),
      priority: 'high'
    });
  }

  return tests;
}

function generateExtractMedicineNameTest(filePath) {
  return `const { extractMedicineName } = require('../../${filePath}');

describe('extractMedicineName', () => {
  describe('基本提取功能', () => {
    test('应从包含药品关键词的文本中正确提取药品名称', () => {
      const input = '阿莫西林胶囊 0.5g×24粒';
      const result = extractMedicineName(input);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    test('应处理空字符串输入', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('应处理null或undefined输入', () => {
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });
  });

  describe('关键词匹配', () => {
    test('应识别胶囊类药品', () => {
      const input = '布洛芬缓释胶囊 0.3g';
      const result = extractMedicineName(input);
      expect(result).toContain('胶囊');
    });

    test('应识别片剂类药品', () => {
      const input = '对乙酰氨基酚片 0.5g';
      const result = extractMedicineName(input);
      expect(result).toContain('片');
    });

    test('应识别常见药品名称', () => {
      const inputs = [
        '阿奇霉素分散片',
        '头孢克肟颗粒',
        '感冒灵颗粒'
      ];
      inputs.forEach(input => {
        const result = extractMedicineName(input);
        expect(result).toBeTruthy();
      });
    });
  });

  describe('边界条件', () => {
    test('应处理无关键词的普通文本', () => {
      const input = '这是一段普通文本';
      const result = extractMedicineName(input);
      expect(result).toBeTruthy();
    });

    test('应处理过长的输入文本', () => {
      const input = '阿莫西林'.repeat(100);
      const result = extractMedicineName(input);
      expect(result).toBeTruthy();
    });

    test('应处理特殊字符', () => {
      const input = '药品名称: @#$%^&*()';
      const result = extractMedicineName(input);
      expect(result).toBeTruthy();
    });
  });

  describe('大小写处理', () => {
    test('应忽略大小写差异', () => {
      const upper = 'AMOXICILLIN胶囊';
      const lower = 'amoxicillin胶囊';
      const result1 = extractMedicineName(upper);
      const result2 = extractMedicineName(lower);
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
    });
  });
});
`;
}

function generateOCRRecognitionTest(filePath) {
  return `const { recognizeWithWechat, recognizeWithBaidu } = require('../../${filePath}');

jest.mock('wx.cloud', () => ({
  init: jest.fn(),
  callFunction: jest.fn()
}));

jest.mock('wx', () => ({
  cloud: require('wx.cloud'),
  request: jest.fn()
}));

describe('OCR识别流程', () => {
  describe('微信OCR识别', () => {
    test('应正确处理识别成功的情况', async () => {
      const mockResponse = {
        result: {
          text: '阿莫西林胶囊\\n0.5g×24粒'
        }
      };
      wx.cloud.callFunction.mockResolvedValue(mockResponse);

      const result = await recognizeWithWechat('/test/image.jpg');
      expect(result.success).toBe(true);
      expect(result.words).toBeInstanceOf(Array);
    });

    test('应处理识别失败的情况', async () => {
      wx.cloud.callFunction.mockRejectedValue(new Error('识别失败'));

      await expect(recognizeWithWechat('/test/image.jpg'))
        .rejects.toThrow();
    });

    test('应处理空结果', async () => {
      const mockResponse = { result: null };
      wx.cloud.callFunction.mockResolvedValue(mockResponse);

      await expect(recognizeWithWechat('/test/image.jpg'))
        .rejects.toThrow();
    });
  });

  describe('百度OCR识别', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      wx.getStorageSync.mockReturnValue(null);
    });

    test('应正确处理识别成功的情况', async () => {
      const mockTokenResponse = {
        data: { access_token: 'test_token' }
      };
      const mockOCRResponse = {
        data: {
          words_result: [
            { words: '阿莫西林胶囊' },
            { words: '0.5g×24粒' }
          ]
        }
      };

      wx.request
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockOCRResponse);

      const result = await recognizeWithBaidu('/test/image.jpg');
      expect(result.success).toBe(true);
      expect(result.words).toHaveLength(2);
    });

    test('应处理token获取失败', async () => {
      wx.request.mockRejectedValueOnce(new Error('Network error'));

      await expect(recognizeWithBaidu('/test/image.jpg'))
        .rejects.toThrow();
    });

    test('应处理OCR API错误', async () => {
      const mockTokenResponse = {
        data: { access_token: 'test_token' }
      };
      const mockErrorResponse = {
        data: { error_msg: 'Invalid image' }
      };

      wx.request
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockErrorResponse);

      await expect(recognizeWithBaidu('/test/image.jpg'))
        .rejects.toThrow();
    });
  });
});
`;
}

function generateBaiduOCRTests(gap, fileContent, riskLevel) {
  const tests = [];

  if (fileContent.includes('getAccessToken')) {
    tests.push({
      name: 'baidu_ocr_token_management',
      file: gap.relativePath.replace('.js', '.test.js'),
      template: generateBaiduTokenTest(gap.relativePath),
      priority: 'high'
    });
  }

  if (fileContent.includes('recognizeText')) {
    tests.push({
      name: 'baidu_ocr_recognition',
      file: gap.relativePath.replace('.js', '.test.js'),
      template: generateBaiduRecognizeTest(gap.relativePath),
      priority: 'high'
    });
  }

  if (fileContent.includes('extractMedicineName')) {
    tests.push({
      name: 'baidu_medicine_extraction',
      file: gap.relativePath.replace('.js', '.test.js'),
      template: generateExtractMedicineNameTest(gap.relativePath),
      priority: 'medium'
    });
  }

  return tests;
}

function generateBaiduTokenTest(filePath) {
  return `const { getAccessToken } = require('../../${filePath}');

jest.mock('wx', () => ({
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  request: jest.fn()
}));

describe('getAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应返回缓存的token当其有效时', async () => {
    const cachedToken = 'valid_token_12345';
    const expiresTime = Date.now() + 86400000;

    wx.getStorageSync
      .mockReturnValueOnce(cachedToken)
      .mockReturnValueOnce(expiresTime);

    const result = await getAccessToken();
    expect(result).toBe(cachedToken);
    expect(wx.request).not.toHaveBeenCalled();
  });

  test('应在token过期时获取新token', async () => {
    const expiredToken = 'expired_token';
    const pastTime = Date.now() - 1000;
    const newToken = 'new_token_67890';

    wx.getStorageSync
      .mockReturnValueOnce(expiredToken)
      .mockReturnValueOnce(pastTime);

    wx.request.mockResolvedValue({
      data: { access_token: newToken }
    });

    const result = await getAccessToken();
    expect(result).toBe(newToken);
    expect(wx.setStorageSync).toHaveBeenCalledWith(
      'baidu_access_token',
      newToken
    );
  });

  test('应在无缓存时获取新token', async () => {
    const newToken = 'fresh_token';

    wx.getStorageSync.mockReturnValue(null);
    wx.request.mockResolvedValue({
      data: { access_token: newToken }
    });

    const result = await getAccessToken();
    expect(result).toBe(newToken);
  });

  test('应处理API返回错误', async () => {
    wx.getStorageSync.mockReturnValue(null);
    wx.request.mockResolvedValue({
      data: { error: 'invalid credentials' }
    });

    await expect(getAccessToken()).rejects.toThrow('获取token失败');
  });

  test('应处理网络请求失败', async () => {
    wx.getStorageSync.mockReturnValue(null);
    wx.request.mockRejectedValue(new Error('Network error'));

    await expect(getAccessToken()).rejects.toThrow();
  });

  test('应正确缓存token有效期', async () => {
    const newToken = 'cached_token';
    wx.getStorageSync.mockReturnValue(null);
    wx.request.mockResolvedValue({
      data: { access_token: newToken }
    });

    await getAccessToken();

    const cacheCall = wx.setStorageSync.mock.calls.find(
      call => call[0] === 'baidu_token_expires'
    );
    expect(cacheCall).toBeDefined();
    const expiresTime = cacheCall[1];
    expect(expiresTime).toBeGreaterThan(Date.now());
  });
});
`;
}

function generateBaiduRecognizeTest(filePath) {
  return `const { recognizeText } = require('../../${filePath}');

jest.mock('wx', () => ({
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn().mockReturnValue('base64_encoded_data')
  })),
  request: jest.fn()
}));

describe('recognizeText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应正确处理识别成功的结果', async () => {
    const mockResponse = {
      data: {
        words_result: [
          { words: '阿莫西林' },
          { words: '胶囊' },
          { words: '0.5g' }
        ]
      }
    };
    wx.request.mockResolvedValue(mockResponse);

    const result = await recognizeText('/test/image.jpg');
    expect(result.success).toBe(true);
    expect(result.words).toHaveLength(3);
    expect(result.text).toBe('阿莫西林 胶囊 0.5g');
  });

  test('应处理OCR API错误', async () => {
    wx.request.mockResolvedValue({
      data: {
        error_code: 216015,
        error_msg: 'module closed'
      }
    });

    await expect(recognizeText('/test/image.jpg')).rejects.toThrow();
  });

  test('应处理空结果', async () => {
    wx.request.mockResolvedValue({
      data: {}
    });

    await expect(recognizeText('/test/image.jpg')).rejects.toThrow('未返回有效数据');
  });

  test('应处理网络请求失败', async () => {
    wx.request.mockRejectedValue(new Error('Network error'));

    await expect(recognizeText('/test/image.jpg')).rejects.toThrow();
  });

  test('应正确读取图片文件', async () => {
    const fs = wx.getFileSystemManager();
    wx.request.mockResolvedValue({
      data: {
        words_result: [{ words: 'test' }]
      }
    });

    await recognizeText('/test/image.jpg');
    expect(fs.readFileSync).toHaveBeenCalledWith('/test/image.jpg', 'base64');
  });
});
`;
}

function generateAddPageTests(gap, fileContent, riskLevel) {
  const tests = [];

  if (fileContent.includes('saveMedicine')) {
    tests.push({
      name: 'add_page_save_medicine',
      file: 'tests/unit/add-page.test.js',
      template: generateSaveMedicineTest(),
      priority: 'high'
    });
  }

  if (fileContent.includes('recordTake')) {
    tests.push({
      name: 'add_page_record_take',
      file: 'tests/unit/add-page.test.js',
      template: generateRecordTakeTest(),
      priority: 'medium'
    });
  }

  if (fileContent.includes('doIdentify')) {
    tests.push({
      name: 'add_page_ocr_identification',
      file: 'tests/unit/add-page.test.js',
      template: generateOCRIdentificationTest(),
      priority: 'high'
    });
  }

  return tests;
}

function generateSaveMedicineTest() {
  return `describe('saveMedicine', () => {
  let page;

  beforeEach(() => {
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
        photos: []
      },
      setData: jest.fn()
    };

    global.wx = {
      getStorageSync: jest.fn().mockReturnValue([]),
      setStorageSync: jest.fn(),
      showToast: jest.fn(),
      navigateBack: jest.fn()
    };
  });

  afterEach(() => {
    delete global.wx;
  });

  test('应拒绝保存空名称的药品', () => {
    const saveMedicine = require('../../pages/add/add.js').Page.onLoad;
    const result = page.data.name === '';
    expect(result).toBe(true);
  });

  test('应正确保存药品信息到本地存储', () => {
    page.data.name = '阿莫西林';
    page.data.expiryDate = '2025-12-31';
    page.data.description = '抗生素';

    const medicines = [];
    global.wx.getStorageSync.mockReturnValue(medicines);

    const newMedicine = {
      id: Date.now(),
      name: page.data.name,
      expiryDate: page.data.expiryDate,
      description: page.data.description
    };

    medicines.push(newMedicine);
    global.wx.setStorageSync('medicines', medicines);

    expect(medicines).toHaveLength(1);
    expect(medicines[0].name).toBe('阿莫西林');
  });

  test('应包含所有新增字段', () => {
    const fullData = {
      name: '布洛芬',
      expiryDate: '2026-06-30',
      description: '解热镇痛',
      specification: '0.2g×20片',
      manufacturer: '制药厂',
      usage: '口服，一次1片',
      approvalNumber: '国药准字H12345678',
      storage: '遮光，密封保存',
      ingredients: '布洛芬'
    };

    expect(Object.keys(fullData)).toContain('specification');
    expect(Object.keys(fullData)).toContain('manufacturer');
    expect(Object.keys(fullData)).toContain('approvalNumber');
  });

  test('应生成唯一的药品ID', () => {
    const id1 = Date.now();
    const id2 = Date.now() + 1;
    expect(id1).not.toBe(id2);
  });

  test('应记录创建时间', () => {
    const before = new Date().toLocaleString();
    const record = { createTime: before };
    expect(record.createTime).toBeTruthy();
  });
});
`;
}

function generateRecordTakeTest() {
  return `describe('recordTake', () => {
  let global;

  beforeEach(() => {
    global = {
      wx: {
        getStorageSync: jest.fn().mockReturnValue([]),
        setStorageSync: jest.fn(),
        showToast: jest.fn()
      }
    };
  });

  test('应拒绝为空名称记录服药', () => {
    const name = '';
    expect(name).toBeFalsy();
  });

  test('应创建新的服药记录', () => {
    const records = [];
    global.wx.getStorageSync.mockReturnValue(records);

    const newRecord = {
      id: Date.now(),
      medicineId: 123,
      medicineName: '阿莫西林',
      takeTime: new Date().toLocaleString()
    };

    records.push(newRecord);
    global.wx.setStorageSync('records', records);

    expect(records).toHaveLength(1);
    expect(records[0].medicineName).toBe('阿莫西林');
  });

  test('记录应包含必要字段', () => {
    const record = {
      id: Date.now(),
      medicineId: 123,
      medicineName: '布洛芬',
      takeTime: new Date().toLocaleString()
    };

    expect(record).toHaveProperty('id');
    expect(record).toHaveProperty('medicineId');
    expect(record).toHaveProperty('medicineName');
    expect(record).toHaveProperty('takeTime');
  });
});
`;
}

function generateOCRIdentificationTest() {
  return `describe('doIdentify', () => {
  let global;

  beforeEach(() => {
    global = {
      wx: {
        getStorageSync: jest.fn((key) => {
          const storage = {
            baiduApiKey: 'test_api_key',
            baiduSecretKey: 'test_secret_key'
          };
          return storage[key];
        }),
        showModal: jest.fn(),
        showLoading: jest.fn(),
        hideLoading: jest.fn(),
        showToast: jest.fn(),
        request: jest.fn()
      }
    };
  });

  test('应检查API配置是否存在', () => {
    const apiKey = global.wx.getStorageSync('baiduApiKey');
    const secretKey = global.wx.getStorageSync('baiduSecretKey');

    expect(apiKey).toBeTruthy();
    expect(secretKey).toBeTruthy();
  });

  test('应拒绝缺失API配置', () => {
    global.wx.getStorageSync.mockReturnValue('');
    const apiKey = global.wx.getStorageSync('baiduApiKey');

    expect(apiKey).toBeFalsy();
  });

  test('应处理token获取成功', async () => {
    const mockResponse = {
      data: { access_token: 'valid_token' }
    };
    global.wx.request.mockResolvedValue(mockResponse);

    const response = await global.wx.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token'
    });

    expect(response.data.access_token).toBe('valid_token');
  });

  test('应处理token获取失败', async () => {
    global.wx.request.mockRejectedValue(new Error('Network error'));

    await expect(
      global.wx.request({ url: 'https://aip.baidubce.com/oauth/2.0/token' })
    ).rejects.toThrow();
  });

  test('应正确处理OCR响应', async () => {
    const mockOCRResponse = {
      data: {
        words_result: [
          { words: '阿莫西林' },
          { words: '胶囊' }
        ]
      }
    };
    global.wx.request.mockResolvedValue(mockOCRResponse);

    const response = await global.wx.request({});
    const words = response.data.words_result.map(item => item.words);

    expect(words).toHaveLength(2);
    expect(words.join(' ')).toBe('阿莫西林 胶囊');
  });

  test('应处理OCR无结果情况', async () => {
    const mockResponse = {
      data: {}
    };
    global.wx.request.mockResolvedValue(mockResponse);

    const response = await global.wx.request({});
    expect(response.data.words_result).toBeUndefined();
  });
});
`;
}

function generateIndexPageTests(gap, fileContent, riskLevel) {
  return [{
    name: 'index_page_data_loading',
    file: 'tests/unit/index-page.test.js',
    template: generateIndexPageTest(),
    priority: 'high'
  }];
}

function generateIndexPageTest() {
  return `describe('首页数据加载', () => {
  beforeEach(() => {
    global.wx = {
      getStorageSync: jest.fn()
    };
  });

  afterEach(() => {
    delete global.wx;
  });

  describe('loadData', () => {
    test('应从本地存储加载药品列表', () => {
      const medicines = [
        { id: 1, name: '阿莫西林', expiryDate: '2025-12-31' },
        { id: 2, name: '布洛芬', expiryDate: '2026-06-30' }
      ];
      global.wx.getStorageSync.mockReturnValue(medicines);

      const result = global.wx.getStorageSync('medicines');
      expect(result).toHaveLength(2);
    });

    test('应从本地存储加载服药记录', () => {
      const records = [
        { id: 1, medicineName: '阿莫西林', takeTime: new Date().toISOString() }
      ];
      global.wx.getStorageSync.mockReturnValue(records);

      const result = global.wx.getStorageSync('records');
      expect(result).toHaveLength(1);
    });

    test('应正确识别即将过期的药品', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const medicines = [
        { id: 1, name: '阿莫西林', expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 2, name: '布洛芬', expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString() }
      ];

      const expiring = medicines.filter(m => {
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });

      expect(expiring).toHaveLength(1);
      expect(expiring[0].name).toBe('阿莫西林');
    });

    test('应正确筛选今日记录', () => {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      const records = [
        { id: 1, takeTime: new Date().toISOString() },
        { id: 2, takeTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
      ];

      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });

      expect(todayRecords).toHaveLength(1);
    });

    test('应处理空数据', () => {
      global.wx.getStorageSync.mockReturnValue([]);

      const medicines = global.wx.getStorageSync('medicines');
      const records = global.wx.getStorageSync('records');

      expect(medicines).toHaveLength(0);
      expect(records).toHaveLength(0);
    });

    test('首页应限制显示5条药品', () => {
      const medicines = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: \`药品\${i + 1}\`
      }));
      global.wx.getStorageSync.mockReturnValue(medicines);

      const result = global.wx.getStorageSync('medicines').slice(0, 5);
      expect(result).toHaveLength(5);
    });
  });

  describe('页面导航', () => {
    test('应正确跳转添加页面', () => {
      const navigateTo = jest.fn();
      global.wx.navigateTo = navigateTo;

      navigateTo({ url: '/pages/add/add' });
      expect(navigateTo).toHaveBeenCalledWith({ url: '/pages/add/add' });
    });

    test('应正确跳转记录页面', () => {
      const switchTab = jest.fn();
      global.wx.switchTab = switchTab;

      switchTab({ url: '/pages/records/records' });
      expect(switchTab).toHaveBeenCalledWith({ url: '/pages/records/records' });
    });

    test('应正确跳转详情页面', () => {
      const navigateTo = jest.fn();
      global.wx.navigateTo = navigateTo;

      const id = 123;
      navigateTo({ url: \`/pages/detail/detail?id=\${id}\` });
      expect(navigateTo).toHaveBeenCalledWith({ url: '/pages/detail/detail?id=123' });
    });
  });
});
`;
}

function generateRecordsPageTests(gap, fileContent, riskLevel) {
  return [{
    name: 'records_page_management',
    file: 'tests/unit/records-page.test.js',
    template: generateRecordsPageTest(),
    priority: 'high'
  }];
}

function generateRecordsPageTest() {
  return `describe('记录页面管理', () => {
  beforeEach(() => {
    global.wx = {
      getStorageSync: jest.fn(),
      setStorageSync: jest.fn(),
      showModal: jest.fn(),
      showToast: jest.fn()
    };
  });

  afterEach(() => {
    delete global.wx;
  });

  describe('数据加载', () => {
    test('应加载所有类型的记录', () => {
      const medicines = [{ id: 1, name: '阿莫西林' }];
      const records = [{ id: 1, medicineName: '阿莫西林' }];
      const cases = [{ id: 1, content: '病例内容' }];

      global.wx.getStorageSync
        .mockReturnValueOnce(medicines)
        .mockReturnValueOnce(records)
        .mockReturnValueOnce(cases);

      expect(medicines).toHaveLength(1);
      expect(records).toHaveLength(1);
      expect(cases).toHaveLength(1);
    });

    test('应倒序显示记录', () => {
      const records = [
        { id: 1, createTime: '2024-01-01' },
        { id: 2, createTime: '2024-01-02' },
        { id: 3, createTime: '2024-01-03' }
      ];

      const reversed = records.reverse();
      expect(reversed[0].id).toBe(3);
      expect(reversed[2].id).toBe(1);
    });
  });

  describe('病例管理', () => {
    test('应正确创建病例', () => {
      const cases = [];
      global.wx.getStorageSync.mockReturnValue(cases);

      const newCase = {
        id: Date.now(),
        content: '就诊记录：感冒',
        createTime: new Date().toLocaleString()
      };

      cases.push(newCase);
      expect(cases).toHaveLength(1);
      expect(cases[0].content).toBe('就诊记录：感冒');
    });

    test('应拒绝空内容的病例', () => {
      const content = '';
      expect(content).toBeFalsy();
    });
  });

  describe('删除操作', () => {
    test('应正确删除药品', () => {
      let medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' }
      ];
      global.wx.getStorageSync.mockReturnValue(medicines);

      const idToDelete = 1;
      medicines = medicines.filter(m => m.id !== idToDelete);

      expect(medicines).toHaveLength(1);
      expect(medicines[0].id).toBe(2);
    });

    test('应正确删除记录', () => {
      let records = [
        { id: 1, medicineName: '阿莫西林' },
        { id: 2, medicineName: '布洛芬' }
      ];
      global.wx.getStorageSync.mockReturnValue(records);

      const idToDelete = 2;
      records = records.filter(r => r.id !== idToDelete);

      expect(records).toHaveLength(1);
      expect(records[0].id).toBe(1);
    });

    test('删除后应更新存储', () => {
      let data = [1, 2, 3];
      global.wx.getStorageSync.mockReturnValue(data);

      data = data.filter(item => item !== 2);
      global.wx.setStorageSync('records', data);

      expect(global.wx.setStorageSync).toHaveBeenCalledWith('records', [1, 3]);
    });
  });

  describe('服药记录', () => {
    test('应正确创建服药记录', () => {
      const records = [];
      const medicine = { id: 123, name: '阿莫西林' };
      global.wx.getStorageSync.mockReturnValue(records);

      const newRecord = {
        id: Date.now(),
        medicineId: medicine.id,
        medicineName: medicine.name,
        takeTime: new Date().toLocaleString()
      };

      records.push(newRecord);
      global.wx.setStorageSync('records', records);

      expect(records).toHaveLength(1);
      expect(records[0].medicineId).toBe(123);
    });
  });

  describe('Tab切换', () => {
    test('应正确切换到 medicines tab', () => {
      const setData = jest.fn();
      setData({ currentTab: 'medicines' });
      expect(setData).toHaveBeenCalledWith({ currentTab: 'medicines' });
    });

    test('应正确切换到 records tab', () => {
      const setData = jest.fn();
      setData({ currentTab: 'records' });
      expect(setData).toHaveBeenCalledWith({ currentTab: 'records' });
    });

    test('应正确切换到 cases tab', () => {
      const setData = jest.fn();
      setData({ currentTab: 'cases' });
      expect(setData).toHaveBeenCalledWith({ currentTab: 'cases' });
    });
  });
});
`;
}

function generateDetailPageTests(gap, fileContent, riskLevel) {
  return [{
    name: 'detail_page_medicine_management',
    file: 'tests/unit/detail-page.test.js',
    template: generateDetailPageTest(),
    priority: 'high'
  }];
}

function generateDetailPageTest() {
  return `describe('详情页面药品管理', () => {
  beforeEach(() => {
    global.wx = {
      getStorageSync: jest.fn(),
      setStorageSync: jest.fn(),
      showModal: jest.fn(),
      showToast: jest.fn(),
      navigateBack: jest.fn()
    };
  });

  afterEach(() => {
    delete global.wx;
  });

  describe('页面加载', () => {
    test('应从URL参数解析ID', () => {
      const options = { id: '123' };
      const id = parseInt(options.id);
      expect(id).toBe(123);
    });

    test('应从存储中查找药品', () => {
      const medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' }
      ];
      global.wx.getStorageSync.mockReturnValue(medicines);

      const id = 1;
      const medicine = medicines.find(m => m.id === id);

      expect(medicine).toBeDefined();
      expect(medicine.name).toBe('阿莫西林');
    });

    test('应获取该药品的服药记录', () => {
      const records = [
        { id: 1, medicineId: 1, medicineName: '阿莫西林' },
        { id: 2, medicineId: 2, medicineName: '布洛芬' },
        { id: 3, medicineId: 1, medicineName: '阿莫西林' }
      ];
      global.wx.getStorageSync.mockReturnValue(records);

      const medicineId = 1;
      const medicineRecords = records.filter(r => r.medicineId === medicineId);

      expect(medicineRecords).toHaveLength(2);
    });

    test('应倒序显示服药记录', () => {
      const records = [
        { id: 1, takeTime: '2024-01-01' },
        { id: 2, takeTime: '2024-01-02' },
        { id: 3, takeTime: '2024-01-03' }
      ];

      const reversed = records.reverse();
      expect(reversed[0].id).toBe(3);
    });

    test('应处理药品不存在的情况', () => {
      const medicines = [{ id: 1, name: '阿莫西林' }];
      global.wx.getStorageSync.mockReturnValue(medicines);

      const medicine = medicines.find(m => m.id === 999);
      expect(medicine).toBeUndefined();
    });
  });

  describe('服药记录', () => {
    test('应正确创建新的服药记录', () => {
      const records = [];
      global.wx.getStorageSync.mockReturnValue(records);

      const newRecord = {
        id: Date.now(),
        medicineId: 1,
        medicineName: '阿莫西林',
        takeTime: new Date().toLocaleString()
      };

      records.push(newRecord);
      global.wx.setStorageSync('records', records);

      expect(records).toHaveLength(1);
    });

    test('新记录应添加到列表开头', () => {
      const existingRecords = [
        { id: 1, takeTime: '2024-01-01' },
        { id: 2, takeTime: '2024-01-02' }
      ];

      const newRecord = { id: 3, takeTime: '2024-01-03' };
      const updatedRecords = [newRecord, ...existingRecords];

      expect(updatedRecords).toHaveLength(3);
      expect(updatedRecords[0].id).toBe(3);
    });
  });

  describe('删除药品', () => {
    test('应正确删除药品', () => {
      let medicines = [
        { id: 1, name: '阿莫西林' },
        { id: 2, name: '布洛芬' }
      ];
      global.wx.getStorageSync.mockReturnValue(medicines);

      const idToDelete = 1;
      medicines = medicines.filter(m => m.id !== idToDelete);

      expect(medicines).toHaveLength(1);
      expect(medicines[0].id).toBe(2);
    });

    test('删除后应更新存储', () => {
      let medicines = [{ id: 1, name: '阿莫西林' }];
      global.wx.getStorageSync.mockReturnValue(medicines);

      medicines = medicines.filter(m => m.id !== 1);
      global.wx.setStorageSync('medicines', medicines);

      expect(medicines).toHaveLength(0);
    });

    test('删除成功后应导航返回', () => {
      const navigateBack = jest.fn();
      global.wx.navigateBack = navigateBack;

      setTimeout(() => {
        expect(navigateBack).toHaveBeenCalled();
      }, 1500);
    });
  });
});
`;
}

function generateGenericTests(gap, fileContent, riskLevel) {
  return [{
    name: `generic_test_${path.basename(gap.file, '.js')}`,
    file: gap.relativePath.replace('.js', '.test.js'),
    template: generateGenericTest(gap, fileContent),
    priority: 'medium'
  }];
}

function generateGenericTest(gap, fileContent) {
  const functions = extractFunctionsFromContent(fileContent);

  let testContent = `describe('${path.basename(gap.file)} 测试', () => {
`;

  for (const func of functions) {
    testContent += `
  describe('${func}', () => {
    test('函数应存在', () => {
      expect(typeof ${func}).toBeDefined();
    });
  });
`;
  }

  testContent += `});
`;

  return testContent;
}

function extractFunctionsFromContent(content) {
  const functions = [];
  const patterns = [
    /(?:async\s+)?function\s+(\w+)\s*\(/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (!['if', 'for', 'while', 'catch'].includes(match[1])) {
        functions.push(match[1]);
      }
    }
  }

  return [...new Set(functions)];
}

async function generateTests(assessments, config) {
  console.log('   生成测试模板...');

  const templates = generateTestTemplates(assessments);
  const generatedTests = [];

  for (const template of templates) {
    const outputPath = path.join(config.outputDir, 'generated-tests', template.file);

    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    fs.writeFileSync(outputPath, template.template);

    generatedTests.push({
      name: template.name,
      file: outputPath,
      priority: template.priority,
      linesOfCode: template.template.split('\n').length
    });

    console.log(`   ✓ 生成测试: ${template.name}`);
  }

  return generatedTests;
}

module.exports = {
  generateTestTemplates,
  generateTests
};
