// Tests for utils/baidu-ocr.js → extractMedicineName
// Covers the medicine-name extraction heuristic: keyword matching,
// case-insensitive lookup, context window, and the no-keyword fallback.

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMedicineName } = require('../utils/baidu-ocr');

test('extractMedicineName: returns empty string for falsy input', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extractMedicineName: returns context window when keyword appears mid-text', () => {
  // Keyword "阿莫西林" lives in the middle of the recognized text; the
  // implementation grabs up to 5 chars before and 10 after the matched
  // keyword. The first keyword in the priority list that hits is the
  // one returned — here "胶囊" (capsule) hits at index 15.
  const text = '国药准字H12345678 阿莫西林胶囊 0.25g*24粒';
  const result = extractMedicineName(text);
  assert.ok(result.includes('阿莫西林'), `result was: ${result}`);
  assert.ok(result.includes('胶囊'), `result was: ${result}`);
  // The result must not be the whole string — the implementation
  // discards the leading 10 chars ("国药准字H1234") as out-of-window.
  assert.ok(!result.startsWith('国药准字'), `result was: ${result}`);
});

test('extractMedicineName: clips window at start of text', () => {
  // Keyword at the very beginning: start index would be negative, so
  // we must clamp to 0 and not throw.
  const text = '阿莫西林胶囊0.25g';
  const result = extractMedicineName(text);
  assert.equal(result, '阿莫西林胶囊0.25g');
});

test('extractMedicineName: keyword near the end still returns a window', () => {
  const text = '本品为感冒灵颗粒';
  const result = extractMedicineName(text);
  assert.ok(result.includes('颗粒'), `result was: ${result}`);
});

test('extractMedicineName: matches first keyword in priority order', () => {
  // "片" is shorter and appears later in the keyword list, but the
  // function returns on the FIRST match, so the longer one ("阿莫西林")
  // wins.
  const text = '国药准字H12345 阿莫西林片 24片装';
  const result = extractMedicineName(text);
  assert.ok(result.includes('阿莫西林'), `result was: ${result}`);
});

test('extractMedicineName: case-insensitive match on the lowercased text', () => {
  // The implementation lowercases the input before indexOf, so English
  // keywords should still match when the input is uppercase.
  // (Current keyword list has no English entries, so this verifies the
  // lowercase branch is taken without crashing and falls back.)
  const text = 'AMOXICILLIN 500MG';
  const result = extractMedicineName(text);
  // No Chinese keyword present → falls through to the "first line" branch.
  assert.equal(result, 'AMOXICILLIN 500MG');
});

test('extractMedicineName: returns first non-empty line when no keyword matches', () => {
  const text = '第一行内容\n第二行内容\n第三行内容';
  const result = extractMedicineName(text);
  assert.equal(result, '第一行内容');
});

test('extractMedicineName: trims whitespace from the extracted window', () => {
  const text = '  阿莫西林胶囊  ';
  const result = extractMedicineName(text);
  assert.equal(result, '阿莫西林胶囊');
});

test('extractMedicineName: handles CR/LF line endings in the fallback', () => {
  // Lines split on /[\n\r]/ — the first non-empty line should win.
  const text = '口服溶液\r\n规格：10ml\r\n厂家：某某制药';
  const result = extractMedicineName(text);
  assert.equal(result, '口服溶液');
});

test('extractMedicineName: when input is whitespace-only, substring(0,20) fallback fires', () => {
  // All-whitespace input → split() yields whitespace-only lines, the
  // filter(line => line.trim()) drops them, and the function falls
  // through to substring(0, 20).
  const text = '   \n   \n   ';
  const result = extractMedicineName(text);
  assert.equal(result, text.substring(0, 20));
});
