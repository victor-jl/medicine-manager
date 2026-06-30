// utils/ai.js
// AI 辅助分析药品信息

/**
 * 从OCR识别的文本中分析提取药品信息
 * @param {string} text - OCR识别的原始文本
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

  // 提取药品名称（通常是第一行或包含"胶囊"、"片"等关键词）
  const lines = text.split(/[\n\r]/).filter(line => line.trim());

  // 药品名称关键词
  const nameKeywords = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆'];

  // 查找药品名称
  for (const line of lines) {
    for (const keyword of nameKeywords) {
      if (line.includes(keyword)) {
        const idx = line.indexOf(keyword);
        const start = Math.max(0, idx - 10);
        const end = Math.min(line.length, idx + keyword.length + 2);
        result.name = line.substring(start, end).trim();
        break;
      }
    }
    if (result.name) break;
  }

  // 如果没找到，使用第一行作为名称（限制长度）
  if (!result.name && lines.length > 0) {
    result.name = lines[0].trim().substring(0, 30);
  }

  // 提取规格
  const specMatch = text.match(/规格[：:]\s*([^\n\r]+)/);
  if (specMatch) {
    result.specification = specMatch[1].trim().substring(0, 50);
  }

  // 提取生产厂家
  const mfrMatch = text.match(/(?:生产|生产企业|厂家)[：:]\s*([^\n\r]+)/);
  if (mfrMatch) {
    result.manufacturer = mfrMatch[1].trim().substring(0, 100);
  }

  // 提取用法用量
  const usageMatch = text.match(/(?:用法用量|用法|用量)[：:]\s*([^\n\r]+)/);
  if (usageMatch) {
    result.usage = usageMatch[1].trim().substring(0, 100);
  }

  // 提取国药准字
  const approvalMatch = text.match(/国药准字[：:]?\s*([A-Z]\d{8})/i);
  if (approvalMatch) {
    result.approvalNumber = '国药准字' + approvalMatch[1];
  }

  // 提取有效期
  const expiryPatterns = [
    /有效期[至到]?[：:]?\s*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}[日]?)/,
    /有效期[至到]?[：:]?\s*(\d{4}[-./]\d{1,2}[-./]?\d{0,2})/,
    /有效日期[：:]?\s*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}[日]?)/,
    /失效日期[：:]?\s*(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}[日]?)/,
    /(\d{4}[-./年]\d{1,2}[-./月]?\d{0,2}[日]?)[至到]/  // 日期在前
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expiryDate = match[1].trim();
      break;
    }
  }

  // 提取贮藏条件
  const storageMatch = text.match(/(?:贮藏|储存|保存)[：:]\s*([^\n\r]+)/);
  if (storageMatch) {
    result.storage = storageMatch[1].trim().substring(0, 50);
  }

  // 提取成分
  const ingredientsMatch = text.match(/(?:成分|主要成分)[：:]\s*([^\n\r]+)/);
  if (ingredientsMatch) {
    result.ingredients = ingredientsMatch[1].trim().substring(0, 200);
  }

  return result;
}

/**
 * 格式化有效期日期为标准格式
 * @param {string} expiryDate - 原始有效期字符串
 * @returns {string} 格式化后的日期 (YYYY-MM-DD)
 */
function formatExpiryDate(expiryDate) {
  if (!expiryDate || typeof expiryDate !== 'string') {
    return '';
  }

  // 移除多余空格
  let dateStr = expiryDate.trim();

  // 替换中文年月日为-
  dateStr = dateStr.replace(/[年月]/g, '-').replace(/日/g, '');

  // 清理多余的横线（例如 "2025-12-" 变成 "2025-12"）
  dateStr = dateStr.replace(/-+$/, '');

  // 尝试解析日期
  const patterns = [
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // YYYY/MM/DD
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
    // YYYY.MM.DD
    /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/,
    // YYYY-MM (只有年月)
    /^(\d{4})-(\d{1,2})$/,
    // YYYY/MM (只有年月)
    /^(\d{4})\/(\d{1,2})$/,
    // YYYY.MM (只有年月)
    /^(\d{4})\.(\d{1,2})$/
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3] ? match[3].padStart(2, '0') : '01';
      return `${year}-${month}-${day}`;
    }
  }

  // 如果无法解析，返回原字符串（可能需要人工确认）
  return dateStr;
}

/**
 * 检查药品是否即将过期
 * @param {string} expiryDate - 有效期日期 (YYYY-MM-DD)
 * @param {number} days - 提前预警天数
 * @returns {boolean} 是否即将过期
 */
function isExpiringSoon(expiryDate, days = 30) {
  if (!expiryDate) return false;

  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= days && diffDays >= 0;
  } catch (e) {
    return false;
  }
}

/**
 * 检查药品是否已过期
 * @param {string} expiryDate - 有效期日期 (YYYY-MM-DD)
 * @returns {boolean} 是否已过期
 */
function isExpired(expiryDate) {
  if (!expiryDate) return false;

  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry < now;
  } catch (e) {
    return false;
  }
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate,
  isExpiringSoon,
  isExpired
};