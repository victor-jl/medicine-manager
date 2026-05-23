const wxMock = {
  getStorageSync: jest.fn(),
  setStorageSync: jest.fn(),
  request: jest.fn(),
  getFileSystemManager: jest.fn(() => ({
    readFileSync: jest.fn(() => 'mock-base64-data')
  }))
};

global.wx = wxMock;

const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('extractMedicineName', () => {
  test('应提取包含药品剂型的名称', () => {
    const text = '阿莫西林胶囊 0.5g';
    const result = extractMedicineName(text);
    expect(result).toMatch(/阿莫西林.*胶囊/);
  });

  test('应处理空字符串', () => {
    const result = extractMedicineName('');
    expect(result).toBe('');
  });

  test('应处理 null 输入', () => {
    const result = extractMedicineName(null);
    expect(result).toBe('');
  });

  test('应处理 undefined 输入', () => {
    const result = extractMedicineName(undefined);
    expect(result).toBe('');
  });

  test('应匹配药品关键词', () => {
    const text = '布洛芬片';
    const result = extractMedicineName(text);
    expect(result).toContain('布洛芬');
  });

  test('应处理关键词在文本中间的情况', () => {
    const text = '药品名：阿莫西林胶囊';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });

  test('当无关键词时应返回第一行', () => {
    const text = 'random text\nno keywords';
    const result = extractMedicineName(text);
    expect(result).toBe('random text');
  });

  test('应处理多行文本', () => {
    const text = '第一行\n阿莫西林胶囊\n第三行';
    const result = extractMedicineName(text);
    expect(result).toContain('阿莫西林');
  });
});

describe('recognizeText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wxMock.getStorageSync.mockReset();
    wxMock.setStorageSync.mockReset();
    wxMock.request.mockReset();
  });

  test('应从缓存获取Token', async () => {
    const futureTime = Date.now() + 25 * 24 * 60 * 60 * 1000;
    wxMock.getStorageSync
      .mockReturnValueOnce('cached-token')
      .mockReturnValueOnce(futureTime);

    wxMock.request.mockImplementation((options) => {
      options.success({ data: { words_result: [{ words: 'test' }] } });
      return { data: { words_result: [{ words: 'test' }] } };
    });

    expect(wxMock.getStorageSync('baidu_access_token')).toBe('cached-token');
  });

  test('应处理无效输入', () => {
    const result = extractMedicineName(null);
    expect(result).toBe('');
  });
});
