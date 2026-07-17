// tests/utils/ocr.test.js
// 回归测试: utils/ocr.js 的 extractMedicineName 是 add.js 识别药品名称的核心下游函数。
// 它被 add.js -> recognizeWithBaidu 等流程间接使用，并且包含多处容易出错的边界条件。

const { extractMedicineName } = require('../../utils/ocr');

describe('utils/ocr.js - extractMedicineName', () => {
  describe('空 / 无效输入', () => {
    test('空字符串返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('null 返回空字符串', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('undefined 返回空字符串', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('数字 0 走 falsy 分支返回空字符串', () => {
      // 实现使用 if (!text)，0 / false 也会走该分支
      expect(extractMedicineName(0)).toBe('');
    });
  });

  describe('关键词命中: 上下文窗口提取', () => {
    test('中文药品关键词命中: 返回命中点附近的子串', () => {
      const text = '国药准字H12345\n阿莫西林胶囊 0.25g*24粒\n用法: 口服';
      // 阿莫西林 在 idx=14 附近; 窗口: [idx-8, idx+kwLen+10) 即 [6, 30)
      const out = extractMedicineName(text);
      expect(out).toContain('阿莫西林');
      expect(out).toContain('胶囊');
    });

    test('关键词靠近开头: start 被 clamp 到 0', () => {
      const text = '布洛芬片 用于退烧';
      // "布洛芬" 位于开头, 窗口不能为负
      const out = extractMedicineName(text);
      expect(out.startsWith('布洛芬')).toBe(true);
    });

    test('关键词靠近结尾: end 被 clamp 到 text.length', () => {
      const text = '前面是一些无效内容 感冒清热颗粒';
      const out = extractMedicineName(text);
      expect(out).toContain('感冒清热');
      // 不应抛出 / 不应返回 undefined
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
    });

    test('英文字母也会被命中 (toLowerCase 兼容)', () => {
      // 当前关键词列表中无英文药名，但 toLowerCase 必须不破坏中文字符
      const text = 'Aspirin 100mg';
      const out = extractMedicineName(text);
      // 没有任何关键词命中 -> 走 fallback, 取第一行
      expect(out).toBe('Aspirin 100mg');
    });

    test('首条命中的关键词决定结果 (顺序优先)', () => {
      // keywords 列表中 "片" 出现在多个药品之前; 但 "阿莫西林" 在 "片" 之前出现
      // 因此包含 "阿莫西林胶囊" 的文本应当返回阿莫西林相关片段
      const text = '复方阿莫西林片 0.5g';
      const out = extractMedicineName(text);
      expect(out).toContain('阿莫西林');
    });
  });

  describe('Fallback: 无关键词命中', () => {
    test('返回第一行, 去除首尾空白', () => {
      const text = '   某药品名称   \n第二行说明\n第三行';
      expect(extractMedicineName(text)).toBe('某药品名称');
    });

    test('首行截断到 30 字符', () => {
      const longLine = 'X'.repeat(80);
      const out = extractMedicineName(longLine);
      expect(out.length).toBe(30);
    });

    test('多行文本无关键词, 仍只返回第一行', () => {
      const text = '第一行 药品\n第二行 用法用量';
      expect(extractMedicineName(text)).toBe('第一行 药品');
    });
  });

  describe('结果清洗: trim 行为', () => {
    test('返回结果两端无空白', () => {
      const text = '  前面有空格 维生素C片 含空格  ';
      const out = extractMedicineName(text);
      expect(out).toBe(out.trim());
    });
  });
});
