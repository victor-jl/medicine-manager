// utils/ai.js
// AI分析药品信息

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

  const lines = text.split(/[\n\r]+/).filter(line => line.trim());

  const expiryPatterns = [
    /有效期[\s：:]*(\d{4}[\-/年]\d{1,2}[\-/月]\d{1,2}[\-/日]?)/,
    /有效期至[\s：:]*(\d{4}[\-/年]\d{1,2}[\-/月]\d{1,2}[\-/日]?)/,
    /有效期至[\s：:]*(\d{4}\.\d{1,2}\.\d{1,2})/,
    /EXP[\s：:]*(\d{4}[\-/]\d{1,2}[\-/]\d{1,2})/,
    /EXP[\s：:]*(\d{2}[\-/]\d{2}[\-/]\d{4})/,
    /有效期[\s：:]*(\d+)年/,
    /有效期[\s：:]*(\d+)个月/
  ];

  const approvalPattern = /国药准字[\s：:]*([A-Za-z\d]+)/;
  const specPatterns = [
    /规格[\s：:]*([^\n\r]+)/,
    /每片[\s：:]*([^\n\r]+)/,
    /每粒[\s：:]*([^\n\r]+)/,
    /每袋[\s：:]*([^\n\r]+)/
  ];

  const manufacturerPatterns = [
    /生产厂家[\s：:]*([^\n\r]+)/,
    /厂家[\s：:]*([^\n\r]+)/,
    /生产商[\s：:]*([^\n\r]+)/,
    /出品商[\s：:]*([^\n\r]+)/
  ];

  const usagePatterns = [
    /用法用量[\s：:]*([^\n\r]+)/,
    /用法[\s：:]*([^\n\r]+)/,
    /用量[\s：:]*([^\n\r]+)/
  ];

  const storagePatterns = [
    /贮藏[\s：:]*([^\n\r]+)/,
    /储存[\s：:]*([^\n\r]+)/,
    /保存[\s：:]*([^\n\r]+)/
  ];

  const ingredientsPatterns = [
    /主要成分[\s：:]*([^\n\r]+)/,
    /成分[\s：:]*([^\n\r]+)/
  ];

  for (const line of lines) {
    for (const pattern of expiryPatterns) {
      const match = line.match(pattern);
      if (match && !result.expiryDate) {
        result.expiryDate = match[1];
        break;
      }
    }

    const approvalMatch = line.match(approvalPattern);
    if (approvalMatch && !result.approvalNumber) {
      result.approvalNumber = approvalMatch[1];
    }

    for (const pattern of specPatterns) {
      const match = line.match(pattern);
      if (match && !result.specification) {
        result.specification = match[1];
        break;
      }
    }

    for (const pattern of manufacturerPatterns) {
      const match = line.match(pattern);
      if (match && !result.manufacturer) {
        result.manufacturer = match[1];
        break;
      }
    }

    for (const pattern of usagePatterns) {
      const match = line.match(pattern);
      if (match && !result.usage) {
        result.usage = match[1];
        break;
      }
    }

    for (const pattern of storagePatterns) {
      const match = line.match(pattern);
      if (match && !result.storage) {
        result.storage = match[1];
        break;
      }
    }

    for (const pattern of ingredientsPatterns) {
      const match = line.match(pattern);
      if (match && !result.ingredients) {
        result.ingredients = match[1];
        break;
      }
    }
  }

  if (!result.name) {
    const medicineKeywords = [
      '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂',
      '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素'
    ];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of medicineKeywords) {
        if (lowerLine.includes(keyword)) {
          const idx = lowerLine.indexOf(keyword);
          const start = Math.max(0, idx - 8);
          const end = Math.min(line.length, idx + keyword.length + 10);
          result.name = line.substring(start, end).trim();
          break;
        }
      }
      if (result.name) break;
    }

    if (!result.name) {
      result.name = lines[0] ? lines[0].trim().substring(0, 30) : '';
    }
  }

  return result;
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  let normalized = dateStr.replace(/[年月日]/g, '-').replace(/\./g, '-');

  const patterns = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
    /^(\d{4})(\d{2})(\d{2})$/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      let year, month, day;
      if (match[3].length === 4) {
        year = match[3];
        month = match[1].padStart(2, '0');
        day = match[2].padStart(2, '0');
      } else {
        year = match[1];
        month = match[2].padStart(2, '0');
        day = match[3].padStart(2, '0');
      }
      return `${year}-${month}-${day}`;
    }
  }

  const yearMatch = dateStr.match(/(\d+)年/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const futureYear = year < 100 ? 2000 + year : year;
    return `${futureYear}-12-31`;
  }

  const monthMatch = dateStr.match(/(\d+)个月/);
  if (monthMatch) {
    const months = parseInt(monthMatch[1]);
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  }

  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};