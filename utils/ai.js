// utils/ai.js
// AI 药品信息分析与工具函数

const MEDICINE_KEYWORDS = [
  '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆',
  '丸', '散', '丹', '膏', '露', '酊', '合剂', '栓剂', '气雾剂', '喷雾剂'
];

const ACTIVE_INGREDIENTS = [
  '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素', '罗红霉素',
  '维生素', '钙片', '铁剂', '锌', '叶酸',
  '奥美拉唑', '兰索拉唑', '泮托拉唑',
  '硝苯地平', '氨氯地平', '贝那普利',
  '二甲双胍', '格列本脲', '胰岛素',
  '阿司匹林', '氯吡格雷', '他汀',
  '氯雷他定', '西替利嗪', '蒙脱石'
];

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

  result.name = extractMedicineName(text);

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (!result.expiryDate) {
      const expiryMatch = line.match(/(?:有效期|有效期至|失效期|EXP|Expiry|exp)[】：:\s]*([0-9]{4}[-/.年][0-9]{1,2}[-/.月]?[0-9]{0,2}日?)/i);
      if (expiryMatch) {
        result.expiryDate = formatExpiryDate(expiryMatch[1]);
        continue;
      }
    }

    if (!result.specification) {
      const specMatch = line.match(/(?:规格|Specification)[】：:\s]*(.+)/i);
      if (specMatch) {
        result.specification = specMatch[1].trim();
        continue;
      }
    }

    if (!result.manufacturer) {
      const manuMatch = line.match(/(?:生产厂家|厂家|制造商|Manufacturer|药厂)[】：:\s]*(.+)/i);
      if (manuMatch) {
        result.manufacturer = manuMatch[1].trim();
        continue;
      }
    }

    if (!result.usage) {
      const usageMatch = line.match(/(?:用法用量|用法|用量|口服|Usage)[】：:\s]*(.+)/i);
      if (usageMatch) {
        result.usage = usageMatch[1].trim();
        continue;
      }
    }

    if (!result.approvalNumber) {
      const approvalMatch = line.match(/(?:国药准字|批准文号|Approval)[】：:\s]*([A-Za-z0-9]+)/i);
      if (approvalMatch) {
        result.approvalNumber = approvalMatch[1].trim();
        continue;
      }
    }

    if (!result.storage) {
      const storageMatch = line.match(/(?:贮藏|储存|保存|Storage)[】：:\s]*(.+)/i);
      if (storageMatch) {
        result.storage = storageMatch[1].trim();
        continue;
      }
    }

    if (!result.ingredients) {
      const ingredMatch = line.match(/(?:成分|成份|Ingredient|Active)[】：:\s]*(.+)/i);
      if (ingredMatch) {
        result.ingredients = ingredMatch[1].trim();
        continue;
      }
    }
  }

  if (!result.ingredients) {
    for (const ing of ACTIVE_INGREDIENTS) {
      if (text.toLowerCase().includes(ing.toLowerCase())) {
        result.ingredients = result.ingredients ? result.ingredients + '、' + ing : ing;
      }
    }
  }

  return result;
}

function extractMedicineName(text) {
  if (!text) return '';

  const lowerText = text.toLowerCase();

  for (const kw of MEDICINE_KEYWORDS) {
    if (lowerText.includes(kw)) {
      const idx = lowerText.indexOf(kw);
      const start = Math.max(0, idx - 8);
      const end = Math.min(text.length, idx + kw.length + 10);
      return text.substring(start, end).trim();
    }
  }

  for (const ing of ACTIVE_INGREDIENTS) {
    if (lowerText.includes(ing.toLowerCase())) {
      const idx = lowerText.indexOf(ing.toLowerCase());
      const start = Math.max(0, idx - 5);
      const end = Math.min(text.length, idx + ing.length + 15);
      return text.substring(start, end).trim();
    }
  }

  const lines = text.split(/[\n\r]/).filter(line => line.trim());
  if (lines.length > 0) {
    return lines[0].trim().substring(0, 30);
  }
  return text.substring(0, 30).trim();
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  let normalized = dateStr
    .replace(/年|月/g, '-')
    .replace(/日/g, '')
    .replace(/\./g, '-')
    .replace(/\//g, '-')
    .replace(/\s+/g, '');

  const parts = normalized.split('-').filter(p => p);

  if (parts.length >= 3) {
    const year = parts[0].padStart(4, '20');
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (parts.length === 2) {
    const year = parts[0].padStart(4, '20');
    const month = parts[1].padStart(2, '0');
    return `${year}-${month}`;
  }

  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  extractMedicineName,
  formatExpiryDate
};
