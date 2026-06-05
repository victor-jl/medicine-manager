const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName', () => {
  test('提取包含药品关键词的名称', () => {
    const text = '阿莫西林胶囊 0.5g*24粒 国药准字H12345678';
    expect(extractMedicineName(text)).toContain('阿莫西林');
  });

  test('提取包含药片关键词的名称', () => {
    const text = '布洛芬片 0.2g*100片';
    expect(extractMedicineName(text)).toContain('布洛芬');
  });

  test('提取包含颗粒关键词的名称', () => {
    const text = '小儿感冒灵颗粒 每袋10g';
    expect(extractMedicineName(text)).toContain('感冒灵');
  });

  test('提取口服液类型药品', () => {
    const text = '双黄连口服液 10ml*6支';
    expect(extractMedicineName(text)).toContain('双黄连');
  });

  test('处理包含注射液的文本', () => {
    const text = '氯化钠注射液 500ml:4.5g';
    expect(extractMedicineName(text)).toContain('氯化钠');
  });

  test('处理软膏类型药品', () => {
    const text = '红霉素软膏 10g';
    expect(extractMedicineName(text)).toContain('红霉素');
  });

  test('处理空字符串', () => {
    expect(extractMedicineName('')).toBe('');
  });

  test('处理null输入', () => {
    expect(extractMedicineName(null)).toBe('');
  });

  test('处理undefined输入', () => {
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('无匹配关键词时返回第一行', () => {
    const text = '未知药品名称\n规格：10mg\n生产厂家：XX制药';
    const result = extractMedicineName(text);
    expect(result).toBe('未知药品名称');
  });

  test('多行文本提取药品名称', () => {
    const text = `药品名称：头孢克肟胶囊
规格：0.1g*6粒
生产厂家：XX制药有限公司
国药准字：H12345678`;
    expect(extractMedicineName(text)).toContain('头孢');
  });

  test('处理维生素类药品', () => {
    const text = '维生素C片 100mg*60片';
    expect(extractMedicineName(text)).toContain('维生素');
  });

  test('处理中药类药品', () => {
    const text = '板蓝根颗粒 10g*20袋';
    expect(extractMedicineName(text)).toContain('板蓝根');
  });

  test('处理西药类药品', () => {
    const text = '硝苯地平缓释片 20mg*30片';
    expect(extractMedicineName(text)).toContain('硝苯地平');
  });

  test('处理超长文本截取', () => {
    const text = ''.padStart(100, 'a');
    const result = extractMedicineName(text);
    expect(result.length).toBeLessThanOrEqual(30);
  });
});