// tests/utils/ocr.test.js
// Pure-function tests for utils/ocr.js::extractMedicineName.
// This is the function actually used by pages/add/add.js for OCR parsing.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMedicineName } = require('../../utils/ocr');

test('returns empty string for falsy input', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extracts fragment around 胶囊 keyword', () => {
  const text = '国药准字H10960012\n阿莫西林胶囊 0.25g*24粒\n\n';
  const result = extractMedicineName(text);
  assert.ok(result.includes('阿莫西林'), `expected 阿莫西林, got: ${result}`);
  assert.ok(result.includes('胶囊'), `expected 胶囊, got: ${result}`);
});

test('matches chronic-disease keywords (e.g. 二甲双胍)', () => {
  const text = '盐酸二甲双胍片 0.5g 薄膜衣片';
  const result = extractMedicineName(text);
  assert.ok(result.includes('二甲双胍'), `expected 二甲双胍, got: ${result}`);
});

test('falls back to first line and truncates to 30 characters', () => {
  // No keyword matches; the function returns the first line, trimmed and
  // capped at 30 characters.
  const text = 'A'.repeat(100) + '\n下一行内容';
  const result = extractMedicineName(text);
  assert.equal(result.length, 30);
  assert.equal(result, 'A'.repeat(30));
});

test('first-line fallback trims surrounding whitespace', () => {
  // Note: this ocr.js fallback DOES trim() the first line — different from
  // baidu-ocr.js. Lock in the contract so the two implementations don't
  // accidentally diverge.
  const text = '   未知药品XYZ   \n下一行';
  const result = extractMedicineName(text);
  assert.equal(result, '未知药品XYZ');
});

test('returns empty string for whitespace-only input', () => {
  // The fallback uses split('\n') which on a whitespace-only string yields
  // [''] -> trimmed to '' -> substring(0,30) -> ''.
  assert.equal(extractMedicineName('   \n   '), '');
});

test('keyword window includes up to 8 chars before and 10 after the match', () => {
  // Avoid "片"/"颗粒" etc. so the *first* matched keyword is the intended one.
  const text = 'XXXXXXXXXX对乙酰氨基酚YYYYYYYYYY';
  const result = extractMedicineName(text);
  // 对乙酰氨基酚 (6 chars) at idx=10, start=2, end=10+6+10=26
  assert.equal(result.length, 24);
  assert.ok(result.startsWith('XXXXXXXX对乙酰氨基酚'), `unexpected start: ${result}`);
  assert.ok(result.endsWith('YYYYYYYYYY'), `unexpected end: ${result}`);
});
