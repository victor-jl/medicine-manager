/**
 * 药品有效期管理工具函数
 */

/**
 * 获取即将过期的药品列表
 * @param {Array} medicines - 药品列表
 * @param {number} days - 提前多少天提醒（默认30天）
 * @returns {Array} 即将过期的药品列表
 */
function getExpiringMedicines(medicines, days = 30) {
  if (!Array.isArray(medicines)) {
    return [];
  }

  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return medicines.filter(medicine => {
    if (!medicine.expiryDate) {
      return false;
    }

    const expiry = new Date(medicine.expiryDate);
    return expiry <= threshold && expiry >= now;
  });
}

/**
 * 获取已过期的药品列表
 * @param {Array} medicines - 药品列表
 * @returns {Array} 已过期的药品列表
 */
function getExpiredMedicines(medicines) {
  if (!Array.isArray(medicines)) {
    return [];
  }

  const now = new Date();

  return medicines.filter(medicine => {
    if (!medicine.expiryDate) {
      return false;
    }

    const expiry = new Date(medicine.expiryDate);
    return expiry < now;
  });
}

/**
 * 获取今日的服药记录
 * @param {Array} records - 服药记录列表
 * @returns {Array} 今日的服药记录
 */
function getTodayRecords(records) {
  if (!Array.isArray(records)) {
    return [];
  }

  const today = new Date().toDateString();

  return records.filter(record => {
    if (!record.takeTime) {
      return false;
    }

    const recordDate = new Date(record.takeTime).toDateString();
    return recordDate === today;
  });
}

/**
 * 计算药品剩余天数
 * @param {string} expiryDate - 有效期日期字符串
 * @returns {number|null} 剩余天数，如果日期无效返回null
 */
function calculateRemainingDays(expiryDate) {
  if (!expiryDate) {
    return null;
  }

  const expiry = new Date(expiryDate);
  const now = new Date();
  
  if (isNaN(expiry.getTime())) {
    return null;
  }

  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * 检查药品是否即将过期
 * @param {string} expiryDate - 有效期日期字符串
 * @param {number} thresholdDays - 阈值天数（默认30天）
 * @returns {boolean}
 */
function isExpiringSoon(expiryDate, thresholdDays = 30) {
  const remainingDays = calculateRemainingDays(expiryDate);
  
  if (remainingDays === null) {
    return false;
  }

  return remainingDays >= 0 && remainingDays <= thresholdDays;
}

/**
 * 检查药品是否已过期
 * @param {string} expiryDate - 有效期日期字符串
 * @returns {boolean}
 */
function isExpired(expiryDate) {
  const remainingDays = calculateRemainingDays(expiryDate);
  
  if (remainingDays === null) {
    return false;
  }

  return remainingDays < 0;
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!date) {
    return '';
  }

  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

module.exports = {
  getExpiringMedicines,
  getExpiredMedicines,
  getTodayRecords,
  calculateRemainingDays,
  isExpiringSoon,
  isExpired,
  formatDate
};
