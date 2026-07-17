// tests/utils/baidu-ocr.test.js
// 回归测试: utils/baidu-ocr.js 的 extractMedicineName 与 utils/ocr.js 行为相似但有差异
// (窗口更小: idx-5..idx+kw+10; fallback 拆分 \\n 或 \\r; 无行时取前 20 字符)
// 该函数被独立 API 路径使用, 任何回归都会影响识别结果。

const { extractMedicineName } = require('../../utils/baidu-ocr');

describe('utils/baidu-ocr.js - extractMedicineName', () => {
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
  });

  describe('关键词命中: 上下文窗口 (±5, +10)', () => {
    test('命中关键词, 返回包含关键词的子串', () => {
      const text = '产品编号: 999\n阿莫西林胶囊 0.25g';
      const out = extractMedicineName(text);
      expect(out).toContain('阿莫西林');
    });

    test('关键词靠近开头: start 被 clamp 到 0', () => {
      const text = '布洛芬片 退烧止痛';
      const out = extractMedicineName(text);
      expect(out.startsWith('布洛芬')).toBe(true);
    });

    test('关键词靠近结尾: end 被 clamp 到 text.length', () => {
      const text = '前面是无效内容 维生素C片';
      const out = extractMedicineName(text);
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
      expect(out).toContain('维生素');
    });

    test('窗口范围比 ocr.js 小, 返回子串长度为 5+kw+10', () => {
      // 构造一个上下文丰富的文本, 在更靠后的位置命中关键词
      // 使用 '布洛芬' 避免被列表中更靠前的 '片' 拦截
      const text = 'A'.repeat(20) + '布洛芬' + 'B'.repeat(20);
      const out = extractMedicineName(text);
      // '布洛芬' 位于 index 20, 长度 3
      // start = max(0, 20-5) = 15, end = min(text.length, 20+3+10) = 33
      // substring(15, 33) = 18 chars
      expect(out.length).toBe(5 + 3 + 10);
      expect(out).toContain('布洛芬');
    });
  });

  describe('Fallback 行为', () => {
    test('无关键词: 返回按 \\n 或 \\r 拆分后的第一个非空行', () => {
      const text = '某药品说明\r\n第二行 详细';
      expect(extractMedicineName(text)).toBe('某药品说明');
    });

    test('无关键词: \\n 拆分也生效', () => {
      const text = '  头行  \n  次行  ';
      // split+filter: 保留有内容的行; filter 不 trim, 直接返回 lines[0]
      expect(extractMedicineName(text)).toBe('  头行  ');
    });

    test('无关键词无换行: 仍按首行返回, 不走 20 字符截断', () => {
      // lines = ['XXX...50'], 非空, 因此走 lines[0] 分支, 不截断
      const text = 'X'.repeat(50);
      const out = extractMedicineName(text);
      expect(out.length).toBe(50);
    });

    test('只有空行: 视为无行, 返回前 20 字符', () => {
      const text = '   \n   \n   ';
      const out = extractMedicineName(text);
      // filter 之后 lines 为 [], 走 substring(0, 20) 路径
      expect(out).toBe(text.substring(0, 20));
    });
  });

  describe('结果清洗', () => {
    test('返回结果两端 trim', () => {
      const text = '前面  布洛芬片  后面';
      const out = extractMedicineName(text);
      expect(out).toBe(out.trim());
    });
  });
});
