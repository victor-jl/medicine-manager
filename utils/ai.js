function analyzeMedicineInfo(text) {
  if (!text) return {};

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

  const lines = text.split(/[\n\r]/).filter(line => line.trim());

  const expiryPatterns = [
    /有效期\s*[:：]\s*(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})[日号]?/,
    /有效期至\s*[:：]\s*(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})[日号]?/,
    /效期\s*[:：]\s*(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})[日号]?/,
    /(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})[日号]?\s*到期/,
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
  ];

  const specPattern = /规格\s*[:：]\s*([^\n\r]+)/;
  const manufacturerPattern = /[生产]?厂家\s*[:：]\s*([^\n\r]+)/;
  const usagePattern = /用法[用]?\s*[:：]\s*([^\n\r]+)/;
  const approvalPattern = /国药准字\s*([A-Za-z0-9]+)/;
  const storagePattern = /[贮储]藏\s*[:：]\s*([^\n\r]+)/;
  const ingredientsPattern = /成分\s*[:：]\s*([^\n\r]+)/;

  for (const line of lines) {
    if (!result.expiryDate) {
      for (const pattern of expiryPatterns) {
        const match = line.match(pattern);
        if (match) {
          result.expiryDate = `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
          break;
        }
      }
    }

    if (!result.specification) {
      const match = line.match(specPattern);
      if (match) result.specification = match[1].trim();
    }

    if (!result.manufacturer) {
      const match = line.match(manufacturerPattern);
      if (match) result.manufacturer = match[1].trim();
    }

    if (!result.usage) {
      const match = line.match(usagePattern);
      if (match) result.usage = match[1].trim();
    }

    if (!result.approvalNumber) {
      const match = line.match(approvalPattern);
      if (match) result.approvalNumber = match[1].trim();
    }

    if (!result.storage) {
      const match = line.match(storagePattern);
      if (match) result.storage = match[1].trim();
    }

    if (!result.ingredients) {
      const match = line.match(ingredientsPattern);
      if (match) result.ingredients = match[1].trim();
    }
  }

  const keywords = [
    '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆',
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素', '罗红霉素',
    '感冒灵', '感冒清热', '板蓝根', '双黄连', '维生素', '钙片', '铁剂'
  ];

  if (!result.name) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        const idx = text.indexOf(kw);
        const start = Math.max(0, idx - 8);
        const end = Math.min(text.length, idx + kw.length + 10);
        result.name = text.substring(start, end).trim();
        break;
      }
    }
  }

  if (!result.name && lines.length > 0) {
    result.name = lines[0].trim().substring(0, 30);
  }

  return result;
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  const cleaned = dateStr.replace(/[年月日号]/g, '-').replace(/--+/g, '-').trim();
  
  if (cleaned.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
    const parts = cleaned.split('-');
    return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
  }

  if (cleaned.match(/^\d{8}$/)) {
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 8)}`;
  }

  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};