// utils/ai.js
// 药品信息分析与日期格式化工具

function extractField(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function extractName(text) {
  const namePatterns = [
    /[【\[]\s*药品名称\s*[】\]]\s*[:：]?\s*([^\n\r【\[]+)/,
    /药品名称\s*[:：]\s*([^\n\r]+)/,
    /通用名\s*[:：]\s*([^\n\r]+)/,
    /商品名\s*[:：]\s*([^\n\r]+)/
  ];

  const name = extractField(text, namePatterns);
  if (name) return name;

  const keywords = [
    '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆',
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素', '罗红霉素',
    '感冒灵', '感冒清热', '板蓝根', '双黄连', '莲花清瘟', '连花清瘟',
    '维生素', '钙片', '铁剂', '锌', '叶酸',
    '奥美拉唑', '兰索拉唑', '泮托拉唑',
    '硝苯地平', '氨氯地平', '贝那普利',
    '二甲双胍', '格列本脲', '胰岛素',
    '阿司匹林', '氯吡格雷', '他汀',
    '氯雷他定', '西替利嗪', '蒙脱石'
  ];

  const lowerText = text.toLowerCase();
  for (const kw of keywords) {
    if (lowerText.includes(kw)) {
      const idx = lowerText.indexOf(kw);
      const start = Math.max(0, idx - 10);
      const end = Math.min(text.length, idx + kw.length + 5);
      return text.substring(start, end).trim();
    }
  }

  const lines = text.split(/[\n\r]/).filter(l => l.trim());
  return lines.length > 0 ? lines[0].trim().substring(0, 30) : '';
}

function extractExpiryDate(text) {
  const datePatterns = [
    /有效期\s*[:：至]?\s*(\d{4}[-\/年]\d{1,2}[-\/月]?\d{0,2}日?)/,
    /有效期至\s*[:：]?\s*(\d{4}[-\/年]\d{1,2}[-\/月]?\d{0,2}日?)/,
    /失效期\s*[:：]?\s*(\d{4}[-\/年]\d{1,2}[-\/月]?\d{0,2}日?)/,
    /EXP\s*[:：]?\s*(\d{4}[-\/年]?\d{1,2}[-\/月]?\d{0,2})/i,
    /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{0,2})\s*日?/
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1] && !match[2]) {
        return match[1];
      }
      if (match[1] && match[2]) {
        const day = match[3] || '01';
        return `${match[1]}-${match[2].padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }

  const loosePattern = /(\d{4})[-\/](\d{1,2})(?:[-\/](\d{1,2}))?/;
  const looseMatch = text.match(loosePattern);
  if (looseMatch) {
    const year = parseInt(looseMatch[1], 10);
    const month = parseInt(looseMatch[2], 10);
    const day = looseMatch[3] ? parseInt(looseMatch[3], 10) : 1;
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return '';
}

function extractSpecification(text) {
  const patterns = [
    /规格\s*[:：]\s*([^\n\r【\[]+)/,
    /[【\[]\s*规格\s*[】\]]\s*[:：]?\s*([^\n\r【\[]+)/
  ];
  return extractField(text, patterns);
}

function extractManufacturer(text) {
  const patterns = [
    /生产厂家\s*[:：]\s*([^\n\r【\[]+)/,
    /生产企业\s*[:：]\s*([^\n\r【\[]+)/,
    /厂家\s*[:：]\s*([^\n\r【\[]+)/,
    /[【\[]\s*生产厂家\s*[】\]]\s*[:：]?\s*([^\n\r【\[]+)/
  ];
  return extractField(text, patterns);
}

function extractUsage(text) {
  const patterns = [
    /用法用量\s*[:：]\s*([^\n\r【\[]+)/,
    /[【\[]\s*用法用量\s*[】\]]\s*[:：]?\s*([^\n\r【\[]+)/,
    /口服\s*[，,。.]?\s*([^\n\r【\[]{2,30})/
  ];
  return extractField(text, patterns);
}

function extractApprovalNumber(text) {
  const patterns = [
    /国药准字\s*[:：]?\s*([A-Za-z0-9]+)/,
    /批准文号\s*[:：]\s*([^\n\r【\[]+)/,
    /[【\[]\s*批准文号\s*[】\]]\s*[:：]?\s*([^\n\r【\[]+)/
  ];
  return extractField(text, patterns);
}

function extractStorage(text) {
  const patterns = [
    /贮藏\s*[:：]\s*([^\n\r【\[]+)/,
    /储存\s*[:：]\s*([^\n\r【\[]+)/,
    /[【\[]\s*贮藏\s*[】\]]\s*[:：]?\s*([^\n\r【\[]+)/
  ];
  return extractField(text, patterns);
}

function extractIngredients(text) {
  const patterns = [
    /成分\s*[:：]\s*([^\n\r【\[]+)/,
    /[【\[]\s*成分\s*[】\]]\s*[:：]?\s*([^\n\r【\[]+)/,
    /主要成分\s*[:：]\s*([^\n\r【\[]+)/
  ];
  return extractField(text, patterns);
}

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

  return {
    name: extractName(text),
    expiryDate: extractExpiryDate(text),
    specification: extractSpecification(text),
    manufacturer: extractManufacturer(text),
    usage: extractUsage(text),
    approvalNumber: extractApprovalNumber(text),
    storage: extractStorage(text),
    ingredients: extractIngredients(text)
  };
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  let normalized = dateStr
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\./g, '-')
    .replace(/\//g, '-')
    .replace(/\s+/g, '');

  const parts = normalized.split('-').filter(p => p);
  if (parts.length < 2) return dateStr;

  const year = parts[0].padStart(4, '20');
  const month = parts[1].padStart(2, '0');
  const day = parts.length > 2 ? parts[2].padStart(2, '0') : '01';

  const parsedYear = parseInt(year, 10);
  const parsedMonth = parseInt(month, 10);
  const parsedDay = parseInt(day, 10);

  if (
    parsedYear < 1900 || parsedYear > 2100 ||
    parsedMonth < 1 || parsedMonth > 12 ||
    parsedDay < 1 || parsedDay > 31
  ) {
    return dateStr;
  }

  return `${year}-${month}-${day}`;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate,
  extractName,
  extractExpiryDate,
  extractSpecification,
  extractManufacturer,
  extractUsage,
  extractApprovalNumber,
  extractStorage,
  extractIngredients
};
