// tests/utils/ocr.test.js
// Unit tests for the pure extractMedicineName helper in utils/ocr.js.
// The function is the only wx-free, branching logic in the OCR layer
// and is on the hot path of pages/add/add.js (拍照识别 -> 提取药名).
// We exercise boundary cases that materially affect what users see
// after a successful OCR scan: empty input, context-window clipping,
// start/end edges, multi-line fallback, and first-match-wins ordering.
//
// Contract (verified by inspection of utils/ocr.js:128-138):
//   For the FIRST keyword from the table that appears in the lowercased
//   text, the function returns
//     text.substring(max(0, idx-8), min(text.length, idx+kw.length+10)).trim()
//   If no keyword matches, the function returns
//     text.split('\n')[0].trim().substring(0, 30)
//   (note: this fallback does NOT skip blank leading lines).
//
// Test strategy: we only assert behavior we can verify without depending
// on the internal keyword table. Where the keyword is the FIRST in the
// OCR table ('胶囊'), we can assert exact substrings. For everything else
// we use property-style assertions (window width, includes-keyword,
// no-fabricated-chars, no-leading/trailing-whitespace).

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { extractMedicineName } = require('../../utils/ocr.js');

// '胶囊' is the first keyword in utils/ocr.js keyword table. Any input
// containing it will be matched by it (no earlier entry exists).
const FIRST_KW = '胶囊';

test('extractMedicineName: empty / falsy input returns empty string', () => {
  assert.equal(extractMedicineName(''), '');
  assert.equal(extractMedicineName(null), '');
  assert.equal(extractMedicineName(undefined), '');
});

test('extractMedicineName: returns the exact -8/+10 window around the matched keyword', () => {
  // ASCII-only prefix and suffix so character counts are unambiguous.
  // 'prefix' is 8 ASCII chars, '胶囊' is 2 CJK chars, 'suffix' is N ASCII
  // chars. We intentionally make the input long enough that BOTH
  // boundaries are non-clamping: start = idx-8, end = idx+kw.length+10.
  const text = 'prefix' + FIRST_KW + 'A'.repeat(20);
  const idx = text.indexOf(FIRST_KW);
  const expected = text.substring(
    Math.max(0, idx - 8),
    Math.min(text.length, idx + FIRST_KW.length + 10),
  ).trim();
  const out = extractMedicineName(text);
  assert.equal(out, expected);
  // Sanity: the full window should be in the text and contain the keyword.
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
  // Output length must be at most 8 (back) + kw.length.
  assert.ok(out.length <= 8 + FIRST_KW.length,
    `expected length <= ${8 + FIRST_KW.length}, got ${out.length}: ${out}`);
});

test('extractMedicineName: window is never wider than kw.length+8+10', () => {
  // '阿莫西林' is 4 chars -> max window width = 4 + 8 + 10 = 22.
  const KW = '阿莫西林';
  assert.equal(KW.length, 4, 'fixture assumption: 阿莫西林 is 4 chars');
  const text = 'X'.repeat(100) + KW + 'Y'.repeat(100);
  const out = extractMedicineName(text);
  assert.ok(out.length <= KW.length + 8 + 10,
    `window must be <= kw.length+8+10 (${KW.length + 8 + 10}), ` +
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

test('extractMedicineName: multi-line input with NO matching keyword falls back to first line, max 30 chars', () => {
  // None of the keyword tokens appear in this text.
  // Specifically, even '片' (a 1-char keyword) is not present.
  // 复方甘草合剂, 规格, 厂家, 用法, 口服 — none match.
  const text = '复方甘草合剂\n规格: 0.3g\n厂家: 某药厂\n用法: 口服';
  const out = extractMedicineName(text);
  assert.equal(out, '复方甘草合剂');
});

test('extractMedicineName: single-line fallback is truncated to 30 chars when no keyword matches', () => {
  // Ensure no character in this string is a keyword.
  // Keywords include single chars like '片' — be careful with fixtures.
  // 调养身心 食疗养生 健康生活 运动锻炼... (none of these contain 片/胶囊/etc.)
  // To be safe, build a string from a-zA-Z0-9 (Latin alphanumerics) and
  // full-width Chinese that does NOT intersect the keyword table.
  // Simpler: explicitly avoid every keyword. Just use a sufficiently long
  // string of safe Chinese characters.
  const safe = '复方甘草合剂健康调理食疗养生跑步锻炼身体调养身心愉悦延年益寿安心养神';
  assert.ok(safe.length > 30, `fixture must be longer than 30 chars, got ${safe.length}`);
  // Verify it does not match any keyword.
  const keywords = [
    '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆',
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素', '罗红霉素',
    '感冒灵', '感冒清热', '板蓝根', '双黄连', '莲花清瘟',
    '维生素', '钙片', '铁剂', '锌', '叶酸',
    '奥美拉唑', '兰索拉唑', '泮托拉唑',
    '硝苯地平', '氨氯地平', '贝那普利',
    '二甲双胍', '格列本脲', '胰岛素',
    '阿司匹林', '氯吡格雷', '他汀',
    '氯雷他定', '西替利嗪', '蒙脱石',
    '止咳', '祛痰', '平喘', '消炎', '退烧', '止痛',
  ];
  for (const kw of keywords) {
    assert.ok(!safe.includes(kw), `fixture must not contain keyword ${kw}`);
  }
  const out = extractMedicineName(safe);
  assert.ok(out.length <= 30, `expected <=30 chars, got ${out.length}: ${out}`);
  assert.equal(out, safe.substring(0, 30).trim());
});

test('extractMedicineName: fallback uses first chunk (does NOT skip blank leading lines) - documented behavior', () => {
  // This implementation does not filter blank lines from the fallback,
  // so a leading '\n' produces an empty first chunk and an empty return.
  // The test pins down the actual behavior so a future refactor that
  // DOES add blank-line skipping (like utils/baidu-ocr.js does) shows up
  // as an intentional change.
  const text = '\n   \n复方甘草合剂 一盒\n其他内容';
  const out = extractMedicineName(text);
  assert.equal(out, '',
    `utils/ocr.js fallback currently does not skip blank lines; got: ${out}`);
});

test('extractMedicineName: result is deterministic across repeated calls', () => {
  const text = '阿奇霉素 0.5g 消炎药';
  const first = extractMedicineName(text);
  const second = extractMedicineName(text);
  assert.equal(first, second);
});

test('extractMedicineName: substring window is trimmed (no leading/trailing whitespace)', () => {
  // '头孢' and '胶囊' are both in the keyword table; either is a valid
  // first match for this input.
  const text = '   头孢克肟   胶囊   0.1g';
  const out = extractMedicineName(text);
  assert.equal(out.startsWith(' '), false,
    `expected no leading whitespace, got: ${JSON.stringify(out)}`);
  assert.equal(out.endsWith(' '), false,
    `expected no trailing whitespace, got: ${JSON.stringify(out)}`);
  assert.ok(out.includes('头孢') || out.includes('胶囊'),
    `expected a keyword in the trimmed window, got: ${out}`);
});

test('extractMedicineName: result is always a substring of the input', () => {
  // Property-style guard: regardless of branch taken, the function never
  // invents characters. This is the strongest single regression guard we
  // can write without copying the keyword table.
  const samples = [
    '   头孢克肟   胶囊   0.1g',
    'prefix' + FIRST_KW + 'A'.repeat(20),
    'A'.repeat(100) + FIRST_KW,
    '复方甘草合剂\n规格: 0.3g\n厂家: 某药厂\n用法: 口服',
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
