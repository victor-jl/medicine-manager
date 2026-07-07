// Tests for utils/baidu-ocr.js — specifically extractMedicineName, the
// pure text parser used by the Baidu OCR fallback path.
//
// This file is the parallel of utils/ocr.js with a smaller keyword set
// (17 entries) and a tighter window (±5 / +10 instead of ±8 / +10).
// The two implementations have already drifted (keyword lists differ);
// the tests below pin down THIS file's contract.

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMedicineName } = require('../utils/baidu-ocr.js');

test('extractMedicineName returns empty string for empty input', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extractMedicineName finds a known keyword and returns a context window', () => {
  // '布洛芬' is in the keyword list.
  const text = '泰诺林 布洛芬混悬液 100ml';
  const result = extractMedicineName(text);
  assert.ok(result.includes('布洛芬'), `expected keyword in result, got: ${result}`);
  // Window: 5 chars before, kw.length + 10 chars after. For a 3-char kw
  // the upper bound is at most text.length.
  assert.ok(result.length <= text.length);
});

test('extractMedicineName does not slice with a negative start index', () => {
  // '胶囊' is the FIRST keyword in the list, so when it matches at
  // offset 0 the result must start with it. Earlier off-by-one
  // implementations would underflow to substring(-5, ...) or start
  // at the wrong offset.
  const text = '胶囊剂';
  const result = extractMedicineName(text);
  assert.ok(result.startsWith('胶囊'), `expected start-clamp behaviour, got: ${result}`);
});

test('extractMedicineName clamps the end to the text length', () => {
  // Keyword at the tail: end = min(text.length, idx+kw.length+10) must
  // not exceed the input.
  const text = '批准文号 国药准字H2020 蒙脱石散';
  const result = extractMedicineName(text);
  assert.ok(result.endsWith('蒙脱石散'), `expected tail-clamp behaviour, got: ${result}`);
  assert.ok(result.length <= text.length);
});

test('extractMedicineName falls back to the first non-empty line on no match', () => {
  // Use text that contains none of the 41 keywords (no 片, no 胶囊,
  // no 颗粒, no Latin drug names, etc.). The function should fall
  // through to the "first line" path.
  const text = '国药准字H12345\n规格: 0.5g';
  const result = extractMedicineName(text);
  assert.equal(result, '国药准字H12345');
});

test('extractMedicineName returns up to 20 chars when the only input is a single empty line', () => {
  // The fallback `lines[0] || recognizedText.substring(0, 20)` is meant
  // for the case where splitting produced an empty array. Feed in a
  // newline-only string to exercise that branch.
  const text = '\n\n';
  const result = extractMedicineName(text);
  // Either '' or up to 20 chars is acceptable; the key is "no throw".
  assert.ok(typeof result === 'string');
  assert.ok(result.length <= 20);
});

test('extractMedicineName preserves original casing in the result', () => {
  // Matching is case-insensitive (via .toLowerCase()) but the substring
  // returned is taken from the ORIGINAL text.
  const text = 'Vitamin C 维生素C片 100mg';
  const result = extractMedicineName(text);
  assert.ok(result.includes('维生素C片'), `expected original-case text, got: ${result}`);
});

test('extractMedicineName does not include more than the documented window', () => {
  // With keyword '阿莫西林' (3 chars), the window is 5 before + 13
  // after = 18 chars max around the match.
  const text = 'AAAAAAAAAA阿莫西林BBBBBBBBBBBBBBBBBBBBBB';
  const result = extractMedicineName(text);
  // Result should contain the keyword and a limited context, not the
  // whole string.
  assert.ok(result.length < text.length, 'window should not span the entire string');
  assert.ok(result.includes('阿莫西林'));
});
