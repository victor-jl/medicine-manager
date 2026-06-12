function analyzeMedicineInfo(text) {
  if (!text) return { name: '', expiryDate: '', specification: '', manufacturer: '', usage: '', approvalNumber: '', storage: '', ingredients: '' };

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

  const lines = text.split(/[\n\r]/).filter(line => line.trim());

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (!result.name) {
      const keywords = ['胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '阿莫西林', '布洛芬', '头孢', '感冒灵', '维生素'];
      for (const kw of keywords) {
        if (lowerLine.includes(kw)) {
          result.name = line.trim();
          break;
        }
      }
    }

    if (!result.expiryDate) {
      if (lowerLine.includes('有效期') || lowerLine.includes('expiry') || lowerLine.includes('至') || lowerLine.includes('到期')) {
        const dateMatch = line.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?)/);
        if (dateMatch) {
          result.expiryDate = dateMatch[1];
        } else {
          result.expiryDate = line.replace(/[有效期至：:]/g, '').trim();
        }
      }
    }

    if (!result.specification) {
      if (lowerLine.includes('规格') || lowerLine.includes('spec')) {
        result.specification = line.replace(/[规格：:]/g, '').trim();
      }
    }

    if (!result.manufacturer) {
      if (lowerLine.includes('厂家') || lowerLine.includes('生产') || lowerLine.includes('manufacturer')) {
        result.manufacturer = line.replace(/厂家|生产厂家|manufacturer|：|:/g, '').trim();
      }
    }

    if (!result.approvalNumber) {
      if (lowerLine.includes('国药准字') || lowerLine.includes('批准文号')) {
        result.approvalNumber = line.replace(/[国药准字批准文号：:]/g, '').trim();
      }
    }
  }

  if (!result.name && lines.length > 0) {
    result.name = lines[0].trim().substring(0, 30);
  }

  return result;
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  let result = dateStr;

  result = result.replace(/年/g, '-').replace(/月/g, '-').replace(/日|号/g, '').trim();

  const match = result.match(/(\d{4})[-/]?(\d{1,2})[-/]?(\d{1,2})?/);
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
  formatExpiryDate
};