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

  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l);
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

  const nameKeywords = [
    '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆',
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素', '罗红霉素',
    '感冒灵', '感冒清热', '板蓝根', '双黄连', '莲花清瘟',
    '维生素', '钙片', '铁剂', '锌', '叶酸',
    '奥美拉唑', '兰索拉唑', '泮托拉唑',
    '硝苯地平', '氨氯地平', '贝那普利',
    '二甲双胍', '格列本脲', '胰岛素',
    '阿司匹林', '氯吡格雷', '他汀',
    '氯雷他定', '西替利嗪', '蒙脱石'
  ];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (!result.name) {
      for (const kw of nameKeywords) {
        if (lowerLine.includes(kw)) {
          result.name = line;
          break;
        }
      }
    }

    if (!result.expiryDate) {
      const expiryMatch = line.match(/(有效期|失效期|生产日期|生产批号).*?(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}|\d{4}[-/年]\d{1,2}[-/月]?)/i);
      if (expiryMatch) {
        result.expiryDate = expiryMatch[2] || '';
      } else {
        const dateMatch = line.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}|\d{4}[-/]\d{1,2})/);
        if (dateMatch && !result.expiryDate) {
          result.expiryDate = dateMatch[1];
        }
      }
    }

    if (!result.specification) {
      const specMatch = line.match(/(规格|规格型号)[:：]?\s*(.+)/i);
      if (specMatch) {
        result.specification = specMatch[2].trim();
      }
    }

    if (!result.manufacturer) {
      const manuMatch = line.match(/(生产厂家|厂家|制造商|生产企业)[:：]?\s*(.+)/i);
      if (manuMatch) {
        result.manufacturer = manuMatch[2].trim();
      }
    }

    if (!result.usage) {
      const usageMatch = line.match(/(用法用量|用法|用量)[:：]?\s*(.+)/i);
      if (usageMatch) {
        result.usage = usageMatch[2].trim();
      }
    }

    if (!result.approvalNumber) {
      const approvalMatch = line.match(/(国药准字|批准文号)[:：]?\s*([A-Za-z0-9]+)/i);
      if (approvalMatch) {
        result.approvalNumber = approvalMatch[2].trim();
      }
    }

    if (!result.storage) {
      const storageMatch = line.match(/(贮藏|储存|保存)[:：]?\s*(.+)/i);
      if (storageMatch) {
        result.storage = storageMatch[2].trim();
      }
    }

    if (!result.ingredients) {
      const ingMatch = line.match(/(成分|主要成分|成份)[:：]?\s*(.+)/i);
      if (ingMatch) {
        result.ingredients = ingMatch[2].trim();
      }
    }
  }

  if (!result.name && lines.length > 0) {
    result.name = lines[0].substring(0, 50);
  }

  return result;
}

function formatExpiryDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return '';
  }

  let cleaned = dateStr.trim();

  cleaned = cleaned.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');

  cleaned = cleaned.replace(/[./]/g, '-');

  const parts = cleaned.split('-').filter(p => p);

  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    if (/^\d{4}$/.test(parts[0])) {
      return `${parts[0]}-01-01`;
    }
    return parts[0];
  }

  if (parts.length === 2) {
    const year = parts[0].padStart(4, '20');
    const month = parts[1].padStart(2, '0');
    return `${year}-${month}-01`;
  }

  if (parts.length >= 3) {
    const year = parts[0].padStart(4, '20');
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return cleaned;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};
