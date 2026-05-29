const { extractMedicineName } = require('./ocr');

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

  const lines = text.split(/[\n\r]+/).filter(line => line.trim());
  const fullText = text.toLowerCase();

  const name = extractMedicineName(text) || lines[0] || '';

  let expiryDate = '';
  const expiryPatterns = [
    /有效期[至:到]?\s*(\d{4}[年\-]\d{1,2}[月\-]?\d{0,2}日?)/i,
    /有效期至\s*(\d{4}\.\d{2}\.\d{2})/i,
    /exp\.?\s*(\d{4}-\d{2}-\d{2})/i,
    /(\d{4}[年\-]\d{1,2}[月\-]?\d{0,2}日?)/
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      expiryDate = formatExpiryDate(match[1]);
      break;
    }
  }

  let specification = '';
  const specPatterns = [
    /(\d+(?:\.\d+)?)\s*(g|mg|ml|iu|μg|ug)\s*[×x×]\s*(\d+)\s*(粒|片|支|袋|瓶|盒)/i,
    /规格[：:]\s*(.+?)(?=\n|$)/i,
    /(\d+(?:\.\d+)?)\s*(g|mg|ml|iu|μg|ug)/
  ];

  for (const pattern of specPatterns) {
    const match = text.match(pattern);
    if (match) {
      specification = match[0].replace(/规格[：:]/, '').trim();
      break;
    }
  }

  let manufacturer = '';
  const mfrPatterns = [
    /生产(?:企)?业[：:]\s*(.+?)(?=\n|$)/i,
    /生产(?:厂|家|商)[：:]\s*(.+?)(?=\n|$)/i,
    /manufacturer[：:]\s*(.+?)(?=\n|$)/i,
    /持证商[：:]\s*(.+?)(?=\n|$)/i
  ];

  for (const pattern of mfrPatterns) {
    const match = text.match(pattern);
    if (match) {
      manufacturer = match[1].trim();
      break;
    }
  }

  let usage = '';
  const usagePatterns = [
    /用法用量[：:]\s*(.+?)(?=\n|$)/i,
    /用法[：:]\s*(.+?)(?=\n|$)/i
  ];

  for (const pattern of usagePatterns) {
    const match = text.match(pattern);
    if (match) {
      usage = match[1].trim();
      break;
    }
  }

  let approvalNumber = '';
  const approvalPatterns = [
    /国药准字[（(]?([A-Z0-9]+)[)）]?/i,
    /批准文号[：:]\s*([A-Z0-9]+)/i
  ];

  for (const pattern of approvalPatterns) {
    const match = text.match(pattern);
    if (match) {
      approvalNumber = match[1].trim();
      break;
    }
  }

  let storage = '';
  const storagePatterns = [
    /贮藏[条件]?[：:]\s*(.+?)(?=\n|$)/i,
    /储存[条件]?[：:]\s*(.+?)(?=\n|$)/i,
    /storage[：:]\s*(.+?)(?=\n|$)/i
  ];

  for (const pattern of storagePatterns) {
    const match = text.match(pattern);
    if (match) {
      storage = match[1].trim();
      break;
    }
  }

  let ingredients = '';
  const ingredientPatterns = [
    /主要成分[：:]\s*(.+?)(?=\n|$)/i,
    /成分[：:]\s*(.+?)(?=\n|$)/i,
    /ingredients?[：:]\s*(.+?)(?=\n|$)/i
  ];

  for (const pattern of ingredientPatterns) {
    const match = text.match(pattern);
    if (match) {
      ingredients = match[1].trim();
      break;
    }
  }

  return {
    name,
    expiryDate,
    specification,
    manufacturer,
    usage,
    approvalNumber,
    storage,
    ingredients
  };
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  const cleaned = dateStr.replace(/[年\s]/g, '').replace(/日$/, '');
  
  const separators = ['-', '.', '/'];
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep);
      if (parts.length >= 2) {
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2] ? parts[2].padStart(2, '0') : '01';
        return `${year}-${month}-${day}`;
      }
    }
  }

  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }

  if (/^\d{6}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-01`;
  }

  return dateStr;
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};
