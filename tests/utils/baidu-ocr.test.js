// tests/utils/baidu-ocr.test.js
// Unit tests for the pure extractMedicineName helper in utils/baidu-ocr.js.
// This is the production-default OCR path (used by pages/add/add.js doIdentify).
// The two extractMedicineName implementations in this repo are NOT identical
// (different keyword lists, different context windows, different fallback
// truncation), so we test this one independently.
//
// Contract (verified by inspection of utils/baidu-ocr.js:101-128):
//   For the FIRST keyword from the table that appears in the lowercased
//   text, the function returns
//     recognizedText.substring(max(0, idx-5), min(text.length, idx+kw.length+10)).trim()
//   If no keyword matches, the function returns the first non-empty line
//   (filtering whitespace-only lines) or, if none, the first 20 chars.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMedicineName } = require('../../utils/baidu-ocr.js');

// '胶囊' is the first keyword in utils/baidu-ocr.js keyword table. Any
// input containing it will be matched by it (no earlier entry exists).
const FIRST_KW = '胶囊';

test('extractMedicineName: empty / falsy input returns empty string', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extractMedicineName: returns the exact -5/+10 window around the matched keyword', () => {
  const text = 'prefix' + FIRST_KW + 'A'.repeat(20);
  const idx = text.indexOf(FIRST_KW);
  const expected = text.substring(
    Math.max(0, idx - 5),
    Math.min(text.length, idx + FIRST_KW.length + 10),
  ).trim();
  const out = extractMedicineName(text);
  assert.equal(out, expected);
  assert.ok(out.includes(FIRST_KW),
    `expected keyword in output, got: ${out}`);
});

test('extractMedicineName: keyword at the start clamps start to 0', () => {
  // '胶囊' at index 0; suffix longer than the +10 forward window.
  const text = FIRST_KW + 'A'.repeat(20);
  const out = extractMedicineName(text);
  assert.ok(out.startsWith(FIRST_KW),
    `expected output anchored at index 0, got: ${out}`);
  // Output length must be at most kw.length + 10 (back is clamped to 0).
  assert.ok(out.length <= FIRST_KW.length + 10,
    `expected length <= ${FIRST_KW.length + 10}, got ${out.length}: ${out}`);
});

test('extractMedicineName: keyword near the end clamps end to text.length', () => {
  // Long prefix, keyword at the very end.
  const text = 'A'.repeat(100) + FIRST_KW;
  const out = extractMedicineName(text);
  assert.ok(out.endsWith(FIRST_KW),
    `expected output anchored at text.length, got: ${out}`);
  // Output length must be at most 5 (back) + kw.length.
  assert.ok(out.length <= 5 + FIRST_KW.length,
    `expected length <= ${5 + FIRST_KW.length}, got ${out.length}: ${out}`);
});

test('extractMedicineName: window is never wider than kw.length+5+10', () => {
  // '阿莫西林' is 4 chars -> max window width = 4 + 5 + 10 = 19.
  const KW = '阿莫西林';
  assert.equal(KW.length, 4, 'fixture assumption: 阿莫西林 is 4 chars');
  const text = 'X'.repeat(100) + KW + 'Y'.repeat(100);
  const out = extractMedicineName(text);
  assert.ok(out.length <= KW.length + 5 + 10,
    `window must be <= kw.length+5+10 (${KW.length + 5 + 10}), ` +
    `got len=${out.length}: ${out}`);
  assert.ok(out.includes(KW),
    `expected keyword in window, got: ${out}`);
});

test('extractMedicineName: window never exceeds text.length', () => {
  const text = FIRST_KW;
  const out = extractMedicineName(text);
  assert.equal(out, FIRST_KW);
  assert.ok(out.length <= text.length);
});

test('extractMedicineName: no keyword and no non-empty line falls back to first 20 chars', () => {
  // All whitespace lines -> filter strips them -> lines.length === 0
  // -> returns recognizedText.substring(0, 20)
  const text = '\n   \n\t\n';
  const out = extractMedicineName(text);
  assert.equal(typeof out, 'string');
  assert.ok(out.length <= 20);
});

test('extractMedicineName: single non-empty line with no keyword is returned verbatim (NO 30-char cap)', () => {
  // Note: this implementation does NOT cap the fallback at 30 chars
  // (only the ocr.js version does). This test pins down that divergence
  // so a future refactor cannot silently change the contract.
  // Use a string with NO keywords (verify by checking against the table).
  const safe = '某药品品牌非常非常长的没有命中任何关键词的产品名称超过二十个字符的字符串';
  // Sanity-check: no keyword should appear in the fixture.
  const keywords = [
    '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂',
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素',
    '感冒灵', '退烧', '消炎', '维生素', '钙片', '胃药',
    '血压', '血糖', '血脂', '感冒', '咳嗽', '腹泻',
  ];
  for (const kw of keywords) {
    assert.ok(!safe.includes(kw), `fixture must not contain keyword ${kw}`);
  }
  assert.ok(safe.length > 20, 'fixture must be longer than 20 chars');
  const out = extractMedicineName(safe);
  assert.equal(out, safe,
    `expected full un-truncated fallback, got: ${out}`);
});

test('extractMedicineName: substring window is trimmed (no leading/trailing whitespace)', () => {
  const text = '   头孢克肟   胶囊   0.1g';
  const out = extractMedicineName(text);
  assert.equal(out.startsWith(' '), false,
    `expected no leading whitespace, got: ${JSON.stringify(out)}`);
  assert.equal(out.endsWith(' '), false,
    `expected no trailing whitespace, got: ${JSON.stringify(out)}`);
  // '头孢' or '胶囊' must be present (either is a valid first match).
  assert.ok(out.includes('头孢') || out.includes('胶囊'),
    `expected a keyword in the trimmed window, got: ${out}`);
});

test('extractMedicineName: result is deterministic across repeated calls', () => {
  const text = '布洛芬片 0.2g 用于退烧';
  const first = extractMedicineName(text);
  const second = extractMedicineName(text);
  assert.equal(first, second);
});

test('extractMedicineName: handles mixed Latin/Chinese content without misalignment', () => {
  // The function lowercases the input then computes the keyword index on
  // the lowercased string but slices the ORIGINAL string. For pure
  // non-Latin content, toLowerCase() preserves length so alignment holds.
  // This test pins down that contract.
  const text = 'Rx: ' + FIRST_KW;
  const out = extractMedicineName(text);
  assert.ok(out.includes(FIRST_KW),
    `expected keyword aligned, got: ${out}`);
  // Output must not extend past text.length.
  assert.ok(out.length <= text.length,
    `output length ${out.length} exceeds input length ${text.length}: ${out}`);
});

test('extractMedicineName: result is always a substring of the input', () => {
  // Property-style guard: regardless of branch taken, the function never
  // invents characters. (The fallback may return substring(0,20) of the
  // input, which trivially satisfies this; we still keep the guard for
  // the keyword window branch.)
  const samples = [
    '   头孢克肟   胶囊   0.1g',
    'prefix' + FIRST_KW + 'A'.repeat(20),
    'A'.repeat(100) + FIRST_KW,
    '999感冒灵颗粒\n规格: 10g*9袋\n厂家: 华润三九',
  ];
  for (const text of samples) {
    const out = extractMedicineName(text);
    if (out.length === 0) continue;
    assert.equal(out, out.trim(),
      `output not trimmed for input ${JSON.stringify(text)}: ${JSON.stringify(out)}`);
    for (const ch of out) {
      if (/\s/.test(ch)) continue;
      assert.ok(text.includes(ch),
        `output contains char ${ch} not in input ${JSON.stringify(text)}`);
    }
  }
});
