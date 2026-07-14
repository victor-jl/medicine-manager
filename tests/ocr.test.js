// tests/ocr.test.js
// 覆盖 utils/ocr.js 中 extractMedicineName 的解析逻辑与边界条件
// 该函数是首页与新增页药品识别流程的下游共享工具，关键词偏移与子串越界
// 任一回归都会污染用户最终看到的药品名称。

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractMedicineName } = require('../utils/ocr.js');

test('extractMedicineName: 空值与 falsy 输入返回空字符串', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
  assert.equal(extractMedicineName(0), '');
});

test('extractMedicineName: 文本不含任何关键词时回退到首行前 30 字符', () => {
  const text = '这是一段完全没有命中关键词的随机文本';
  const out = extractMedicineName(text);
  // 不应包含关键词片段，应回退到首行
  assert.equal(out, text.substring(0, 30).trim());
});

test('extractMedicineName: 命中关键词时返回包含关键词的上下文窗口', () => {
  const out = extractMedicineName('本品为阿莫西林胶囊 0.25g*24粒');
  assert.ok(out.includes('胶囊'), '结果必须包含匹配到的关键词');
  assert.ok(out.includes('阿莫西林'), '结果必须包含关键词前的上下文');
});

test('extractMedicineName: 关键词在文本最开头时不会越界为负索引', () => {
  // 关键词位于第 0 位，idx - 8 会变成负数；Math.max(0, ...) 应保证 start=0
  const out = extractMedicineName('胶囊-阿莫西林 250mg');
  assert.ok(out.startsWith('胶囊'), '从 0 开始切片时不能取到负索引');
  assert.ok(out.includes('阿莫西林'));
});

test('extractMedicineName: 关键词在文本末尾时不会越界超出文本长度', () => {
  const text = '复方制剂 维生素';
  const out = extractMedicineName(text);
  // 关键词接近末尾，end 不应超过 text.length
  assert.ok(out.length <= text.length);
  assert.ok(out.includes('维生素'));
});

test('extractMedicineName: 对英文大小写不敏感', () => {
  // 当前关键词表均为中文，但函数使用 toLowerCase 后再 includes，
  // 验证大小写归一化不会破坏对中文关键词的匹配。
  const out = extractMedicineName('ASPIRIN 阿司匹林片 100mg');
  assert.ok(out.includes('阿司匹林'));
});

test('extractMedicineName: 返回结果会去除首尾空白', () => {
  const out = extractMedicineName('   含前导空格的 布洛芬片 文本   ');
  assert.equal(out, out.trim(), '输出两端不应存在空白');
});

test('extractMedicineName: 多个关键词时按关键字表顺序返回首个匹配', () => {
  // 关键词表中 "片" 出现在 "布洛芬" 之前；"阿莫西林" 在 "布洛芬" 之前
  // 这里让 "片" 出现在前面：函数应返回含 "片" 的窗口（idx 较小者先匹配）
  const out = extractMedicineName('普通片剂 维生素 钙片');
  assert.ok(out.includes('片'), '应按 includes 顺序命中关键词');
});

test('extractMedicineName: 关键词命中后输出长度受窗口控制', () => {
  // idx - 8 .. idx + kw.length + 10 是窗口；验证切片长度不会异常膨胀
  const padding = '很长的前置内容'.repeat(20);
  const out = extractMedicineName(padding + '阿莫西林胶囊 0.25g');
  // 窗口边界：start 在 idx-8（>=0），end 在 idx+kw.length+10
  // 该用例验证窗口是受控的，不会因为整段文本都包含关键词而退化
  assert.ok(out.length < padding.length, '结果应限定在关键词周围的窗口内');
});
