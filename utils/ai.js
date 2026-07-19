// utils/ai.js
// 药品信息分析和处理工具

/**
 * 从OCR识别文本中分析并提取药品信息
 * @param {string} text - OCR识别的文本
 * @returns {Object} 包含药品各字段的对象
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

  // 提取药品名称（通常在最前面）
  const lines = text.split(/[\n\r]+/).filter(line => line.trim());
  if (lines.length > 0) {
    result.name = lines[0].trim().substring(0, 50);
  }

  // 提取规格（优先匹配明确标注的规格字段）
  const explicitSpecMatch = text.match(/(?:规格)[：:]\s*([^\n\r]+)/i);
  if (explicitSpecMatch) {
    result.specification = explicitSpecMatch[1].trim();
  } else {
    // 提取规格（如：0.5g×12片/盒）
    // 先尝试匹配带单位的复杂规格
    let specMatch = text.match(/(\d+\.?\d*\s*[mggml]{1,2}[^。\n\r]{0,20}?(片|粒|胶囊|袋|瓶|盒))/i);
    if (specMatch) {
      result.specification = specMatch[1].trim();
    } else {
      // 尝试匹配简单规格（如：0.1g 或 12片）
      specMatch = text.match(/(\d+\.?\d*\s*(mg|g|ml|片|粒|胶囊|袋|瓶|盒))/i);
      if (specMatch) {
        result.specification = specMatch[1].trim();
      }
    }
  }

  // 提取生产厂家
  const manuMatch = text.match(/(?:生产企业|生产厂商|厂家|生产单位)[：:]\s*([^\n\r]+)/i);
  if (manuMatch) {
    result.manufacturer = manuMatch[1].trim().substring(0, 100);
  }

  // 提取用法用量
  const usageMatch = text.match(/(?:用法用量|用法|服用方法|用量)[：:]\s*([^\n\r]+)/i);
  if (usageMatch) {
    result.usage = usageMatch[1].trim().substring(0, 100);
  }

  // 提取有效期
  const expiryMatch = text.match(/(?:有效期至|有效期)[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{0,2}[日]?)/i);
  if (expiryMatch) {
    result.expiryDate = expiryMatch[1].trim();
  } else {
    // 尝试匹配简单的日期格式
    const dateMatch = text.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{0,2}[日]?)/);
    if (dateMatch) {
      result.expiryDate = dateMatch[1].trim();
    }
  }

  // 提取国药准字
  const approvalMatch = text.match(/(?:国药准字|批准文号)[：:]\s*([A-Z]?\d{7,8})/i);
  if (approvalMatch) {
    result.approvalNumber = approvalMatch[1].trim().substring(0, 50);
  } else {
    // 尝试匹配国药准字+字母数字组合
    const altApprovalMatch = text.match(/国药准字\s*([A-Z]\d+)/i);
    if (altApprovalMatch) {
      result.approvalNumber = altApprovalMatch[1].trim().substring(0, 50);
    }
  }

  // 提取贮藏条件
  const storageMatch = text.match(/(?:贮藏条件|贮藏|储存条件|保存条件)[：:]\s*([^\n\r]+)/i);
  if (storageMatch) {
    result.storage = storageMatch[1].trim().substring(0, 100);
  }

  // 提取成分
  const ingredientMatch = text.match(/(?:主要成分|成份|成分)[：:]\s*([^\n\r]+)/i);
  if (ingredientMatch) {
    result.ingredients = ingredientMatch[1].trim().substring(0, 200);
  }

  return result;
}

/**
 * 格式化有效期日期
 * @param {string} dateStr - 原始日期字符串
 * @returns {string} 格式化后的日期字符串（YYYY-MM-DD）
 */
function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  // 清理输入
  let cleaned = dateStr.trim();

  // 标准化各种日期格式
  // 支持：2024年12月、2024-12、2024/12、202412、2024年12月31日等

  // 移除中文字符
  cleaned = cleaned.replace(/[年月日]/g, match => {
    return match === '年' ? '-' : (match === '月' ? '-' : '');
  });

  // 替换其他分隔符为横线
  cleaned = cleaned.replace(/[\/\.]/g, '-');

  // 如果只有年月，添加默认日期
  if (/^\d{4}-\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned + '-01';
  }

  // 如果是 YYYYMMDD 格式，添加分隔符
  if (/^\d{8}$/.test(cleaned)) {
    cleaned = cleaned.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }

  // 尝试解析并验证
  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      // 返回标准格式
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // 解析失败，返回原始字符串
  }

  return dateStr;
}

/**
 * 计算距离过期还有多少天
 * @param {string} expiryDate - 有效期日期字符串
 * @returns {number} 剩余天数，负数表示已过期
 */
function daysUntilExpiry(expiryDate) {
  if (!expiryDate) return Infinity;

  const formatted = formatExpiryDate(expiryDate);
  if (!formatted) return Infinity;

  try {
    const expiry = new Date(formatted);
    const now = new Date();

    // 验证日期是否有效
    if (isNaN(expiry.getTime())) {
      return Infinity;
    }

    // 重置时间部分，只比较日期
    expiry.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (e) {
    return Infinity;
  }
}

/**
 * 检查药品是否即将过期（30天内）
 * @param {string} expiryDate - 有效期日期字符串
 * @returns {boolean}
 */
function isExpiringSoon(expiryDate) {
  const days = daysUntilExpiry(expiryDate);
  return days >= 0 && days <= 30;
}

/**
 * 检查药品是否已过期
 * @param {string} expiryDate - 有效期日期字符串
 * @returns {boolean}
 */
function isExpired(expiryDate) {
  const days = daysUntilExpiry(expiryDate);
  return days < 0;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate,
  daysUntilExpiry,
  isExpiringSoon,
  isExpired
};