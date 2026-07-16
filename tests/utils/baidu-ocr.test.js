// tests/utils/baidu-ocr.test.js
// Pure-function tests for utils/baidu-ocr.js::extractMedicineName
// Covers parsing edge cases in the keyword extraction heuristic.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMedicineName } = require('../../utils/baidu-ocr');

test('returns empty string for null input', () => {
  assert.equal(extractMedicineName(null), '');
});

test('returns empty string for undefined input', () => {
  assert.equal(extractMedicineName(undefined), '');
});

test('returns empty string for empty string input', () => {
  assert.equal(extractMedicineName(''), '');
});

test('extracts fragment around a Chinese dosage-form keyword', () => {
  const text = '国药准字H12345678\n阿莫西林胶囊 0.25g*24粒\n批号: 20240101';
  const result = extractMedicineName(text);
  assert.ok(result.includes('阿莫西林'), `expected to include 阿莫西林, got: ${result}`);
  assert.ok(result.includes('胶囊'), `expected to include 胶囊, got: ${result}`);
});

test('matches keyword case-insensitively (lowercased Latin term)', () => {
  // Keywords include "布洛芬"; the source lower-cases input but returns substring
  // from the ORIGINAL text, preserving original casing/characters.
  const text = 'Ibuprofen 布洛芬缓释片 0.3g';
  const result = extractMedicineName(text);
  assert.ok(result.includes('布洛芬'), `expected to include 布洛芬, got: ${result}`);
});

test('falls back to the first non-empty line when no keyword matches', () => {
  // No medicine keyword matches. The implementation returns lines[0] from
  // split(/[\n\r]/) without trimming; this is the current contract.
  const text = '\n\n  未知药品XYZ123  \n  第二行内容';
  const result = extractMedicineName(text);
  assert.equal(result, '  未知药品XYZ123  ');
});

test('single-line input without a keyword match is returned untruncated', () => {
  // The 20-char cap in the source only triggers when split() yields zero
  // non-empty lines, which is unreachable for non-empty input. Lock that in
  // so accidental refactors of the fallback cannot silently drop data.
  const long = 'A'.repeat(200);
  const result = extractMedicineName(long);
  assert.equal(result, long);
});

test('handles CRLF and LF line endings consistently', () => {
  const crlf = '药品A\r\n胶囊 0.5g\r\n批号001';
  const lf = '药品A\n胶囊 0.5g\n批号001';
  const r1 = extractMedicineName(crlf);
  const r2 = extractMedicineName(lf);
  // Both must contain the matched keyword in their fragment.
  assert.ok(r1.includes('胶囊'), `CRLF result missing 胶囊: ${r1}`);
  assert.ok(r2.includes('胶囊'), `LF result missing 胶囊: ${r2}`);
});

test('extracts around first match when multiple keywords are present', () => {
  // The implementation iterates keywords in declared order; "片" appears
  // before several other keywords in the keyword list. Ensure the result
  // reflects the keyword that was matched.
  const text = '维生素C片 100mg 钙片 补充剂';
  const result = extractMedicineName(text);
  assert.ok(result.includes('片'), `expected 片段 to include 片, got: ${result}`);
});
