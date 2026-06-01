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

  if (lines.length > 0) {
    result.name = extractMedicineName(text);
  }

  const expiryPattern = /(?:有效期至?|至|失效|EXP|EXP\.?)\s*[:：]?\s*(\d{4}[年\-/\.]\d{1,2}[月\-/\.日]*\d{0,2}[日]*|\d{4}\.\d{1,2}\.\d{1,2})/i;
  const expiryMatch = text.match(expiryPattern);
  if (expiryMatch) {
    result.expiryDate = formatExpiryDate(expiryMatch[1]);
  }

  const specPatterns = [
    /(?:规格|剂型|包装)\s*[:：]\s*([^\n\r,，]+)/i,
    /(\d+[mgµgMl微克粒片颗]+\s*(?:x|×|:：)?\s*\d*\s*(?:粒|片|支|袋|盒|板))/i
  ];
  for (const pattern of specPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.specification = match[1].trim();
      break;
    }
  }

  const mfrPatterns = [
    /(?:生产|厂家|制药|企业)\s*[:：]\s*([^\n\r,，]+)/i,
    /(?:有限公司|制药厂|药业)\s*[^\n\r]*/i
  ];
  for (const pattern of mfrPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.manufacturer = match[1].trim() || match[0].trim();
      break;
    }
  }

  const usagePattern = /(?:用量|用法用量|服用|一次|每次)\s*[:：]?\s*([^\n\r,，]+)/i;
  const usageMatch = text.match(usagePattern);
  if (usageMatch) {
    result.usage = usageMatch[1].trim();
  }

  const approvalPattern = /(?:国药准字|批准文号|注册证号)\s*[:：]?\s*([A-Z0-9]+)/i;
  const approvalMatch = text.match(approvalPattern);
  if (approvalMatch) {
    result.approvalNumber = approvalMatch[1].trim();
  }

  const storagePattern = /(?:贮藏|储存|存放|保存|存储)\s*[:：]\s*([^\n\r,，]+)/i;
  const storageMatch = text.match(storagePattern);
  if (storageMatch) {
    result.storage = storageMatch[1].trim();
  }

  const ingredientPatterns = [
    /(?:主要成分|成分|配方)\s*[:：]\s*([^\n\r,，]+)/i
  ];
  for (const pattern of ingredientPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.ingredients = match[1].trim();
      break;
    }
  }

  return result;
}

function extractMedicineName(text) {
  if (!text) return '';

  const lines = text.split(/[\n\r]+/).filter(line => line.trim());

  const medicineKeywords = [
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

  for (const kw of medicineKeywords) {
    if (lowerText.includes(kw)) {
      const idx = lowerText.indexOf(kw);
      const start = Math.max(0, idx - 10);
      const end = Math.min(text.length, idx + kw.length + 15);
      return text.substring(start, end).trim();
    }
  }

  return lines.length > 0 ? lines[0].trim().substring(0, 50) : text.substring(0, 30);
}

function formatExpiryDate(expiryStr) {
  if (!expiryStr) return '';

  const patterns = [
    /(\d{4})[年\-/](\d{1,2})[月\-/](\d{1,2})/,
    /(\d{4})\.(\d{1,2})\.(\d{1,2})/
  ];

  for (const pattern of patterns) {
    const match = expiryStr.match(pattern);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  const simplePattern = /(\d{4})(\d{2})(\d{2})/;
  const simpleMatch = expiryStr.match(simplePattern);
  if (simpleMatch) {
    return `${simpleMatch[1]}-${simpleMatch[2]}-${simpleMatch[3]}`;
  }

  return expiryStr;
}

module.exports = {
  analyzeMedicineInfo,
  extractMedicineName,
  formatExpiryDate
};
