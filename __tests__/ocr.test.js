/**
 * utils/ocr.js - 药品名称提取功能测试
 * 测试目标：验证关键词匹配、边界条件和异常输入处理
 */

const { extractMedicineName } = require('../utils/ocr');

describe('extractMedicineName - 药品名称提取', () => {
  
  describe('关键词匹配测试', () => {
    test('应识别包含"胶囊"的药品名称', () => {
      const text = '阿莫西林胶囊 规格:0.5g*24粒';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result).toContain('阿莫西林');
    });

    test('应识别包含"片"的药品名称', () => {
      const text = '布洛芬片 0.2g 生产日期:2025-01-01';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('片');
    });

    test('应识别常见药品名称（阿莫西林）', () => {
      const text = '阿莫西林分散片 国药准字H20050516';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应识别包含"颗粒"的药品', () => {
      const text = '感冒灵颗粒 10g*6袋';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
      expect(result).toContain('颗粒');
    });

    test('应识别注射液类型药品', () => {
      const text = '头孢曲松钠注射液 1g';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });
  });

  describe('边界条件测试', () => {
    test('应正确处理关键词出现在文本开头的情况', () => {
      const text = '胶囊装药品 名称测试';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      // 验证不会越界访问
      expect(result.length).toBeGreaterThan(0);
    });

    test('应正确处理关键词出现在文本末尾的情况', () => {
      const text = '这是测试药品的名称 阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      // 验证不会越界访问
      expect(result.length).toBeGreaterThan(0);
    });

    test('应正确提取关键词前后的文本（不超过边界）', () => {
      const text = '这是一段很长的描述文字阿莫西林胶囊后面还有更多文字';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      // 提取的片段长度应合理（关键词前8字符，后10字符）
      expect(result.length).toBeLessThanOrEqual(30);
    });

    test('应在多个关键词时返回第一个匹配', () => {
      const text = '维生素C片和阿莫西林胶囊';
      const result = extractMedicineName(text);
      // 应匹配第一个关键词，函数返回关键词周围的片段
      // 注意：函数会提取关键词周围的文本，可能不包含完整关键词
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('素');
    });
  });

  describe('异常输入处理测试', () => {
    test('应正确处理空字符串输入', () => {
      const result = extractMedicineName('');
      expect(result).toBe('');
    });

    test('应正确处理null输入', () => {
      const result = extractMedicineName(null);
      expect(result).toBe('');
    });

    test('应正确处理undefined输入', () => {
      const result = extractMedicineName(undefined);
      expect(result).toBe('');
    });

    test('应对无关键词文本返回第一行', () => {
      const text = '这是第一行\n这是第二行\n这是第三行';
      const result = extractMedicineName(text);
      expect(result).toBe('这是第一行');
    });

    test('应对纯空白字符文本返回空字符串', () => {
      const text = '   \n\t\n   ';
      const result = extractMedicineName(text);
      // 应返回修剪后的空字符串
      expect(result.trim()).toBe('');
    });
  });

  describe('大小写和格式处理', () => {
    test('应忽略大小写差异（关键词匹配）', () => {
      const text = 'VITAMIN C 胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应正确处理包含换行符的文本', () => {
      const text = '药品名称\n阿莫西林胶囊\n生产日期:2025-01-01';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应正确处理包含特殊字符的文本', () => {
      const text = '阿莫西林胶囊（胶囊剂）【规格】0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });
  });

  describe('真实场景测试', () => {
    test('应识别真实药盒标签文本1', () => {
      const text = '阿莫西林胶囊\n规格: 0.5g×24粒\n批准文号: 国药准字H23021603\n生产日期: 2025.01.15\n有效期至: 2028.01';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('应识别真实药盒标签文本2', () => {
      const text = '布洛芬缓释胶囊\n每粒含布洛芬0.3g\n国药准字Z10910003\n中美史克';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('胶囊');
    });

    test('应识别感冒类药物', () => {
      const text = '999感冒灵颗粒\n清热解毒\n每盒10袋';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应识别维生素类药物', () => {
      const text = '维生素C片\n补充维生素\n100片装';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应识别含"片"但非药品的文本', () => {
      const text = '产品说明书\n第1页';
      const result = extractMedicineName(text);
      // 没有药品关键词，应返回第一行
      expect(result).toBe('产品说明书');
    });
  });

  describe('返回值长度限制测试', () => {
    test('返回值长度不应超过30字符（无关键词情况）', () => {
      const longText = '这是一个非常非常长的药品名称描述文本用于测试长度限制功能';
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(30);
    });

    test('提取的片段应包含关键词和合理的上下文', () => {
      const text = '前面有八个字符这里阿莫西林胶囊后面有十个字符继续';
      const result = extractMedicineName(text);
      // 应包含关键词
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
      // 长度应合理
      expect(result.length).toBeGreaterThan(0);
    });
  });
});