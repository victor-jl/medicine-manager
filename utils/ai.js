// utils/ai.js
// AI 辅助分析药品信息

/**
 * 分析药品信息
 * @param {string} text - OCR识别的文本
 * @returns {Object} 解析出的药品信息
 */
function analyzeMedicineInfo(text) {
  if (!text) {
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

  const lines = text.split(/[\n\r]/).filter(line => line.trim());

  // 提取药品名称（通常在第一行或包含关键词）
  result.name = extractMedicineName(text);

  // 提取规格
  const specMatch = text.match(/规格[：:]\s*([^\n\r]+)/);
  if (specMatch) {
    result.specification = specMatch[1].trim();
  } else {
    // 尝试匹配常见规格格式
    const specPattern = text.match(/(\d+(?:\.\d+)?(?:mg|g|ml|片|粒|袋|支|瓶)(?:\/[^\s\n\r]+)?)/i);
    if (specPattern) {
      result.specification = specPattern[1];
    }
  }

  // 提取生产厂家
  const manuMatch = text.match(/(?:生产|生产厂|生产企业)[企业商]?[：:]\s*([^\n\r]+)/);
  if (manuMatch) {
    result.manufacturer = manuMatch[1].trim();
  }

  // 提取用法用量
  const usageMatch = text.match(/(?:用法|用法用量)[：:]\s*([^\n\r]+)/);
  if (usageMatch) {
    result.usage = usageMatch[1].trim();
  }

  // 提取有效期
  const expiryMatch = text.match(/(?:有效期|有效期至)[：:]\s*([^\n\r]+)/);
  if (expiryMatch) {
    result.expiryDate = expiryMatch[1].trim();
  } else {
    // 尝试匹配日期格式
    const dateMatch = text.match(/(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}日?)/);
    if (dateMatch) {
      result.expiryDate = dateMatch[1];
    }
  }

  // 提取国药准字
  const approvalMatch = text.match(/(?:国药准字|批准文号)[：:]\s*([^\n\r]+)/);
  if (approvalMatch) {
    result.approvalNumber = approvalMatch[1].trim();
  } else {
    // 尝试匹配国药准字格式
    const approvalPattern = text.match(/(国药准字[A-Z]\d{8})/);
    if (approvalPattern) {
      result.approvalNumber = approvalPattern[1];
    }
  }

  // 提取贮藏条件
  const storageMatch = text.match(/(?:贮藏|贮存)[：:]\s*([^\n\r]+)/);
  if (storageMatch) {
    result.storage = storageMatch[1].trim();
  }

  // 提取成分
  const ingredientMatch = text.match(/(?:主要成分|成分)[：:]\s*([^\n\r]+)/);
  if (ingredientMatch) {
    result.ingredients = ingredientMatch[1].trim();
  }

  return result;
}

/**
 * 从文本中提取药品名称
 */
function extractMedicineName(text) {
  if (!text) return '';

  const keywords = [
    '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆',
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素', '罗红霉素',
    '感冒灵', '感冒清热', '板蓝根', '双黄连', '莲花清瘟',
    '维生素', '钙片', '铁剂', '锌', '叶酸',
    '奥美拉唑', '兰索拉唑', '泮托拉唑',
    '硝苯地平', '氨氯地平', '贝那普利',
    '二甲双胍', '格列本脲', '胰岛素',
    '阿司匹林', '氯吡格雷', '他汀',
    '氯雷他定', '西替利嗪', '蒙脱石',
    '止咳', '祛痰', '平喘', '消炎', '退烧', '止痛'
  ];

  const lowerText = text.toLowerCase();

  for (const kw of keywords) {
    if (lowerText.includes(kw)) {
      const idx = lowerText.indexOf(kw);
      const start = Math.max(0, idx - 8);
      const end = Math.min(text.length, idx + kw.length + 10);
      return text.substring(start, end).trim();
    }
  }

  // 返回第一行作为默认
  return text.split('\n')[0].trim().substring(0, 30);
}

/**
 * 格式化有效期日期
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  // 已经是标准格式 YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // 处理 YYYY年MM月DD日 格式
  const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (chineseMatch) {
    const year = chineseMatch[1];
    const month = chineseMatch[2].padStart(2, '0');
    const day = chineseMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 处理 YYYY/MM/DD 格式
  const slashMatch = dateStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const year = slashMatch[1];
    const month = slashMatch[2].padStart(2, '0');
    const day = slashMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 处理 YYYY.MM.DD 格式
  const dotMatch = dateStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (dotMatch) {
    const year = dotMatch[1];
    const month = dotMatch[2].padStart(2, '0');
    const day = dotMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 无法解析，返回原值
  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  extractMedicineName,
  formatExpiryDate
};