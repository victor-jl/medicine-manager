// utils/ai.js
// 药品信息智能分析工具

/**
 * 从OCR识别文本中分析和提取药品信息
 * @param {string} text - OCR识别的原始文本
 * @returns {Object} 提取的药品信息对象
 */
function analyzeMedicineInfo(text) {
  if (!text || typeof text !== 'string') {
    return {
      name: '',
      specification: '',
      manufacturer: '',
      usage: '',
      approvalNumber: '',
      storage: '',
      ingredients: '',
      expiryDate: ''
    };
  }

  const result = {
    name: '',
    specification: '',
    manufacturer: '',
    usage: '',
    approvalNumber: '',
    storage: '',
    ingredients: '',
    expiryDate: ''
  };

  const lines = text.split(/[\n\r]+/).filter(line => line.trim());

  // 提取药品名称（通常是第一个非空行或包含特定关键词）
  for (const line of lines) {
    const nameMatch = extractMedicineName(line);
    if (nameMatch) {
      result.name = nameMatch;
      break;
    }
  }

  // 如果没找到，使用第一行
  if (!result.name && lines.length > 0) {
    result.name = lines[0].substring(0, 30).trim();
  }

  // 提取规格
  const specPatterns = [
    /规格[：:]\s*(.+?)(?:\n|$|[生产批准])/,
    /(\d+\.?\d*\s*(?:g|mg|ml|克|毫升))/
  ];
  for (const pattern of specPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.specification = match[1] || match[0];
      break;
    }
  }

  // 提取生产厂家
  const manuPatterns = [
    /生产(?:厂家|企业)[：:]\s*(.+?)(?:\n|$)/,
    /生产企业[：:]\s*(.+?)(?:\n|$)/
  ];
  for (const pattern of manuPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.manufacturer = match[1].trim();
      break;
    }
  }

  // 提取用法用量
  const usagePatterns = [
    /用法用量[：:]\s*(.+?)(?:\n|$)/,
    /用法[：:]\s*(.+?)(?:\n|$)/
  ];
  for (const pattern of usagePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.usage = match[1].trim();
      break;
    }
  }

  // 提取国药准字
  const approvalMatch = text.match(/国药准字[A-Z]\d{8}/);
  if (approvalMatch) {
    result.approvalNumber = approvalMatch[0];
  }

  // 提取贮藏条件
  const storagePatterns = [
    /贮藏[：:]\s*(.+?)(?:\n|$)/,
    /贮存[：:]\s*(.+?)(?:\n|$)/,
    /保存[：:]\s*(.+?)(?:\n|$)/
  ];
  for (const pattern of storagePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.storage = match[1].trim();
      break;
    }
  }

  // 提取成分
  const ingredientMatch = text.match(/[主要]?成分[：:]\s*(.+?)(?:\n|$)/);
  if (ingredientMatch) {
    result.ingredients = ingredientMatch[1].trim();
  }

  // 提取有效期
  const expiryPatterns = [
    /有效期[至到]?[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{0,2}日?)/,
    /有效期[至到]?[：:]\s*(\d{4}[-年]\d{1,2}[-月]?)/,
    /有效期[：:]\s*(\d+\s*个月?)/
  ];
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expiryDate = match[1];
      break;
    }
  }

  return result;
}

/**
 * 从单行文本中提取药品名称
 */
function extractMedicineName(line) {
  const keywords = [
    '胶囊', '片剂', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂',
    '滴眼液', '糖浆', '丸', '散', '合剂', '酊剂', '气雾剂'
  ];

  for (const keyword of keywords) {
    if (line.includes(keyword)) {
      const index = line.indexOf(keyword);
      const start = Math.max(0, index - 10);
      const end = Math.min(line.length, index + keyword.length + 2);
      return line.substring(start, end).trim();
    }
  }

  return null;
}

/**
 * 格式化有效期日期
 * @param {string} expiryDate - 原始有效期字符串
 * @returns {string} 格式化后的日期 (YYYY-MM-DD)
 */
function formatExpiryDate(expiryDate) {
  if (!expiryDate) return '';

  // 清理输入
  let cleaned = expiryDate.trim();

  // 如果已经是标准格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // 如果是 YYYY年MM月DD日 格式
  const chinesePattern = cleaned.match(/(\d{4})年(\d{1,2})月(\d{0,2})日?/);
  if (chinesePattern) {
    const year = chinesePattern[1];
    const month = chinesePattern[2].padStart(2, '0');
    const day = chinesePattern[3] ? chinesePattern[3].padStart(2, '0') : '01';
    return `${year}-${month}-${day}`;
  }

  // 如果是 YYYY-MM 或 YYYY年MM月 格式
  const monthPattern = cleaned.match(/(\d{4})[-年](\d{1,2})[-月]?/);
  if (monthPattern) {
    const year = monthPattern[1];
    const month = monthPattern[2].padStart(2, '0');
    return `${year}-${month}-01`;
  }

  // 如果是相对日期（如"24个月"）
  const relativePattern = cleaned.match(/(\d+)\s*个?月/);
  if (relativePattern) {
    const months = parseInt(relativePattern[1]);
    const future = new Date();
    future.setMonth(future.getMonth() + months);
    const year = future.getFullYear();
    const month = String(future.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }

  // 尝试解析其他格式
  try {
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // 解析失败，返回原值
  }

  return cleaned;
}

/**
 * 验证药品数据完整性
 * @param {Object} medicine - 药品对象
 * @returns {Object} 验证结果
 */
function validateMedicine(medicine) {
  const errors = [];

  if (!medicine.name || medicine.name.trim() === '') {
    errors.push('药品名称不能为空');
  }

  if (medicine.name && medicine.name.length > 100) {
    errors.push('药品名称过长');
  }

  if (medicine.expiryDate) {
    const expiry = new Date(medicine.expiryDate);
    if (isNaN(expiry.getTime())) {
      errors.push('有效期格式不正确');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate,
  validateMedicine
};