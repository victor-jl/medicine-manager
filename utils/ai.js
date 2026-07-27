// utils/ai.js
// 药品信息智能分析与格式化工具

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

  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l);

  const nameKeywords = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆', '丸', '散'];
  const expiryPatterns = [
    /有效期[^0-9]{0,5}(\d{4}[-/.年]\d{1,2}[-/.月]?\d{0,2}日?)/,
    /有效期至[^0-9]{0,5}(\d{4}[-/.年]\d{1,2}[-/.月]?\d{0,2}日?)/,
    /(\d{4}[-/.年]\d{1,2}[-/.月]?\d{0,2}日?)[^0-9]{0,5}有效期/,
    /失效期[^0-9]{0,5}(\d{4}[-/.年]\d{1,2}[-/.月]?\d{0,2}日?)/,
    /保质期[^0-9]{0,5}(\d{4}[-/.年]\d{1,2}[-/.月]?\d{0,2}日?)/,
    /(\d{4}[-/.年]\d{1,2}[-/.月]\d{0,2}日?)/g
  ];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (!result.name) {
      for (const kw of nameKeywords) {
        if (lowerLine.includes(kw)) {
          result.name = line.substring(0, 50);
          break;
        }
      }
    }

    if (!result.expiryDate) {
      for (const pattern of expiryPatterns) {
        const match = line.match(pattern);
        if (match) {
          result.expiryDate = match[1] || match[0];
          break;
        }
      }
    }

    if (!result.specification) {
      const specMatch = line.match(/规格[^:：]?[:：]?\s*(.+)/);
      if (specMatch) {
        result.specification = specMatch[1].trim();
      }
    }

    if (!result.manufacturer) {
      const manuMatch = line.match(/(生产厂家|厂家|厂商|企业)[^:：]?[:：]?\s*(.+)/);
      if (manuMatch) {
        result.manufacturer = manuMatch[2].trim();
      }
    }

    if (!result.usage) {
      const usageMatch = line.match(/(用法用量|用法|用量|口服)[^:：]?[:：]?\s*(.+)/);
      if (usageMatch) {
        result.usage = (usageMatch[1] + ': ' + usageMatch[2].trim()).substring(0, 100);
      }
    }

    if (!result.approvalNumber) {
      const approvalMatch = line.match(/(国药准字|批准文号|注册证号)\s*[:：]?\s*([A-Za-z0-9]+)/);
      if (approvalMatch) {
        result.approvalNumber = approvalMatch[2].trim();
      }
    }

    if (!result.storage) {
      const storageMatch = line.match(/(贮藏|储存|保存)[^:：]?[:：]?\s*(.+)/);
      if (storageMatch) {
        result.storage = storageMatch[2].trim();
      }
    }

    if (!result.ingredients) {
      const ingMatch = line.match(/(成分|成份|主要成分)[^:：]?[:：]?\s*(.+)/);
      if (ingMatch) {
        result.ingredients = ingMatch[2].trim();
      }
    }
  }

  if (!result.name && lines.length > 0) {
    result.name = lines[0].substring(0, 30);
  }

  return result;
}

function formatExpiryDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return '';
  }

  const cleaned = dateStr.trim()
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/[.、/]/g, '-')
    .replace(/\s+/g, '');

  const match = cleaned.match(/(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3] ? match[3].padStart(2, '0') : '01';
    return `${year}-${month}-${day}`;
  }

  const shortMatch = cleaned.match(/(\d{4})(\d{2})(\d{2})/);
  if (shortMatch) {
    return `${shortMatch[1]}-${shortMatch[2]}-${shortMatch[3]}`;
  }

  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};
