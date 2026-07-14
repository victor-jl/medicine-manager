// tests/baidu-ocr.test.js
// 覆盖 utils/baidu-ocr.js 中 extractMedicineName 的解析逻辑与回退路径
// 该函数与 utils/ocr.js 重复实现但偏移参数（-5 / +10）与回退策略不同，
// 容易在维护时被改坏而缺乏回归保护。

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractMedicineName } = require('../utils/baidu-ocr.js');

test('baidu extractMedicineName: 空值与 falsy 输入返回空字符串', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
  assert.equal(extractMedicineName(false), '');
});

test('baidu extractMedicineName: 命中关键词时返回包含关键词的窗口', () => {
  const out = extractMedicineName('规格 0.25g 阿莫西林胶囊 24粒');
  assert.ok(out.includes('胶囊'));
  assert.ok(out.includes('阿莫西林'));
});

test('baidu extractMedicineName: 关键词在文本开头时不越界为负索引', () => {
  const out = extractMedicineName('胶囊装药品');
  assert.ok(out.startsWith('胶'), '从 0 开始切片时不能取到负索引');
});

test('baidu extractMedicineName: 关键词在文本末尾时不越界超出长度', () => {
  const text = '维生素';
  const out = extractMedicineName(text);
  assert.equal(out.length, text.length);
  assert.ok(out.includes('维生素'));
});

test('baidu extractMedicineName: 文本不含任何关键词时回退到首个非空行', () => {
  const text = '第一行药品名称\n第二行厂家\n第三行批号';
  const out = extractMedicineName(text);
  assert.equal(out, '第一行药品名称');
});

test('baidu extractMedicineName: 全部为空白行时回退到文本前 20 字符', () => {
  const text = '   \n   \n   ';
  const out = extractMedicineName(text);
  // 没有非空行，最终回退到前 20 字符（被 trim 后可能更短）
  assert.equal(out, text.substring(0, 20));
});

test('baidu extractMedicineName: 结果会去除首尾空白', () => {
  const out = extractMedicineName('   居中文本 布洛芬片 100mg   ');
  assert.equal(out, out.trim());
});

test('baidu extractMedicineName: 使用 \r\n 分隔的多行文本也能取到首行', () => {
  const text = '复方感冒灵\r\n厂家: 某某制药\r\n批号: 12345';
  const out = extractMedicineName(text);
  // 既不在关键词表上命中（"感冒灵" 是关键词，会命中 "感冒灵" 周围窗口）
  // 因此断言：输出应包含 "感冒灵" 或其上下文
  assert.ok(out.length > 0);
  assert.ok(/感冒灵/.test(out));
});
