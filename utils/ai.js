const FIELD_LABELS = ['药品名称', '通用名', '商品名', '有效期', '有效期至', '失效期', 'EXP',
  '规格', '包装规格', '生产厂家', '厂家', '生产企业', '制造商',
  '用法用量', '用法', '用量', '国药准字', '批准文号', '注册证号',
  '贮藏', '储存', '保存', '成份', '成分', '主要成份', '主要成分'];

function extractByPattern(text, patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      let raw = m[1].trim();
      const lines = raw.split(/\n/);
      const filtered = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const hasLabel = FIELD_LABELS.some(label =>
          trimmed.startsWith(label) || trimmed.includes(label + '：') || trimmed.includes(label + ':')
        );
        if (hasLabel && filtered.length > 0) break;
        filtered.push(trimmed);
      }
      return filtered.join('\n').trim();
    }
  }
  return '';
}

function analyzeMedicineInfo(text) {
  if (!text) {
    return {
      name: '',
      expiryDate: '',
      specification: '',
      manufacturer: '',
      usage: '',
      approvalNumber: '',
      storage: '',
      ingredients: ''
    };
  }

  const raw = text;

  const name = extractByPattern(raw, [
    /(?:药品名称|通用名|商品名)[：:\s]*([^\n\r]+)/,
    /([^\n\r]{2,20}(?:胶囊|片|颗粒|口服液|注射液|软膏|贴剂|滴眼液|糖浆))/
  ]) || raw.split(/[\n\r]/)[0].trim().substring(0, 30);

  const expiryDate = extractByPattern(raw, [
    /(?:有效期|有效期至|失效期|EXP)[：:\s]*([0-9]{4}[-/.年][0-9]{1,2}[-/.月]?[0-9]{0,2}日?)/i,
    /([0-9]{4}[-/.年][0-9]{1,2}[-/.月][0-9]{1,2}日?)/
  ]);

  const specification = extractByPattern(raw, [
    /(?:规格|包装规格)[：:\s]*([^\n\r]+)/
  ]);

  const manufacturer = extractByPattern(raw, [
    /(?:生产厂家|厂家|生产企业|制造商)[：:\s]*([^\n\r]+)/
  ]);

  const usage = extractByPattern(raw, [
    /(?:用法用量|用法|用量)[：:\s]*([^\n\r]+(?:\n[^\n\r]+){0,3})/
  ]);

  const approvalNumber = extractByPattern(raw, [
    /(?:国药准字|批准文号|注册证号)[：:\s]*([A-Z0-9]{1,2}[0-9]{6,10})/i,
    /(国药准字[A-Z0-9]{1,2}[0-9]{6,10})/i
  ]);

  const storage = extractByPattern(raw, [
    /(?:贮藏|储存|保存)[：:\s]*([^\n\r]+)/
  ]);

  const ingredients = extractByPattern(raw, [
    /(?:成份|成分|主要成份|主要成分)[：:\s]*([^\n\r]+(?:\n[^\n\r]+){0,2})/
  ]);

  return {
    name: name || '',
    expiryDate: expiryDate || '',
    specification: specification || '',
    manufacturer: manufacturer || '',
    usage: usage || '',
    approvalNumber: approvalNumber || '',
    storage: storage || '',
    ingredients: ingredients || ''
  };
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  let cleaned = dateStr.replace(/[年月]/g, '-').replace(/日/g, '').replace(/\./g, '-').replace(/\//g, '-').trim();

  const parts = cleaned.split('-').filter(p => p.length > 0);

  if (parts.length < 2) return dateStr;

  let year = parts[0];
  if (year.length === 2) {
    year = '20' + year;
  } else if (year.length === 1) {
    year = '200' + year;
  } else if (year.length < 4) {
    year = year.padStart(4, '2');
  }
  const month = parts[1].padStart(2, '0');
  const day = parts.length >= 3 ? parts[2].padStart(2, '0') : '01';

  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
    return dateStr;
  }

  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return dateStr;
  }

  return `${year}-${month}-${day}`;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};
