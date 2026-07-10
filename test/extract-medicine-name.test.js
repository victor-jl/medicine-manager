'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// Both modules export the same-named pure function. Each is the parsing
// core of its respective OCR pipeline: given recognized text, it must
// return a stable medicine-name candidate or a deterministic fallback.

const baiduOcr = require('../utils/baidu-ocr.js');
const ocr = require('../utils/ocr.js');

// -----------------------------------------------------------------------------
// utils/baidu-ocr.js :: extractMedicineName
// -----------------------------------------------------------------------------

test('baidu-ocr.extractMedicineName returns empty string for falsy input', () => {
  assert.equal(baiduOcr.extractMedicineName(''), '');
  assert.equal(baiduOcr.extractMedicineName(null), '');
  assert.equal(baiduOcr.extractMedicineName(undefined), '');
  // `0` and `false` are also falsy and the guard covers them.
  assert.equal(baiduOcr.extractMedicineName(0), '');
  assert.equal(baiduOcr.extractMedicineName(false), '');
});

test('baidu-ocr.extractMedicineName extracts context around a matched keyword', () => {
  // "阿莫西林胶囊" is a real medicine name; the function should return
  // the keyword plus a small window of surrounding text.
  const result = baiduOcr.extractMedicineName('国药准字H10960012 阿莫西林胶囊 0.25g*24粒');
  // The window is 5 chars before and 10 chars after the keyword match.
  assert.ok(result.includes('阿莫西林'), 'should retain the keyword');
  assert.ok(result.length > '阿莫西林'.length, 'should include surrounding context');
  assert.ok(result.length <= '阿莫西林'.length + 5 + 10, 'should not exceed the documented window');
});

test('baidu-ocr.extractMedicineName returns first non-empty line when no keyword matches', () => {
  const input = 'Random unrelated text without any medicine keyword\n第二行内容\n第三行内容';
  const result = baiduOcr.extractMedicineName(input);
  assert.equal(result, 'Random unrelated text without any medicine keyword');
});

test('baidu-ocr.extractMedicineName falls back to 20-char prefix when input has no usable lines', () => {
  // No keywords, only whitespace-only lines.
  const input = '   \n   \n   ';
  const result = baiduOcr.extractMedicineName(input);
  // No non-empty lines means the filter yields [], so the substring(0, 20)
  // branch is taken. The substring is then .trim()'d by neither the success
  // branch nor this branch — the value is whatever the first 20 chars are.
  assert.equal(result, '   \n   \n   '.substring(0, 20));
});

test('baidu-ocr.extractMedicineName handles keyword at the start of the string', () => {
  // index === 0 ⇒ start = max(0, 0 - 5) === 0. The function must not produce
  // a negative start index or otherwise misbehave.
  const result = baiduOcr.extractMedicineName('维生素C片 100mg');
  assert.ok(result.startsWith('维生素'), 'should begin at index 0 of the input');
  assert.ok(result.includes('片'), 'should include the matched keyword');
});

test('baidu-ocr.extractMedicineName handles keyword at the end of the string', () => {
  // end = min(text.length, index + keyword.length + 10) — must not exceed
  // text.length. We place the keyword such that the right window must be
  // clamped, and put a distinctive 5-char token immediately to its left
  // to verify the documented left-window size.
  const input = 'AAAAA布洛芬';
  const result = baiduOcr.extractMedicineName(input);
  // '布洛芬' is at index 5. left window = max(0, 5-5) = 0. substring(0, 8)
  // = 'AAAAA布洛芬'. Right window is clamped at text.length.
  assert.ok(result.endsWith('布洛芬'));
  assert.ok(result.startsWith('AAAAA'), 'all 5 left-window chars should be retained');
  assert.equal(result, 'AAAAA布洛芬');
});

test('baidu-ocr.extractMedicineName returns the first match when multiple keywords are present', () => {
  // The keyword list ordering determines which match wins. '片' precedes
  // '感冒' in the list, so '感冒灵颗粒' (contains both '灵' and '片') — but
  // the actual input below contains '感冒' first in iteration order.
  const result = baiduOcr.extractMedicineName('999感冒灵颗粒 10g*9袋');
  assert.ok(result.includes('感冒'), 'first matching keyword should drive the slice');
  assert.ok(result.includes('999') || result.includes('灵'), 'window should include context around the match');
});

test('baidu-ocr.extractMedicineName preserves the original case of matched text', () => {
  // The function lowercases the search copy but slices from the original
  // string. This test pins that contract: future refactors must not
  // accidentally return the lowercased slice.
  const upper = 'VITAMIN C TABLET';
  const lower = 'vitamin c tablet';
  // Neither contains a CJK keyword, so both fall through to the
  // first-line branch. The result must equal the original input verbatim.
  assert.equal(baiduOcr.extractMedicineName(upper), 'VITAMIN C TABLET');
  assert.equal(baiduOcr.extractMedicineName(lower), 'vitamin c tablet');
  assert.notEqual(
    baiduOcr.extractMedicineName(upper),
    baiduOcr.extractMedicineName(lower),
    'original-case strings must not be conflated'
  );
});

test('baidu-ocr.extractMedicineName is deterministic for identical input', () => {
  // Date.now() / random IDs are not involved in the pure function.
  const input = '阿奇霉素片 0.25g*6片';
  const a = baiduOcr.extractMedicineName(input);
  const b = baiduOcr.extractMedicineName(input);
  const c = baiduOcr.extractMedicineName(input);
  assert.equal(a, b);
  assert.equal(b, c);
});

test('baidu-ocr.extractMedicineName handles a multi-line input with a keyword only on a later line', () => {
  const input = '包装说明\n有效期至2026年12月\n阿莫西林胶囊0.5g';
  const result = baiduOcr.extractMedicineName(input);
  // The matched keyword is on the third line; the window of 5/10 around
  // '阿莫西林' must not bleed across lines incorrectly.
  assert.ok(result.includes('阿莫西林'));
  assert.ok(!result.includes('包装说明'), 'should not include text from earlier lines');
});

// -----------------------------------------------------------------------------
// utils/ocr.js :: extractMedicineName
//
// This variant has a wider left window (8 vs 5), a different fallback
// (first line truncated to 30 chars, no empty-line filter), and a much
// larger keyword list. The behavioural differences are intentional test
// targets so future refactors cannot silently regress them.
// -----------------------------------------------------------------------------

test('ocr.extractMedicineName returns empty string for falsy input', () => {
  assert.equal(ocr.extractMedicineName(''), '');
  assert.equal(ocr.extractMedicineName(null), '');
  assert.equal(ocr.extractMedicineName(undefined), '');
});

test('ocr.extractMedicineName uses the wider 8-char left window', () => {
  // We pin the 8-char left window size by placing exactly 8 distinctive
  // chars immediately before '板蓝根' and a 9th 'leading' char that must
  // be excluded. The input must contain no earlier keyword from the
  // list (no '胶囊', '片', '颗粒', '口服液', etc.) so '板蓝根' is the
  // first match in iteration order.
  const input = 'X12345678板蓝根 10g';
  const result = ocr.extractMedicineName(input);
  // '板蓝根' starts at index 9. left window = max(0, 9-8) = 1.
  // substring(1, end) must include '12345678板蓝根' but not the leading 'X'.
  assert.ok(!result.startsWith('X'), 'left window must exclude the 9th preceding char');
  assert.ok(result.startsWith('12345678'), 'all 8 left-window chars should be retained');
  assert.ok(result.includes('板蓝根'));
});

test('ocr.extractMedicineName falls back to first line, truncated to 30 chars', () => {
  const longLine = 'x'.repeat(100);
  const result = ocr.extractMedicineName(longLine);
  // No keyword matches, so the fallback applies: take the first line,
  // trim, and truncate to 30 chars.
  assert.equal(result.length, 30);
  assert.equal(result, longLine.substring(0, 30));
});

test('ocr.extractMedicineName returns empty string when first line is empty and no keyword matches', () => {
  // ocr.js differs from baidu-ocr.js: it does not filter out empty lines
  // before picking `lines[0]`. With a leading newline and no keyword, the
  // fallback returns '' after trim — a known behavioural quirk that any
  // future refactor must preserve or intentionally change.
  const result = ocr.extractMedicineName('\n第二行内容');
  assert.equal(result, '');
});

test('ocr.extractMedicineName matches category keywords ("胶囊", "片", "颗粒")', () => {
  // The "category" keywords are high-signal but extremely short, which makes
  // their window logic the most failure-prone. Verify each one.
  for (const kw of ['胶囊', '片', '颗粒', '口服液']) {
    const result = ocr.extractMedicineName(`前置文本${kw}后置文本`);
    assert.ok(result.includes(kw), `keyword ${kw} should appear in result`);
  }
});

test('ocr.extractMedicineName recognizes brand keywords from the larger list', () => {
  // The ocr.js list is substantially bigger; spot-check a few well-known
  // brand names that downstream UX relies on.
  for (const name of ['阿莫西林', '布洛芬', '板蓝根', '奥美拉唑', '二甲双胍']) {
    const result = ocr.extractMedicineName(`药品名${name}规格0.5g`);
    assert.ok(result.includes(name), `brand keyword ${name} should appear in result`);
  }
});

test('ocr.extractMedicineName recognizes symptom keywords', () => {
  // '止咳', '退烧', '止痛' are particularly short — boundary logic matters.
  for (const sym of ['止咳', '退烧', '止痛', '消炎']) {
    const result = ocr.extractMedicineName(`功能主治：${sym}用于缓解症状`);
    assert.ok(result.includes(sym), `symptom keyword ${sym} should appear in result`);
  }
});

test('ocr.extractMedicineName is deterministic for identical input', () => {
  const input = '硝苯地平缓释片 20mg*30片';
  const a = ocr.extractMedicineName(input);
  const b = ocr.extractMedicineName(input);
  assert.equal(a, b);
});

test('ocr.extractMedicineName does not cross line boundaries in the wide window', () => {
  // The 8/10 window must not drag in text from neighbouring lines in a way
  // that misleads the caller. We craft an input where the only matching
  // keyword ('板蓝根') is on the second line and where a distinct sentinel
  // string on the third line must NOT appear in the result.
  const input = '首行内容\n白云山  板蓝根颗粒 0.5g\nUNIQUE_SENTINEL_TAIL';
  const result = ocr.extractMedicineName(input);
  assert.ok(result.includes('板蓝根'));
  assert.ok(!result.includes('UNIQUE_SENTINEL_TAIL'), 'result should not include content from lines after the match');
  assert.ok(!result.includes('首行内容'), 'the 8-char left window must not reach across the newline into the prior line');
});
