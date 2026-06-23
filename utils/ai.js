// utils/ai.js
// AI分析药品信息

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

  const lines = text.split(/[\n\r]/).filter(line => line.trim());

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (!info.name && (
      lowerLine.includes('胶囊') || lowerLine.includes('片') || 
      lowerLine.includes('颗粒') || lowerLine.includes('口服液') ||
      lowerLine.includes('注射液') || lowerLine.includes('软膏') ||
      lowerLine.includes('阿莫西林') || lowerLine.includes('布洛芬') ||
      lowerLine.includes('头孢') || lowerLine.includes('维生素')
    )) {
      info.name = line.trim();
    }

    if (!info.expiryDate && (
      lowerLine.includes('有效期') || lowerLine.includes('expiry') || 
      lowerLine.includes('效期') || lowerLine.includes('至') ||
      lowerLine.includes('过期') || lowerLine.includes('expires')
    )) {
      const match = line.match(/(\d{4}[-/]?\d{1,2}[-/]?\d{1,2})/);
      if (match) {
        info.expiryDate = match[1];
      }
    }

    if (!info.specification && (lowerLine.includes('规格') || lowerLine.includes('spec'))) {
      info.specification = line.replace(/[规格:：]/g, '').trim();
    }

    if (!info.manufacturer && (lowerLine.includes('生产') || lowerLine.includes('厂家') || lowerLine.includes('公司'))) {
      info.manufacturer = line.replace(/[生产厂家:：公司]/g, '').trim();
    }

    if (!info.approvalNumber && lowerLine.includes('国药准字')) {
      info.approvalNumber = line.match(/国药准字[\w\d]+/)?.[0] || line.trim();
    }
  }

  if (!info.name && lines.length > 0) {
    info.name = lines[0].trim().substring(0, 30);
  }

  return info;
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  const cleaned = dateStr.replace(/[年月日/-]/g, '-');
  const parts = cleaned.split('-').filter(p => p);

  if (parts.length === 3) {
    const year = parts[0].padStart(4, '20');
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (parts.length === 2) {
    const year = new Date().getFullYear();
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};