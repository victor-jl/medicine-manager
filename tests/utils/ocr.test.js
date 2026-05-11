const realOcr = jest.requireActual('../../utils/ocr');

describe('OCR工具 - 药品名称提取', () => {
  const { extractMedicineName } = realOcr;

  describe('extractMedicineName', () => {
    test('应识别包含胶囊的药品名', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别包含片字的药品名', () => {
      const text = '布洛芬片 0.2g';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别包含颗粒的药品名', () => {
      const text = '感冒灵颗粒 10g';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应识别包含口服液的药品名', () => {
      const text = '止咳口服液 100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应处理中药名称', () => {
      const text = '板蓝根颗粒';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应处理包含多个关键词的情况', () => {
      const text = '阿司匹林肠溶片 50mg';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('空字符串应返回空字符串', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('null应返回空字符串', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('undefined应返回空字符串', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('不包含关键词时返回第一行', () => {
      const text = 'XY123456';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应正确提取关键词周围的上下文', () => {
      const text = '生产厂家: XXX制药 布洛芬片 0.2g 有效期至2025年';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('片');
    });

    test('应处理大小写混合的关键词', () => {
      const text = 'VITAMIN C 维生素片';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应识别维生素类药品', () => {
      const text = '多种维生素片';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应识别抗生素类药品', () => {
      const text = '头孢克洛分散片';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应识别消化系统药品', () => {
      const text = '奥美拉唑肠溶胶囊';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应识别心血管系统药品', () => {
      const text = '硝苯地平缓释片';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应识别内分泌系统药品', () => {
      const text = '二甲双胍片 0.5g';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应识别抗过敏药品', () => {
      const text = '氯雷他定片 10mg';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('应识别止泻类药品', () => {
      const text = '蒙脱石散 3g';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });
});
