// utils/ai.js
// AI 药品信息分析模块

/**
 * 从OCR识别文本中提取药品信息
 * @param {string} text - OCR识别出的文本
 * @returns {Object} 药品信息对象
 */
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
  const fullText = text.toLowerCase();

  // 提取药品名称 - 通常是第一行或包含药品关键词的行
  const medicineKeywords = [
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
    for (const kw of medicineKeywords) {
      if (lowerLine.includes(kw)) {
        result.name = line.trim().substring(0, 50);
        break;
      }
    }
    if (result.name) break;
  }

  // 如果没找到关键词，使用第一行
  if (!result.name && lines.length > 0) {
    result.name = lines[0].trim().substring(0, 30);
  }

  // 提取有效期 - 匹配常见日期格式
  const expiryPatterns = [
    /有效期[至:到]?\s*(\d{4}[年\-/]\d{1,2}[月\-/]\d{1,2})/i,
    /有效期至\s*(\d{4}\.\d{1,2}\.\d{1,2})/i,
    /(\d{4}[年\-/]\d{1,2}[月\-/]\d{1,2})/,
    /(\d{4}\.\d{1,2}\.\d{1,2})/
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expiryDate = match[1];
      break;
    }
  }

  // 提取规格 - 通常包含数字和单位
  const specMatch = text.match(/规格[：:]\s*([^\n\r]+)/i);
  if (specMatch) {
    result.specification = specMatch[1].trim();
  }

  // 提取生产厂家
  const mfgMatch = text.match(/(?:生产厂家|生产企业|厂商)[：:]\s*([^\n\r]+)/i);
  if (mfgMatch) {
    result.manufacturer = mfgMatch[1].trim();
  }

  // 提取用法用量
  const usageMatch = text.match(/(?:用法用量|用法)[：:]\s*([^\n\r]+)/i);
  if (usageMatch) {
    result.usage = usageMatch[1].trim();
  }

  // 提取国药准字
  const approvalMatch = text.match(/(?:国药准字|批准文号)[：:\s]*([A-Z0-9]+)/i);
  if (approvalMatch) {
    result.approvalNumber = approvalMatch[1].trim();
  }

  // 提取贮藏条件
  const storageMatch = text.match(/(?:贮藏|储存|保存条件)[：:]\s*([^\n\r]+)/i);
  if (storageMatch) {
    result.storage = storageMatch[1].trim();
  }

  // 提取成分
  const ingredientsMatch = text.match(/(?:主要成分|成分)[：:]\s*([^\n\r]+)/i);
  if (ingredientsMatch) {
    result.ingredients = ingredientsMatch[1].trim();
  }

  return result;
}

/**
 * 格式化有效期日期
 * @param {string} expiryDate - 原始日期字符串
 * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
 */
function formatExpiryDate(expiryDate) {
  if (!expiryDate) return '';

  // 清理输入
  let cleaned = expiryDate.trim();

  // 去除前缀（如"有效期至"）
  cleaned = cleaned.replace(/^有效期[至:到]?\s*/i, '');

  // 处理各种分隔符
  cleaned = cleaned.replace(/[年|月]/g, '-').replace(/\./g, '-').replace(/\//g, '-');

  // 解析日期部分
  const datePatterns = [
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // YYYY-MM-DD with extra text
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  ];

  for (const pattern of datePatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // 如果无法解析，返回原始值
  return expiryDate;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};
