const { extractMedicineName } = require('../../utils/ocr');

describe('utils/ocr.extractMedicineName', () => {
  it('空输入应返回空字符串', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  it('应识别包含药品剂型关键词的文本并返回上下文片段', () => {
    const text = '本品为阿莫西林胶囊，每粒0.25g，口服。';
    const result = extractMedicineName(text);
    expect(result).toContain('胶囊');
    expect(result).toContain('阿莫西林');
  });

  it('应识别通用药品名称关键词', () => {
    const text = '布洛芬缓释胶囊 0.3g*24粒';
    expect(extractMedicineName(text)).toContain('布洛芬');
  });

  it('未命中关键词时应返回第一行前30字符', () => {
    const text = '这是一个普通说明\n第二行内容';
    expect(extractMedicineName(text)).toBe('这是一个普通说明');
  });

  it('大小写不敏感地匹配关键词', () => {
    const text = 'VITAMIN C 维生素C泡腾片';
    expect(extractMedicineName(text)).toContain('维生素');
  });

  it('应在文本开头正确截断，避免负索引', () => {
    const text = '胶囊 0.5g';
    expect(extractMedicineName(text)).toBe('胶囊 0.5g');
  });
});
