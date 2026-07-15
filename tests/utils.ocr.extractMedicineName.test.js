// Tests for utils/ocr.js → extractMedicineName
// Mirrors the parsing scenarios in baidu-ocr but exercises the larger,
// domain-specific keyword list used by the second OCR adapter.

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMedicineName } = require('../utils/ocr');

test('extractMedicineName: returns empty string for falsy input', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extractMedicineName: matches domain keywords (降压药)', () => {
  // "硝苯地平" is in the keyword list — verify the broader medical
  // dictionary works.
  const text = '国药准字H10910052 硝苯地平缓释片 20mg*30片';
  const result = extractMedicineName(text);
  assert.ok(result.includes('硝苯地平'), `result was: ${result}`);
});

test('extractMedicineName: matches "口服液" suffix keyword', () => {
  const text = '小儿感冒口服液 10ml*6支';
  const result = extractMedicineName(text);
  assert.ok(result.includes('口服液'), `result was: ${result}`);
});

test('extractMedicineName: context window boundary — short text at start', () => {
  // Keyword at index 0 — should not go negative.
  const text = '板蓝根颗粒';
  const result = extractMedicineName(text);
  assert.equal(result, '板蓝根颗粒');
});

test('extractMedicineName: context window boundary — long trailing context is truncated', () => {
  // The end index is min(text.length, idx + kw.length + 10), so very
  // long trailing text is clipped.
  const text = '二甲双胍片 0.5g*60片 国药准字H20023370 适用于2型糖尿病';
  const result = extractMedicineName(text);
  assert.ok(result.includes('二甲双胍'), `result was: ${result}`);
  // The function grabs up to 10 chars past the keyword in the original
  // case. Make sure the result is finite and bounded.
  assert.ok(result.length <= '二甲双胍片 0.5g*60片'.length);
});

test('extractMedicineName: returns first line of multi-line input when no keyword matches', () => {
  // "随机文本" matches no keyword; the fallback returns text.split('\n')[0]
  // truncated to 30 chars.
  const text = '随机文本\n另一行\n再一行';
  const result = extractMedicineName(text);
  assert.equal(result, '随机文本');
});

test('extractMedicineName: first-line fallback truncates long single-line to 30 chars', () => {
  // The ocr.js variant applies a 30-char cap on the first-line fallback
  // (different from baidu-ocr.js which caps at 20 in the no-lines branch).
  const longLine = 'x'.repeat(200);
  const text = longLine + '\n第二行';
  const result = extractMedicineName(text);
  assert.equal(result, longLine.substring(0, 30));
});

test('extractMedicineName: trim() removes surrounding whitespace in keyword window', () => {
  const text = '   阿莫西林胶囊 0.25g   ';
  const result = extractMedicineName(text);
  assert.ok(result.startsWith('阿莫西林'), `result was: ${result}`);
  assert.ok(!result.startsWith(' '), 'leading whitespace should be trimmed');
});

test('extractMedicineName: handles Chinese-only fallback gracefully', () => {
  // No keyword, no newlines, no whitespace — the function returns the
  // first 30 chars directly.
  const text = '中华人民共和国国歌';
  const result = extractMedicineName(text);
  assert.equal(result, '中华人民共和国国歌');
});
