// utils/ai.js
// AI 分析工具函数 - 用于从 OCR 文本中提取药品信息

/**
 * 从 OCR 识别的文本中提取药品信息
 * @param {string} text - OCR 识别的原始文本
 * @returns {Object} 包含药品信息的对象
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

  const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line);

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

  // 提取药品名称（通常在前几行，包含药品关键词）
  const nameKeywords = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆', '散', '丸'];
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (nameKeywords.some(kw => line.includes(kw))) {
      info.name = line.trim();
      break;
    }
  }

  // 如果没找到，使用第一行
  if (!info.name && lines.length > 0) {
    info.name = lines[0];
  }

  // 提取有效期
  const expiryPatterns = [
    /有效期[至]?[:：]?\s*(\d{4}[/\-年]\d{1,2}[/\-月]\d{0,2}[日]?)/,
    /有效[期日][至]?[:：]?\s*(\d{4}[/\-年]\d{1,2}[/\-月]\d{0,2}[日]?)/,
    /效期[至]?[:：]?\s*(\d{4}[/\-年]\d{1,2}[/\-月]\d{0,2}[日]?)/,
    /(\d{4}[/\-年]\d{1,2}[/\-月]\d{0,2}[日]?)\s*[前到期]/,
    /(20\d{2}[\/\-]\d{1,2}[\/\-]\d{1,2})/
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.expiryDate = match[1];
      break;
    }
  }

  // 提取规格
  const specMatch = text.match(/规格[:：]?\s*([^\n\r]{2,20})/);
  if (specMatch) {
    info.specification = specMatch[1].trim();
  }

  // 提取生产厂家
  const mfgPatterns = [
    /生产企业[\s:：]+\s*([^\n\r]{2,30})/,
    /生产厂商[\s:：]+\s*([^\n\r]{2,30})/,
    /企业名称[\s:：]+\s*([^\n\r]{2,30})/
  ];
  for (const pattern of mfgPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.manufacturer = match[1].trim();
      break;
    }
  }

  // 提取用法用量
  const usagePatterns = [
    /用法用量[:：]?\s*([^\n\r]{2,50})/,
    /用法[:：]?\s*([^\n\r]{2,30})/,
    /用量[:：]?\s*([^\n\r]{2,30})/
  ];
  for (const pattern of usagePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.usage = match[1].trim();
      break;
    }
  }

  // 提取批准文号
  const approvalMatch = text.match(/国药准字[ABCDEFGHIJZ]?[0-9]{8}/);
  if (approvalMatch) {
    info.approvalNumber = approvalMatch[0];
  }

  // 提取贮藏条件
  const storageMatch = text.match(/贮藏?[:：]?\s*([^\n\r]{2,30})/);
  if (storageMatch) {
    info.storage = storageMatch[1].trim();
  }

  // 提取成分
  const ingredientMatch = text.match(/成分[:：]?\s*([^\n\r]{2,100})/);
  if (ingredientMatch) {
    info.ingredients = ingredientMatch[1].trim();
  }

  return info;
}

/**
 * 格式化有效期日期为标准格式 (YYYY-MM-DD)
 * @param {string} dateStr - 原始日期字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatExpiryDate(dateStr) {
  if (!dateStr) {
    return '';
  }

  // 如果不是字符串，返回原值
  if (typeof dateStr !== 'string') {
    return dateStr;
  }

  // 清理输入
  let cleaned = dateStr.trim();

  // 提取数字和分隔符
  const numbers = cleaned.match(/\d+/g);
  if (!numbers || numbers.length < 2) {
    return cleaned; // 无法解析，返回原值
  }

  let year = '';
  let month = '';
  let day = '01'; // 默认为月初

  // 尝试解析不同格式
  if (numbers.length >= 2) {
    if (numbers[0].length === 4) {
      // 格式: YYYY-MM 或 YYYY-MM-DD
      year = numbers[0];
      month = numbers[1].padStart(2, '0');
      if (numbers.length >= 3) {
        day = numbers[2].padStart(2, '0');
      }
    } else if (numbers[0].length === 2 && numbers[1].length === 2) {
      // 可能是 YY-MM 格式
      const num0 = parseInt(numbers[0]);
      if (num0 > 12) {
        // 应该是年份
        year = num0 >= 70 ? `19${numbers[0]}` : `20${numbers[0]}`;
        month = numbers[1].padStart(2, '0');
      } else {
        // 可能是 月-年 格式 (MM-YY)，或者需要更多上下文
        // 假设是 月-年 格式
        month = numbers[0].padStart(2, '0');
        year = parseInt(numbers[1]) >= 70 ? `19${numbers[1]}` : `20${numbers[1]}`;
      }
      if (numbers.length >= 3) {
        day = numbers[2].padStart(2, '0');
      }
    }
  }

  if (!year || !month) {
    return cleaned; // 无法解析，返回原值
  }

  // 验证日期有效性
  const parsedDate = new Date(`${year}-${month}-${day}`);
  if (isNaN(parsedDate.getTime())) {
    return cleaned;
  }

  return `${year}-${month}-${day}`;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};