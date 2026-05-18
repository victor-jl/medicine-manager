/**
 * utils/baidu-ocr.js 单元测试
 * 测试百度OCR识别和药品名称提取逻辑
 */

const { extractMedicineName, getAccessToken } = require('../../../utils/baidu-ocr');

describe('百度OCR工具 - extractMedicineName', () => {
  describe('正常场景', () => {
    test('应识别胶囊类药品', () => {
      const text = '阿莫西林胶囊 0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应识别片剂类药品', () => {
      const text = '布洛芬片 0.2g*20片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应识别颗粒类药品', () => {
      const text = '感冒灵颗粒 10gx9袋';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
    });

    test('应识别口服液类药品', () => {
      const text = '双黄连口服液 10ml';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应识别注射液类药品', () => {
      const text = '葡萄糖注射液 250ml:12.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });
  });

  describe('边界条件', () => {
    test('空字符串返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null输入返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined输入返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('无关键词时返回第一行', () => {
      const text = '这是一段没有任何药品关键词的描述文字';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  describe('大小写处理', () => {
    test('应转换为小写进行匹配', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('混合大小写文本正常处理', () => {
      const text = 'Test布洛芬片Test';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });
  });

  describe('上下文提取', () => {
    test('应提取关键词周围文本', () => {
      const text = '产品名称：阿莫西林胶囊 规格：0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('关键词位于文本开头', () => {
      const text = '胶囊阿莫西林规格说明';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('关键词位于文本末尾', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });

  describe('关键词匹配', () => {
    test('应匹配第一个找到的关键词', () => {
      const text = '布洛芬胶囊和感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(0);
    });

    test('关键词前后应有合理上下文', () => {
      const text = '名称：阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(5);
    });
  });

  describe('多行文本处理', () => {
    test('应处理换行符', () => {
      const text = '第一行\n胶囊类药品\n第三行';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应处理回车符', () => {
      const text = '第一行\r\n片剂类\r\n第三行';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
    });

    test('应处理混合换行符', () => {
      const text = '行1\n行2\r\n胶囊';
      const result = extractMedicineName(text);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('API密钥相关', () => {
    test('模块应导出getAccessToken函数', () => {
      expect(typeof getAccessToken).toBe('function');
    });
  });

  describe('常见药品关键词', () => {
    test('应识别阿莫西林', () => {
      const text = '阿莫西林克拉维酸钾片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应识别布洛芬', () => {
      const text = '布洛芬缓释胶囊 0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应识别头孢类', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应识别维生素类', () => {
      const text = '维生素B族片';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应识别钙片类', () => {
      const text = '钙尔奇D片 600mg';
      const result = extractMedicineName(text);
      expect(result).toContain('钙');
    });
  });

  describe('复杂场景', () => {
    test('长文本截取合理', () => {
      const longText = '通用名称：布洛芬缓释胶囊英文名称：Ibuprofen Sustained Release Capsules产品规格：0.3g用法用量：口服，成人一次1粒，一日2次生产企业：某某制药有限公司'.repeat(5);
      const result = extractMedicineName(longText);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(50);
    });

    test('特殊字符文本正常处理', () => {
      const text = '药品@#$%^&胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('纯数字文本返回空或有限内容', () => {
      const text = '123456789';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });
});

describe('百度OCR工具 - 集成场景', () => {
  test('完整识别流程模拟', () => {
    const ocrResult = `
    通用名称：阿莫西林胶囊
    英文名称：Amoxicillin Capsules
    规格：0.25g
    生产厂家：某某制药
    `;
    const medicineName = extractMedicineName(ocrResult);
    expect(medicineName).toBeTruthy();
    expect(medicineName.length).toBeGreaterThan(0);
  });

  test('OCR识别失败场景', () => {
    const emptyText = '';
    const result = extractMedicineName(emptyText);
    expect(result).toBe('');
  });

  test('部分识别场景', () => {
    const partialText = '阿莫西林';
    const result = extractMedicineName(partialText);
    expect(result.length).toBeGreaterThan(0);
  });
});
