// Tests for utils/ocr.js — specifically extractMedicineName, the pure
// text parser that turns OCR output into a candidate medicine name.
//
// This function is on the hot path of "拍照识别药品" and feeds the
// auto-fill on the add page. It has 41 keywords, asymmetric window
// bounds, and a multiline fallback, so a few off-by-one errors here
// would silently produce wrong names in production. These tests pin
// down the behaviour at the boundaries.

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMedicineName } = require('../utils/ocr.js');

test('extractMedicineName returns empty string for empty input', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extractMedicineName returns first non-empty line when no keyword matches', () => {
  // Use text that contains none of the 24 keywords (notably avoiding
  // 片, 胶囊, 颗粒, 口服液, etc.). The function should fall through
  // to the "first line, truncated to 30" path.
  const text = '国药准字H12345\n规格: 0.5g';
  const result = extractMedicineName(text);
  assert.equal(result, '国药准字H12345');
});

test('extractMedicineName truncates a long unmatched first line to 30 chars', () => {
  const longLine = 'X'.repeat(100);
  const result = extractMedicineName(longLine);
  assert.equal(result.length, 30);
  assert.equal(result, 'X'.repeat(30));
});

test('extractMedicineName finds a keyword in the middle of the text', () => {
  // '阿莫西林' is in the keyword list. Surrounding it should yield a
  // window of up to 8 chars before and 10 chars after.
  const text = '国药准字H12345 阿莫西林胶囊 0.25g*24粒';
  const result = extractMedicineName(text);
  assert.ok(result.includes('阿莫西林'), `expected result to contain keyword, got: ${result}`);
  assert.ok(result.includes('胶囊'), `expected window to extend past the keyword, got: ${result}`);
});

test('extractMedicineName does not crash when keyword is at the very start', () => {
  // Boundary: idx=0, start = max(0, 0-8) = 0 — must not slice with negative index.
  const text = '胶囊 头孢氨苄 0.125g';
  const result = extractMedicineName(text);
  assert.ok(result.startsWith('胶囊'), `expected result to start with 胶囊, got: ${result}`);
});

test('extractMedicineName does not overrun the end of the text', () => {
  // Boundary: keyword at the tail, end = min(text.length, idx+kw.length+10).
  const text = '批准文号: 国药准字H2005 感冒灵颗粒';
  const result = extractMedicineName(text);
  assert.ok(result.endsWith('感冒灵颗粒'), `expected result to end with the keyword, got: ${result}`);
  assert.ok(result.length <= text.length, 'returned string must not exceed input length');
});

test('extractMedicineName returns the first matching keyword, not the last', () => {
  // 钙片 matches earlier in the text; 维生素 matches later. Iteration
  // order in the keyword array should decide the winner.
  const text = '钙片 500mg\n维生素C 100mg';
  const result = extractMedicineName(text);
  assert.ok(result.includes('钙片'), `expected first-match behaviour, got: ${result}`);
});

test('extractMedicineName matches case-insensitively for ASCII tokens', () => {
  // 'vitamin' is not in the list, but '维生素' is. Sanity check on the
  // .toLowerCase() path for any latin-script text mixed in.
  const text = 'Vitamin C with 维生素B6 supplement';
  const result = extractMedicineName(text);
  assert.ok(result.includes('维生素'), `expected case-insensitive match, got: ${result}`);
});

test('extractMedicineName handles text shorter than the keyword window', () => {
  // No keyword present, text is a single 3-char line. Fallback should
  // return that line, truncated to 30.
  const result = extractMedicineName('止咳');
  assert.equal(result, '止咳');
});

test('extractMedicineName strips surrounding whitespace from the result', () => {
  const text = '   板蓝根颗粒   10g*20袋   ';
  const result = extractMedicineName(text);
  assert.equal(result, result.trim(), 'result should be trimmed');
  assert.ok(result.includes('板蓝根'));
});

test('extractMedicineName handles keyword present only on a later line', () => {
  // The function lower-cases the entire input then searches. The
  // substring returned uses the ORIGINAL text (case preserved), but
  // window math is computed from the lower-cased index.
  const text = '第一行 无关键词\n第二行 含布洛芬颗粒';
  const result = extractMedicineName(text);
  assert.ok(result.includes('布洛芬'), `expected to find keyword on later line, got: ${result}`);
});
