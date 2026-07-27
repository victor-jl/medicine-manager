// utils/data-logic.js
// 药品和记录数据的纯逻辑处理函数（可独立测试）

function getExpiringMedicines(medicines, now = new Date(), daysThreshold = 30) {
  if (!Array.isArray(medicines)) return [];

  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
  const thresholdDate = new Date(now.getTime() + thresholdMs);

  return medicines.filter(m => {
    if (!m || !m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    if (isNaN(expiry.getTime())) return false;
    return expiry <= thresholdDate && expiry >= now;
  });
}

function getTodayRecords(records, now = new Date()) {
  if (!Array.isArray(records)) return [];

  const todayStr = now.toDateString();
  return records.filter(r => {
    if (!r || !r.takeTime) return false;
    const takeDate = new Date(r.takeTime);
    if (isNaN(takeDate.getTime())) return false;
    return takeDate.toDateString() === todayStr;
  });
}

function validateMedicine(medicine) {
  const errors = [];

  if (!medicine) {
    errors.push('药品数据不能为空');
    return { valid: false, errors };
  }

  if (!medicine.name || typeof medicine.name !== 'string' || medicine.name.trim() === '') {
    errors.push('药品名称不能为空');
  }

  if (medicine.name && medicine.name.length > 100) {
    errors.push('药品名称不能超过100个字符');
  }

  if (medicine.expiryDate) {
    const d = new Date(medicine.expiryDate);
    if (isNaN(d.getTime())) {
      errors.push('有效期格式不正确');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateRecord(record) {
  const errors = [];

  if (!record) {
    errors.push('记录数据不能为空');
    return { valid: false, errors };
  }

  if (!record.medicineId && record.medicineId !== 0) {
    errors.push('必须关联药品ID');
  }

  if (!record.medicineName || typeof record.medicineName !== 'string' || record.medicineName.trim() === '') {
    errors.push('药品名称不能为空');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function createMedicine(data, now = new Date()) {
  return {
    id: Date.now(),
    name: data.name || '',
    expiryDate: data.expiryDate || '',
    description: data.description || '',
    specification: data.specification || '',
    manufacturer: data.manufacturer || '',
    usage: data.usage || '',
    approvalNumber: data.approvalNumber || '',
    storage: data.storage || '',
    ingredients: data.ingredients || '',
    photos: data.photos || [],
    createTime: now.toLocaleString()
  };
}

function createRecord(medicine, now = new Date()) {
  return {
    id: Date.now(),
    medicineId: medicine.id,
    medicineName: medicine.name,
    takeTime: now.toLocaleString()
  };
}

function deleteById(items, id) {
  if (!Array.isArray(items)) return [];
  return items.filter(item => item.id !== id);
}

function sortByTimeDesc(items) {
  if (!Array.isArray(items)) return [];
  return [...items].reverse();
}

function getMedicineRecords(records, medicineId) {
  if (!Array.isArray(records)) return [];
  return records.filter(r => r.medicineId === medicineId);
}

module.exports = {
  getExpiringMedicines,
  getTodayRecords,
  validateMedicine,
  validateRecord,
  createMedicine,
  createRecord,
  deleteById,
  sortByTimeDesc,
  getMedicineRecords
};
