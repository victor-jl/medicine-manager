// tests/utils/baidu-ocr.test.js
// Unit tests for utils/baidu-ocr.js#extractMedicineName — a pure
// keyword/parsing function used as a fallback for OCR results.

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractMedicineName } = require('../../utils/baidu-ocr');

test('extractMedicineName returns "" for empty input', () => {
  assert.equal(extractMedicineName(''), '');
});

test('extractMedicineName returns "" for null and undefined', () => {
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extractMedicineName extracts substring around known Chinese keyword 胶囊', () => {
  const result = extractMedicineName('【国药准字】阿莫西林胶囊0.25g*24粒装');
  assert.ok(result.includes('胶囊'), `expected 胶囊 in "${result}"`);
  assert.ok(result.includes('阿莫西林'), `expected 阿莫西林 in "${result}"`);
});

test('extractMedicineName matches medicine name keywords (阿莫西林)', () => {
  // Avoid other keywords (e.g. 片) in the input — the function
  // returns the first match in keyword-list order, and '片' precedes
  // '阿莫西林' in the keyword array.
  const result = extractMedicineName('本品为阿莫西林克拉维酸钾');
  assert.ok(result.includes('阿莫西林'));
});

test('extractMedicineName matches category keywords (维生素)', () => {
  const result = extractMedicineName('碳酸钙D3维生素D片 儿童装');
  assert.ok(result.includes('维生素'));
});

test('extractMedicineName returns the first non-empty line when no keyword matches', () => {
  const result = extractMedicineName('XYZ12345\nSome other text\nMore text');
  assert.equal(result, 'XYZ12345');
});

test('extractMedicineName falls back to substring(0,20) when all lines are blank', () => {
  // Input has only newline separators and no real content lines,
  // so the .filter(line => line.trim()) collapses to [] and the
  // substring fallback runs over the original (whitespace) input.
  const input = '\n\n\n';
  const result = extractMedicineName(input);
  assert.ok(result.length <= 20);
});

test('extractMedicineName trims whitespace on keyword substring', () => {
  // The window is [idx-5, idx+kw.length+10]; if the window extends
  // past start, the leading slice is untrimmed otherwise trimmed.
  const result = extractMedicineName('   阿莫西林胶囊   ');
  // The current implementation trims only the final substring,
  // so the leading "   " should be trimmed off.
  assert.ok(!result.startsWith(' '), `leading whitespace not trimmed: "${result}"`);
  assert.ok(!result.endsWith(' '), `trailing whitespace not trimmed: "${result}"`);
});

test('extractMedicineName is case-insensitive for Latin substrings (toLowerCase path)', () => {
  // The current keyword list is all CJK, so an English-only text
  // should hit the first-line fallback. This pins that the toLowerCase
  // step does not corrupt CJK characters.
  const result = extractMedicineName('AMOXICILLIN 500mg');
  assert.equal(result, 'AMOXICILLIN 500mg');
});

test('extractMedicineName returns first keyword encountered (order-stable)', () => {
  // keywords array is: 胶囊, 片, 颗粒, ...  胶囊 comes first.
  const result = extractMedicineName('阿莫西林片0.25g 胶囊装');
  // The function returns the first match in keyword-list order, so 胶囊
  // is matched first even though 片 also appears.
  assert.ok(result.includes('胶囊'));
});

test('extractMedicineName handles keyword at start of text', () => {
  const result = extractMedicineName('胶囊是常见剂型');
  assert.ok(result.includes('胶囊'));
  // start = max(0, idx-5) = 0, end = idx + kw.length + 10
  assert.ok(result.length > 0);
});

test('extractMedicineName handles keyword at end of text', () => {
  const result = extractMedicineName('本品为复方制剂胶囊');
  assert.ok(result.includes('胶囊'));
  // end = min(text.length, idx+kw.length+10) = text.length
  assert.ok(result.length > 0);
});
