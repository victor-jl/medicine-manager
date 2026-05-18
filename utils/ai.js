/**
 * utils/ai.js - AI药品信息分析模块（模拟实现）
 * 用于从OCR识别的文本中提取药品详细信息
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
      result.name = text.substring(start, end).trim();
      break;
    }
  }

  if (!result.name) {
    result.name = text.split('\n')[0].trim().substring(0, 30);
  }

  const expiryMatch = text.match(/有效期[至:：]?\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}?)/);
  if (expiryMatch) {
    result.expiryDate = expiryMatch[1].replace(/年/g, '-').replace(/月/g, '-');
  }

  const specMatch = text.match(/规格[：:]\s*([^\n]+)/);
  if (specMatch) {
    result.specification = specMatch[1].trim();
  }

  const mfrMatch = text.match(/(?:生产企业?|厂家)[：:]\s*([^\n]+)/i);
  if (mfrMatch) {
    result.manufacturer = mfrMatch[1].trim();
  }

  const usageMatch = text.match(/(?:用法用量?|服用方法)[：:]\s*([^\n]+)/i);
  if (usageMatch) {
    result.usage = usageMatch[1].trim();
  }

  const approvalMatch = text.match(/(?:批准文号|国药准字)[：:]\s*([A-Z]\d+)/i);
  if (approvalMatch) {
    result.approvalNumber = approvalMatch[1].trim();
  }

  return result;
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';
  
  try {
    const parts = dateStr.match(/\d+/g);
    if (!parts || parts.length < 2) return dateStr;
    
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts.length === 2) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}`;
    }
    
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};
