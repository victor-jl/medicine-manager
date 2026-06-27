function isMedicineExpiring(medicine, days = 30) {
  if (!medicine || !medicine.expiryDate) {
    return false;
  }
  
  const now = new Date();
  const expiry = new Date(medicine.expiryDate);
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return expiry <= threshold && expiry >= now;
}

function isMedicineExpired(medicine) {
  if (!medicine || !medicine.expiryDate) {
    return false;
  }
  
  const now = new Date();
  const expiry = new Date(medicine.expiryDate);
  
  return expiry < now;
}

function filterExpiringMedicines(medicines, days = 30) {
  if (!Array.isArray(medicines)) {
    return [];
  }
  
  return medicines.filter(m => isMedicineExpiring(m, days));
}

function filterTodayRecords(records) {
  if (!Array.isArray(records)) {
    return [];
  }
  
  const today = new Date().toDateString();
  
  return records.filter(r => {
    if (!r.takeTime) return false;
    return new Date(r.takeTime).toDateString() === today;
  });
}

function validateMedicine(medicine) {
  const errors = [];
  
  if (!medicine || typeof medicine !== 'object') {
    errors.push('药品数据必须是对象');
    return { valid: false, errors };
  }
  
  if (!medicine.name || !medicine.name.trim()) {
    errors.push('药品名称不能为空');
  }
  
  if (medicine.expiryDate) {
    const expiry = new Date(medicine.expiryDate);
    if (isNaN(expiry.getTime())) {
      errors.push('有效期格式不正确');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function getMedicineById(medicines, id) {
  if (!Array.isArray(medicines)) {
    return null;
  }
  
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  return medicines.find(m => m.id === numericId) || null;
}

function filterRecordsByMedicineId(records, medicineId) {
  if (!Array.isArray(records)) {
    return [];
  }
  
  const numericId = typeof medicineId === 'string' ? parseInt(medicineId, 10) : medicineId;
  
  return records.filter(r => r.medicineId === numericId);
}

module.exports = {
  isMedicineExpiring,
  isMedicineExpired,
  filterExpiringMedicines,
  filterTodayRecords,
  validateMedicine,
  getMedicineById,
  filterRecordsByMedicineId
};