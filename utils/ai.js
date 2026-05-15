// utils/ai.js
// AI药品信息解析模块

function analyzeMedicineInfo(text) {
  if (!text) return { name: '', expiryDate: '' };

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

  const keywords = {
    specification: ['规格', 'mg', 'g', 'ml'],
    manufacturer: ['厂家', '生产', '企业', '有限公司', '股份有限公司'],
    usage: ['用法', '用量', '口服', '每日', '每次'],
    approvalNumber: ['准字', '国药准字', '批准文号'],
    storage: ['贮藏', '保存', '储存', '条件'],
    ingredients: ['成分', '主要成分', '本品']
  };

  const lines = text.split(/[\n\r]/);
  
  result.name = extractMedicineName(text);

  const expiryPatterns = [
    /有效期[至:到](\d{4}[年\-/]\d{1,2}[月\-/]\d{1,2}日?)/,
    /有效期至(\d{4}[年\-/]\d{1,2}[月\-/]\d{1,2}日?)/,
    /(\d{4}[年\-/]\d{1,2}[月\-/]\d{1,2}日?)/,
    /(\d{4}\.\d{1,2}\.\d{1,2})/
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.expiryDate = match[1];
      break;
    }
  }

  for (const line of lines) {
    for (const [field, kws] of Object.entries(keywords)) {
      if (kws.some(kw => line.includes(kw))) {
        const value = line.replace(/[^:：]?[：:]\s*/, '').trim();
        if (value && !result[field]) {
          result[field] = value;
        }
      }
    }
  }

  return result;
}

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
    if (lowerText.includes(kw.toLowerCase())) {
      const idx = lowerText.indexOf(kw.toLowerCase());
      const start = Math.max(0, idx - 8);
      const end = Math.min(text.length, idx + kw.length + 10);
      return text.substring(start, end).trim();
    }
  }

  return text.split('\n')[0].trim().substring(0, 30);
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  const cleaned = dateStr.replace(/[年月日]/g, '-').replace(/\/$/, '');

  const match = cleaned.match(/(\d{4})[-/.]?(\d{1,2})[-/.]?(\d{1,2})?/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3] ? match[3].padStart(2, '0') : '01';
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  extractMedicineName,
  formatExpiryDate
};
