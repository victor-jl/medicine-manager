// utils/ai.js
// 药品信息智能分析模块

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

  const lines = text.split(/[\n\r]/).filter(line => line.trim());
  const info = {
    name: '',
    expiryDate: '',
    specification: '',
    manufacturer: '',
    usage: '',
    approvalNumber: '',
    storage: '',
    ingredients: ''
  };

  // 提取药品名称（通常在开头或包含药品剂型关键词）
  const nameKeywords = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆'];
  for (const line of lines) {
    for (const keyword of nameKeywords) {
      if (line.includes(keyword)) {
        info.name = line.trim().substring(0, 50);
        break;
      }
    }
    if (info.name) break;
  }

  // 如果没找到，使用第一行作为名称
  if (!info.name && lines.length > 0) {
    info.name = lines[0].trim().substring(0, 50);
  }

  // 提取有效期
  const expiryPatterns = [
    /有效期[至：:]*\s*(\d{4}[年\-\/]\d{1,2}[月\-\/]?\d{0,2}[日]?)/,
    /有效期[至：:]*\s*(\d{4}\.\d{1,2}\.\d{0,2})/,
    /(\d{4}[年\-\/]\d{1,2}[月\-\/]\d{1,2}[日]?)\s*前?使用/,
    /EXP[:\s]*(\d{4}[年\-\/]\d{1,2}[月\-\/]?\d{0,2})/i
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.expiryDate = match[1];
      break;
    }
  }

  // 提取规格
  const specMatch = text.match(/规格[：:]\s*([^\n\r]+)/);
  if (specMatch) {
    info.specification = specMatch[1].trim().substring(0, 50);
  }

  // 提取生产厂家
  const manufacturerPatterns = [
    /生产[企业厂家][：:]\s*([^\n\r]+)/,
    /厂家[：:]\s*([^\n\r]+)/,
    /生产企业[：:]\s*([^\n\r]+)/
  ];
  for (const pattern of manufacturerPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.manufacturer = match[1].trim().substring(0, 100);
      break;
    }
  }

  // 提取用法用量
  const usagePatterns = [
    /用法用量[：:]\s*([^\n\r]+)/,
    /用法[：:]\s*([^\n\r]+)/,
    /用量[：:]\s*([^\n\r]+)/
  ];
  for (const pattern of usagePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.usage = match[1].trim().substring(0, 100);
      break;
    }
  }

  // 提取批准文号
  const approvalMatch = text.match(/(?:批准文号|国药准字)[：:]*\s*([A-Z0-9]+[^\n\r]*)/i);
  if (approvalMatch) {
    info.approvalNumber = approvalMatch[1].trim().substring(0, 30);
  }

  // 提取贮藏条件
  const storageMatch = text.match(/贮藏[：:]\s*([^\n\r]+)/);
  if (storageMatch) {
    info.storage = storageMatch[1].trim().substring(0, 50);
  }

  // 提取成分
  const ingredientsMatch = text.match(/(?:成分|主要成分)[：:]\s*([^\n\r]+)/);
  if (ingredientsMatch) {
    info.ingredients = ingredientsMatch[1].trim().substring(0, 200);
  }

  return info;
}

/**
 * 格式化有效期日期
 * @param {string} dateStr - 原始日期字符串
 * @returns {string} 格式化后的日期 (YYYY-MM-DD)
 */
function formatExpiryDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return '';
  }

  // 清理字符串
  let cleaned = dateStr.trim();

  // 尝试匹配各种日期格式
  const patterns = [
    // 2025年12月31日 或 2025年12月
    {
      regex: /(\d{4})[年\-\/\.](\d{1,2})(?:[月\-\/\.](\d{1,2})[日]?)?/,
      extract: (match) => {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3] ? match[3].padStart(2, '0') : '01';
        return `${year}-${month}-${day}`;
      }
    },
    // 12/2025 或 12-2025 (月/年格式)
    {
      regex: /(\d{1,2})[\/\-](\d{4})/,
      extract: (match) => {
        const year = match[2];
        const month = match[1].padStart(2, '0');
        return `${year}-${month}-01`;
      }
    }
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern.regex);
    if (match) {
      return pattern.extract(match);
    }
  }

  // 如果无法解析，返回原始字符串
  return cleaned;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};
