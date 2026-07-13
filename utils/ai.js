// utils/ai.js
// AI 分析药品信息

/**
 * 从OCR识别的文本中提取药品信息
 * @param {string} text - OCR识别的原始文本
 * @returns {Object} 提取的药品信息
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

  // 提取药品名称（通常在前几行）
  const nameKeywords = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆'];
  for (const line of lines.slice(0, 3)) {
    for (const keyword of nameKeywords) {
      if (line.includes(keyword)) {
        result.name = line.trim();
        break;
      }
    }
    if (result.name) break;
  }

  // 如果没找到关键词，使用第一行作为名称
  if (!result.name && lines.length > 0) {
    result.name = lines[0].trim().substring(0, 30);
  }

  // 提取有效期
  const expiryPatterns = [
    /有效期至[：:]?\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/,
    /有效期[：:]?\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/,
    /有效期至[：:]?\s*(\d{4}[-/年]\d{1,2}月?)/,
    /有效期[：:]?\s*(\d{4}[-/年]\d{1,2}月?)/,
    /有效期至[：:]?\s*(\d{4}\.\d{1,2}\.\d{1,2})/,
    /有效期[：:]?\s*(\d{4}\.\d{1,2}\.\d{1,2})/,
    /有效期至[：:]?\s*(\d{6})/,
    /有效期[：:]?\s*(\d{6})/,
    /失效期[：:]?\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/,
    /失效期至[：:]?\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}日?)/,
    /EXP[:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
    /EXP[:\s]*(\d{6})/i,
  ];

  for (const line of lines) {
    for (const pattern of expiryPatterns) {
      const match = line.match(pattern);
      if (match) {
        result.expiryDate = normalizeExpiryDate(match[1]);
        break;
      }
    }
    if (result.expiryDate) break;
  }

  // 提取规格
  const specPattern = /规格[：:]\s*(.+)/;
  for (const line of lines) {
    const match = line.match(specPattern);
    if (match) {
      result.specification = match[1].trim().substring(0, 50);
      break;
    }
  }

  // 提取生产厂家
  const manuPatterns = [
    /生产[企业厂家][：:]\s*(.+)/,
    /生产企业[：:]\s*(.+)/,
    /厂家[：:]\s*(.+)/,
  ];
  for (const line of lines) {
    for (const pattern of manuPatterns) {
      const match = line.match(pattern);
      if (match) {
        result.manufacturer = match[1].trim().substring(0, 50);
        break;
      }
    }
    if (result.manufacturer) break;
  }

  // 提取用法用量
  const usagePatterns = [
    /用法用量[：:]\s*(.+)/,
    /用法[：:]\s*(.+)/,
    /用量[：:]\s*(.+)/,
  ];
  for (const line of lines) {
    for (const pattern of usagePatterns) {
      const match = line.match(pattern);
      if (match) {
        result.usage = match[1].trim().substring(0, 100);
        break;
      }
    }
    if (result.usage) break;
  }

  // 提取国药准字
  const approvalPattern = /国药准字[A-Z]\d{8}/;
  for (const line of lines) {
    const match = line.match(approvalPattern);
    if (match) {
      result.approvalNumber = match[0];
      break;
    }
  }

  // 提取贮藏条件
  const storagePattern = /贮藏[：:]\s*(.+)/;
  for (const line of lines) {
    const match = line.match(storagePattern);
    if (match) {
      result.storage = match[1].trim().substring(0, 50);
      break;
    }
  }

  // 提取成分
  const ingredientPatterns = [
    /成分[：:]\s*(.+)/,
    /主要成分[：:]\s*(.+)/,
  ];
  for (const line of lines) {
    for (const pattern of ingredientPatterns) {
      const match = line.match(pattern);
      if (match) {
        result.ingredients = match[1].trim().substring(0, 100);
        break;
      }
    }
    if (result.ingredients) break;
  }

  return result;
}

/**
 * 标准化有效期日期格式
 * @param {string} dateStr - 原始日期字符串
 * @returns {string} 标准化后的日期（YYYY-MM-DD）
 */
function normalizeExpiryDate(dateStr) {
  if (!dateStr) return '';

  // 移除中文年月日
  let cleaned = dateStr.replace(/[年月]/g, '-').replace(/日/g, '');

  // 处理 YYYYMMDD 格式
  if (/^\d{6,8}$/.test(cleaned)) {
    if (cleaned.length === 6) {
      cleaned = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    } else if (cleaned.length === 8) {
      cleaned = cleaned.substring(0, 4) + '-' + cleaned.substring(4, 6) + '-' + cleaned.substring(6);
    }
  }

  // 统一分隔符为 -
  cleaned = cleaned.replace(/[./]/g, '-');

  // 处理 YYYY-MM 格式，默认日期为当月最后一天
  const parts = cleaned.split('-');
  if (parts.length === 2) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    if (!isNaN(year) && !isNaN(month)) {
      const lastDay = new Date(year, month, 0).getDate();
      cleaned = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    }
  }

  // 验证日期格式
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(cleaned)) {
    return dateStr; // 无法标准化，返回原始值
  }

  return cleaned;
}

/**
 * 格式化有效期日期为标准格式
 * @param {string} expiryDate - 有效期字符串
 * @returns {string} 格式化后的日期
 */
function formatExpiryDate(expiryDate) {
  if (!expiryDate) return '';

  // 已经是标准格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
    return expiryDate;
  }

  // 尝试标准化
  return normalizeExpiryDate(expiryDate);
}

module.exports = {
  analyzeMedicineInfo,
  normalizeExpiryDate,
  formatExpiryDate
};