const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName (ocr.js)', () => {
  describe('基本功能', () => {
    test('空输入返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('返回第一行作为默认值（截取前30字符）', () => {
      const text = '这是第一行\n第二行';
      expect(extractMedicineName(text)).toBe('这是第一行');
    });
  });

  describe('药品关键词匹配', () => {
    test('匹配常见药品剂型关键词', () => {
      expect(extractMedicineName('阿莫西林胶囊')).toContain('胶囊');
      expect(extractMedicineName('布洛芬片')).toContain('片');
      expect(extractMedicineName('感冒颗粒')).toContain('颗粒');
    });

    test('匹配具体药品名称', () => {
      expect(extractMedicineName('阿莫西林胶囊 0.5g')).toContain('阿莫西林');
      expect(extractMedicineName('布洛芬缓释胶囊')).toContain('布洛芬');
      expect(extractMedicineName('对乙酰氨基酚片')).toContain('对乙酰氨基酚');
    });

    test('匹配中成药名称', () => {
      expect(extractMedicineName('感冒灵颗粒')).toContain('感冒灵');
      expect(extractMedicineName('板蓝根颗粒')).toContain('板蓝根');
      expect(extractMedicineName('双黄连口服液')).toContain('双黄连');
    });

    test('匹配功效关键词', () => {
      expect(extractMedicineName('止咳糖浆')).toContain('止咳');
      expect(extractMedicineName('祛痰片')).toContain('祛痰');
      expect(extractMedicineName('退烧药')).toContain('退烧');
    });
  });

  describe('边界条件', () => {
    test('关键词在文本中间位置', () => {
      const text = '生产厂家：XX药业\n阿莫西林胶囊\n规格：0.5g';
      expect(extractMedicineName(text)).toContain('阿莫西林');
    });

    test('多个关键词匹配返回包含关键词的片段', () => {
      const text = '感冒灵颗粒和布洛芬片';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('大小写不敏感匹配', () => {
      expect(extractMedicineName('AMOXICILLIN胶囊')).toContain('胶囊');
    });

    test('长文本截取正确范围', () => {
      const longText = '这是一段很长的文本'.repeat(10) + '阿莫西林胶囊' + '后面还有很多文字'.repeat(10);
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('阿莫西林');
    });
  });

  describe('实际OCR场景', () => {
    test('完整药品包装文本', () => {
      const ocrText = `
        阿莫西林胶囊
        规格：0.5g×12粒/盒
        有效期至：2025年12月
        生产企业：XX制药有限公司
      `;
      expect(extractMedicineName(ocrText)).toContain('阿莫西林');
    });

    test('多行文本识别', () => {
      const text = '批准文号\n国药准字H12345678\n布洛芬缓释胶囊';
      expect(extractMedicineName(text)).toContain('布洛芬');
    });
  });
});
