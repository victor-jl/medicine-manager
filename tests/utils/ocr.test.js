// tests/utils/ocr.test.js
// Unit tests for utils/ocr.js#extractMedicineName. This variant has a
// larger keyword list and truncates the first-line fallback to 30
// characters (unlike baidu-ocr's 20-char substring-on-empty fallback).

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractMedicineName } = require('../../utils/ocr');

test('extractMedicineName returns "" for empty input', () => {
  assert.equal(extractMedicineName(''), '');
});

test('extractMedicineName returns "" for null/undefined', () => {
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extractMedicineName matches the wider keyword set (氨氯地平)', () => {
  const result = extractMedicineName('苯磺酸氨氯地平片5mg');
  assert.ok(result.includes('氨氯地平'));
});

test('extractMedicineName matches diabetes keyword (二甲双胍)', () => {
  const result = extractMedicineName('盐酸二甲双胍片 0.5g');
  assert.ok(result.includes('二甲双胍'));
});

test('extractMedicineName matches proton-pump inhibitor (奥美拉唑)', () => {
  const result = extractMedicineName('奥美拉唑肠溶胶囊20mg');
  assert.ok(result.includes('奥美拉唑'));
});

test('extractMedicineName returns first line trimmed when no keyword matches', () => {
  const result = extractMedicineName('Unknown Drug XYZ\nSecond line\nThird');
  assert.equal(result, 'Unknown Drug XYZ');
});

test('extractMedicineName truncates long single-line fallback to 30 characters', () => {
  const long = 'a'.repeat(100);
  const result = extractMedicineName(long);
  assert.equal(result.length, 30, 'first-line fallback must be truncated to 30 chars');
  assert.equal(result, 'a'.repeat(30));
});

test('extractMedicineName does NOT truncate when keyword matches', () => {
  // When a keyword matches, the window is [idx-8, idx+kw.length+10].
  // Verify the surrounding context is preserved (no 30-char cap
  // applied to keyword paths).
  const input = '前缀-前缀-前缀-阿莫西林胶囊后缀-后缀-后缀';
  const result = extractMedicineName(input);
  assert.ok(result.includes('阿莫西林胶囊'));
  // Window size cap is 8 + 4 + 10 = 22
  assert.ok(result.length <= 22, `keyword window unexpectedly large: ${result.length}`);
});

test('extractMedicineName trims a whitespace-padded first line', () => {
  const result = extractMedicineName('   名称XYZ   \nSecond');
  assert.equal(result, '名称XYZ');
});

test('extractMedicineName handles whitespace-only first line', () => {
  // split('\n')[0].trim() yields '' for a whitespace-only first line.
  // This pins current behavior (returns '') so future refactors notice.
  const result = extractMedicineName('   \nRealContent');
  assert.equal(result, '');
});

test('extractMedicineName does NOT split on \\r (no \\n present)', () => {
  // ocr.js splits on '\n' only, so '\r' stays in the first "line"
  // and no truncation/splitting happens. This pins current behavior.
  const result = extractMedicineName('FirstLine\rSecondLine');
  assert.equal(result, 'FirstLine\rSecondLine');
});

test('extractMedicineName keyword window is clamped at the start (idx-8 floor 0)', () => {
  // '胶囊' at position 1: window starts at max(0, 1-8)=0, so the
  // returned substring begins at index 0.
  const result = extractMedicineName('x胶囊ABCDEFGHIJKLMNOP');
  assert.equal(result.charAt(0), 'x');
  assert.ok(result.includes('胶囊'));
});

test('extractMedicineName keyword window is clamped at the end', () => {
  // '胶囊' near the end: window ends at min(text.length, idx+kw.length+10).
  const result = extractMedicineName('PREFIX胶囊END');
  assert.ok(result.includes('胶囊'));
  assert.ok(result.length <= 'PREFIX胶囊END'.length);
});
