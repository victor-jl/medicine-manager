const { extractMedicineName } = require('../../utils/ocr');

describe('utils/ocr.js - extractMedicineName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('边界条件处理', () => {
    test('应返回空字符串当输入为null', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('应返回空字符串当输入为undefined', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('应返回空字符串当输入为空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });
  });

  describe('关键词匹配逻辑', () => {
    test('应匹配中文药品剂型关键词', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('应匹配西药名称', () => {
      const text = '布洛芬缓释片 0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('片');
    });

    test('应匹配中药名称', () => {
      const text = '板蓝根颗粒10g';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('应匹配中成药名称', () => {
      const text = '双黄连口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('双黄连');
      expect(result).toContain('口服液');
    });

    test('应匹配维生素类', () => {
      const text = '维生素C片 100mg';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应匹配处方药类别', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });
  });

  describe('上下文提取逻辑', () => {
    test('应提取关键词周围的上下文', () => {
      const text = '生产日期20240101阿莫西林胶囊0.25g有效期至20251231';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result.length).toBeGreaterThan(0);
    });

    test('当关键词在文本开头时应正确处理', () => {
      const text = '布洛芬片 0.2g 发热疼痛';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('当关键词在文本末尾时应正确处理', () => {
      const text = '请服用阿奇霉素';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });
  });

  describe('大小写不敏感匹配', () => {
    test('应忽略大小写进行匹配', () => {
      const text = 'AMOXICILLIN CAPSULES';
      const result = extractMedicineName(text);
      expect(result).not.toBe('');
    });
  });

  describe('无关键词时的降级处理', () => {
    test('当无关键词时应返回第一行', () => {
      const text = '这是一段没有任何药品关键词的描述文本';
      const result = extractMedicineName(text);
      expect(result).toBe('这是一段没有任何药品关键词的描述文本');
      expect(result.length).toBeLessThanOrEqual(30);
    });

    test('当文本只有一行且无关键词时应截取前30字符', () => {
      const text = '药品信息：包装盒上印有产品名称';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
    });

    test('当文本为纯空白时应返回空字符串', () => {
      const text = '   \n\t  ';
      const result = extractMedicineName(text);
      expect(result).toBe('');
    });
  });

  describe('特殊字符和格式处理', () => {
    test('应处理包含换行符的文本', () => {
      const text = '阿莫西林胶囊\n0.25gx12粒';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应处理包含特殊符号的文本', () => {
      const text = '对乙酰氨基酚片(扑热息痛)';
      const result = extractMedicineName(text);
      expect(result).toContain('对乙酰氨基酚');
    });

    test('应处理包含英文和数字混合的文本', () => {
      const text = 'Metformin 500mg 二甲双胍片';
      const result = extractMedicineName(text);
      expect(result).toContain('二甲双胍');
    });
  });

  describe('回归风险场景', () => {
    test('新增功能：胰岛素关键词应被识别', () => {
      const text = '胰岛素注射液 400IU';
      const result = extractMedicineName(text);
      expect(result).toContain('胰岛素');
    });

    test('新增功能：他汀类药物应被识别', () => {
      const text = '阿托伐他汀钙片';
      const result = extractMedicineName(text);
      expect(result).toContain('他汀');
    });

    test('原有功能：胃药关键词应被识别', () => {
      const text = '奥美拉唑肠溶胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('奥美拉唑');
    });

    test('原有功能：止咳类药物应被识别', () => {
      const text = '止咳橘红颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('止咳');
    });
  });
});
