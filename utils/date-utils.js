// utils/date-utils.js
// 日期计算和业务逻辑工具函数（纯函数，可测试）

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isExpiringWithin(expiryDate, days, now = new Date()) {
  if (!expiryDate) return false;

  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return false;

  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return expiry <= threshold && expiry >= now;
}

function isExpiringInThirtyDays(expiryDate, now = new Date()) {
  return isExpiringWithin(expiryDate, 30, now);
}

function filterExpiringMedicines(medicines, days = 30, now = new Date()) {
  if (!Array.isArray(medicines)) return [];
  return medicines.filter(m => isExpiringWithin(m.expiryDate, days, now));
}

function isToday(dateStr, now = new Date()) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  return date.toDateString() === now.toDateString();
}

function filterTodayRecords(records, now = new Date()) {
  if (!Array.isArray(records)) return [];
  return records.filter(r => isToday(r.takeTime, now));
}

function validateMedicineData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return ['药品数据不能为空'];
  }

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('药品名称不能为空');
  }

  if (data.expiryDate) {
    const expiry = new Date(data.expiryDate);
    if (isNaN(expiry.getTime())) {
      errors.push('有效期格式无效');
    }
  }

  return errors;
}

function isMedicineValid(data) {
  return validateMedicineData(data).length === 0;
}

module.exports = {
  THIRTY_DAYS_MS,
  isExpiringWithin,
  isExpiringInThirtyDays,
  filterExpiringMedicines,
  isToday,
  filterTodayRecords,
  validateMedicineData,
  isMedicineValid
};
