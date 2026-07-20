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

  const nameMatch = text.match(/([^\s]{1,20}(?:胶囊|片(?:剂)?|颗粒|口服液|注射液|软膏|贴剂|滴眼液|糖浆))/);
  const expiryMatch = text.match(/(\d{4})[年\-/](\d{1,2})[月\-/]?(\d{1,2})?/);

  return {
    name: nameMatch ? nameMatch[1] : '',
    expiryDate: expiryMatch ? `${expiryMatch[1]}-${String(expiryMatch[2]).padStart(2, '0')}` : '',
    specification: '',
    manufacturer: '',
    usage: '',
    approvalNumber: '',
    storage: '',
    ingredients: ''
  };
}

function formatExpiryDate(date) {
  return date || '';
}

module.exports = {
  analyzeMedicineInfo,
  formatExpiryDate
};
