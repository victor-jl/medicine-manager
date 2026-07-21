// utils/ai.js
// 药品信息智能解析模块

/**
 * 从OCR识别文本中分析提取药品信息
 * @param {string} text - OCR识别的原始文本
 * @returns {Object} 包含药品各字段的对象
 */
function analyzeMedicineInfo(text) {
  if (!text || typeof text !== 'string') {
    return {
      name: '',
      specification: '',
      manufacturer: '',
      usage: '',
      expiryDate: '',
      approvalNumber: '',
      storage: '',
      ingredients: ''
    };
  }

  const lines = text.split(/[\n\r\s]+/).filter(line => line.trim());
  const result = {
    name: '',
    specification: '',
    manufacturer: '',
    usage: '',
    expiryDate: '',
    approvalNumber: '',
    storage: '',
    ingredients: ''
  };

  // 提取药品名称（优先级高的关键词）
  const nameKeywords = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆'];
  for (const keyword of nameKeywords) {
    const pattern = new RegExp(`([^\\s]{2,10}${keyword})`, 'i');
    const match = text.match(pattern);
    if (match && !result.name) {
      result.name = match[1].trim();
      break;
    }
  }

  // 如果没匹配到关键词，取第一行作为名称
  if (!result.name && lines.length > 0) {
    result.name = lines[0].trim().substring(0, 30);
  }

  // 提取规格（包含mg、g、ml等单位）
  const specPattern = /(\d+\.?\d*\s*(mg|g|ml|毫克|克|毫升))/gi;
  const specMatch = text.match(specPattern);
  if (specMatch) {
    result.specification = specMatch.join(' ').trim();
  }

  // 提取生产厂家（常见关键词）
  const manufacturerPattern = /(生产企业|生产厂家|厂商|制药)[：:\s]*([^\\n]+)/i;
  const manufacturerMatch = text.match(manufacturerPattern);
  if (manufacturerMatch) {
    result.manufacturer = manufacturerMatch[2].trim().substring(0, 50);
  } else {
    // 尝试匹配"XX制药"、"XX药业"
    const companyPattern = /([^\\s]{2,15}(制药|药业|医药))/;
    const companyMatch = text.match(companyPattern);
    if (companyMatch) {
      result.manufacturer = companyMatch[1].trim();
    }
  }

  // 提取用法用量
  const usagePattern = /(用法用量|口服|外用|静脉注射)[：:\s]*([^\\n]+)/i;
  const usageMatch = text.match(usagePattern);
  if (usageMatch) {
    result.usage = usageMatch[0].trim().substring(0, 100);
  }

  // 提取有效期/生产日期
  const expiryPatterns = [
    /(有效期至?|有效期)[：:\s]*(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}日?)/i,
    /(有效期至?|有效期)[：:\s]*(\d{4}[-\/年]\d{1,2}月?)/i,
    /(有效期)[：:\s]*(\d+个月?)/i
  ];
  
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expiryDate = match[2].trim();
      break;
    }
  }

  // 提取国药准字
  const approvalPattern = /(国药准字[HZSF]\d{8})/i;
  const approvalMatch = text.match(approvalPattern);
  if (approvalMatch) {
    result.approvalNumber = approvalMatch[1].trim();
  }

  // 提取贮藏条件
  const storagePattern = /(贮藏|贮藏条件|保存条件)[：:\s]*([^\\n]+)/i;
  const storageMatch = text.match(storagePattern);
  if (storageMatch) {
    result.storage = storageMatch[2].trim().substring(0, 50);
  }

  // 提取主要成分
  const ingredientsPattern = /(主要成分|成分|成分表)[：:\s]*([^\\n]+)/i;
  const ingredientsMatch = text.match(ingredientsPattern);
  if (ingredientsMatch) {
    result.ingredients = ingredientsMatch[2].trim().substring(0, 100);
  }

  return result;
}

/**
 * 格式化有效期日期为标准格式 YYYY-MM-DD
 * @param {string} expiryDate - 原始有效期字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatExpiryDate(expiryDate) {
  if (!expiryDate || typeof expiryDate !== 'string') {
    return '';
  }

  const cleanDate = expiryDate.trim();
  
  // 如果已经是YYYY-MM-DD格式，直接返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return cleanDate;
  }

  // 提取日期部分（支持多种格式）
  const patterns = [
    // 2024年12月31日
    /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/,
    // 2024-12-31 或 2024/12/31
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
    // 2024年12月
    /(\d{4})\s*年\s*(\d{1,2})\s*月/,
    // 2024-12
    /(\d{4})[-\/](\d{1,2})(?:[-\/](\d{1,2}))?$/
  ];

  for (const pattern of patterns) {
    const match = cleanDate.match(pattern);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3] ? match[3].padStart(2, '0') : '01';
      
      // 验证日期有效性
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }
  }

  // 无法解析，返回原值
  return cleanDate.substring(0, 10);
}

/**
 * 判断药品是否即将过期（30天内）
 * @param {string} expiryDate - 有效期（YYYY-MM-DD格式）
 * @param {number} days - 提前天数（默认30天）
 * @returns {boolean} 是否即将过期
 */
function isExpiringSoon(expiryDate, days = 30) {
  if (!expiryDate) return false;
  
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return false;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return expiry <= futureDate && expiry >= now;
}

/**
 * 验证药品信息的完整性
 * @param {Object} medicine - 药品对象
 * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
 */
function validateMedicine(medicine) {
  const errors = [];
  
  if (!medicine) {
    return { valid: false, errors: ['药品信息不能为空'] };
  }
  
  if (!medicine.name || medicine.name.trim().length === 0) {
    errors.push('药品名称不能为空');
  }
  
  if (medicine.expiryDate) {
    const expiry = new Date(medicine.expiryDate);
    if (isNaN(expiry.getTime())) {
      errors.push('有效期格式不正确');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate,
  isExpiringSoon,
  validateMedicine
};