// utils/data.js
// 数据过滤与业务逻辑工具函数

function getExpiringMedicines(medicines, withinDays = 30, now = new Date()) {
  if (!Array.isArray(medicines)) return [];

  const threshold = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  return medicines.filter(m => {
    if (!m || !m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    if (isNaN(expiry.getTime())) return false;
    return expiry <= threshold && expiry >= now;
  });
}

function getTodayRecords(records, now = new Date()) {
  if (!Array.isArray(records)) return [];

  const today = now.toDateString();
  return records.filter(r => {
    if (!r || !r.takeTime) return false;
    const takeDate = new Date(r.takeTime);
    if (isNaN(takeDate.getTime())) return false;
    return takeDate.toDateString() === today;
  });
}

function getMedicineRecords(records, medicineId) {
  if (!Array.isArray(records)) return [];
  if (medicineId === undefined || medicineId === null) return [];

  return records.filter(r => r && r.medicineId === medicineId);
}

function validateMedicine(medicine) {
  const errors = [];

  if (!medicine || typeof medicine !== 'object') {
    return ['药品数据无效'];
  }

  if (!medicine.name || typeof medicine.name !== 'string' || !medicine.name.trim()) {
    errors.push('药品名称不能为空');
  }

  if (medicine.name && medicine.name.length > 100) {
    errors.push('药品名称不能超过100个字符');
  }

  if (medicine.expiryDate) {
    const expiry = new Date(medicine.expiryDate);
    if (isNaN(expiry.getTime())) {
      errors.push('有效期格式无效');
    }
  }

  if (medicine.approvalNumber && !/^[A-Za-z0-9]{6,}$/.test(medicine.approvalNumber)) {
    errors.push('批准文号格式无效');
  }

  return errors;
}

module.exports = {
  getExpiringMedicines,
  getTodayRecords,
  getMedicineRecords,
  validateMedicine
};
