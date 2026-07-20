const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.extractMedicineName', () => {
  it('空输入应返回空字符串', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('应识别包含剂型关键词的文本并返回上下文片段', () => {
    const text = '头孢克肟颗粒 50mg*6袋';
    const result = extractMedicineName(text);
    expect(result).toContain('头孢克肟');
    expect(result).toContain('颗粒');
  });

  it('应识别症状类关键词', () => {
    const text = '感冒清热颗粒 用于风寒感冒';
    expect(extractMedicineName(text)).toContain('感冒');
  });

  it('未命中关键词时应返回第一行非空行', () => {
    const text = '\n\n普通说明\n第二行';
    expect(extractMedicineName(text)).toBe('普通说明');
  });

  it('全部为空行时应返回原文前20字符', () => {
    const text = '   \n   \n   ';
    expect(extractMedicineName(text)).toBe(text.substring(0, 20));
  });

  it('大小写不敏感地匹配关键词', () => {
    const text = 'VITAMIN D 钙片';
    expect(extractMedicineName(text)).toContain('钙片');
  });
});
