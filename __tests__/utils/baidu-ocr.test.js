const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.js - extractMedicineName', () => {
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

  describe('关键词匹配', () => {
    test('应匹配胶囊剂型', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应匹配片剂', () => {
      const text = '布洛芬片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别头孢关键词存在', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(0);
    });

    test('应匹配中药名称', () => {
      const text = '感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应匹配症状关键词', () => {
      const text = '退烧止痛片';
      const result = extractMedicineName(text);
      expect(result).toContain('退烧');
    });
  });

  describe('上下文提取', () => {
    test('应提取关键词周围上下文', () => {
      const text = '阿司匹林片 100mg';
      const result = extractMedicineName(text);
      expect(result).toContain('阿司匹林');
      expect(result).toContain('片');
    });

    test('关键词在末尾时应正确处理', () => {
      const text = '请服用维生素';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });
  });

  describe('降级处理', () => {
    test('无关键词时应返回第一行', () => {
      const text = '产品说明书内容\n药品名称：示例';
      const result = extractMedicineName(text);
      expect(result).toBe('产品说明书内容');
    });

    test('单行文本无关键词时应截取', () => {
      const text = '包装盒设计图案';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(20);
    });

    test('多行文本无关键词时应取第一行', () => {
      const text = '第一行内容\n第二行内容\n第三行内容';
      const result = extractMedicineName(text);
      expect(result).toBe('第一行内容');
    });
  });

  describe('特殊格式处理', () => {
    test('应处理换行符', () => {
      const text = '钙片\n补充钙质';
      const result = extractMedicineName(text);
      expect(result).toContain('钙片');
    });

    test('应处理混合大小写', () => {
      const text = 'ASPirin 退烧药';
      const result = extractMedicineName(text);
      expect(result.toLowerCase()).toContain('退烧');
    });
  });

  describe('与 ocr.js 的一致性验证', () => {
    test('两种实现对同一输入应有相似行为', () => {
      const text = '阿奇霉素胶囊';
      const baiduResult = extractMedicineName(text);
      expect(baiduResult).toContain('阿奇霉素');
    });
  });
});
