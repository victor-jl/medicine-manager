// utils/ai.js
// AI辅助分析药品信息

/**
 * 从OCR识别文本中分析提取药品信息
 * @param {string} text - OCR识别的文本
 * @returns {Object} 药品信息对象
 */
function analyzeMedicineInfo(text) {
  if (!text || typeof text !== 'string') {
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

  const lines = text.split(/[\n,，;；]/).map(l => l.trim()).filter(l => l);
  const result = {
    name: '',
    expiryDate: '',
    specification: '',
    manufacturer: '',
    usage: '',
    approvalNumber: '',
    storage: '',
    ingredients: ''
  };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes('有效期') || lowerLine.includes('有效期至') || lowerLine.includes('效期')) {
      const dateMatch = line.match(/\d{4}[-./年]\d{1,2}[-./月]\d{1,2}日?|\d{4}[-./]\d{1,2}|\d{6}|\d{8}/);
      if (dateMatch) {
        result.expiryDate = dateMatch[0];
      }
    } else if (lowerLine.includes('规格') && !result.specification) {
      result.specification = extractValue(line, '规格');
    } else if ((lowerLine.includes('生产') && lowerLine.includes('企业')) || lowerLine.includes('厂家') || lowerLine.includes('生产企业')) {
      result.manufacturer = extractValue(line, /生产企业|厂家|生产/);
    } else if (lowerLine.includes('用法') || lowerLine.includes('用量')) {
      result.usage = extractValue(line, /用法|用量|用法用量/);
    } else if (lowerLine.includes('国药准字') || lowerLine.includes('批准文号')) {
      const match = line.match(/国药准字[A-Z]\d{8}|批准文号[:：]?\s*[A-Z0-9]+/);
      if (match) {
        result.approvalNumber = match[0];
      }
    } else if (lowerLine.includes('贮藏') || lowerLine.includes('贮存')) {
      result.storage = extractValue(line, /贮藏|贮存/);
    } else if (lowerLine.includes('成分') || lowerLine.includes('主要成分')) {
      result.ingredients = extractValue(line, /成分|主要成分/);
    } else if (!result.name && isLikelyMedicineName(line)) {
      result.name = line.substring(0, 30);
    }
  }

  if (!result.name && lines.length > 0) {
    result.name = lines[0].substring(0, 30);
  }

  return result;
}

function extractValue(line, keyword) {
  const pattern = typeof keyword === 'string' ? keyword : keyword.source;
  const idx = line.search(typeof keyword === 'string' ? keyword : keyword);
  if (idx === -1) return '';

  const afterKeyword = line.substring(idx).replace(/^[^\s:：]*/, '').replace(/^[:：\s]+/, '');
  return afterKeyword.substring(0, 50).trim();
}

function isLikelyMedicineName(text) {
  const medicineSuffixes = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆', '丸', '散', '合剂'];
  const lowerText = text.toLowerCase();

  for (const suffix of medicineSuffixes) {
    if (lowerText.includes(suffix)) {
      return true;
    }
  }

  return false;
}

/**
 * 格式化有效期日期
 * @param {string} dateStr - 原始日期字符串
 * @returns {string} 格式化后的日期 (YYYY-MM-DD)
 */
function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  let normalized = dateStr
    .replace(/[年月]/g, '-')
    .replace(/日/g, '')
    .replace(/\//g, '-')
    .replace(/\./g, '-')
    .replace(/[^\d-]/g, '');

  const parts = normalized.split('-').filter(p => p);

  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } else if (parts.length === 2) {
    const [year, month] = parts;
    return `${year}-${month.padStart(2, '0')}`;
  } else if (parts.length === 1) {
    const str = parts[0];
    if (str.length === 6) {
      return `${str.substring(0, 4)}-${str.substring(4, 6)}`;
    } else if (str.length === 8) {
      return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
    }
    return str;
  }

  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate,
  extractValue,
  isLikelyMedicineName
};
