/**
 * 数据操作工具函数
 */

/**
 * 根据ID删除记录
 * @param {Array} records - 记录列表
 * @param {number|string} id - 要删除的记录ID
 * @returns {Array} 删除后的记录列表
 */
function deleteById(records, id) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.filter(record => record.id !== id);
}

/**
 * 根据条件过滤记录
 * @param {Array} records - 记录列表
 * @param {Function} predicate - 过滤条件函数
 * @returns {Array} 过滤后的记录列表
 */
function filterRecords(records, predicate) {
  if (!Array.isArray(records)) {
    return [];
  }

  if (typeof predicate !== 'function') {
    return [...records];
  }

  return records.filter(predicate);
}

/**
 * 根据药品ID获取关联记录
 * @param {Array} records - 记录列表
 * @param {number|string} medicineId - 药品ID
 * @returns {Array} 该药品的服药记录
 */
function getRecordsByMedicineId(records, medicineId) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.filter(record => record.medicineId === medicineId);
}

/**
 * 根据ID查找记录
 * @param {Array} records - 记录列表
 * @param {number|string} id - 记录ID
 * @returns {Object|null} 找到的记录或null
 */
function findById(records, id) {
  if (!Array.isArray(records)) {
    return null;
  }

  return records.find(record => record.id === id) || null;
}

/**
 * 添加新记录
 * @param {Array} records - 记录列表
 * @param {Object} newRecord - 新记录
 * @returns {Array} 添加后的记录列表
 */
function addRecord(records, newRecord) {
  if (!Array.isArray(records)) {
    return [newRecord];
  }

  return [...records, newRecord];
}

/**
 * 更新记录
 * @param {Array} records - 记录列表
 * @param {number|string} id - 要更新的记录ID
 * @param {Object} updates - 更新内容
 * @returns {Array} 更新后的记录列表
 */
function updateById(records, id, updates) {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.map(record => {
    if (record.id === id) {
      return { ...record, ...updates };
    }
    return record;
  });
}

/**
 * 验证药品信息完整性
 * @param {Object} medicine - 药品对象
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
function validateMedicine(medicine) {
  const errors = [];

  if (!medicine.name || medicine.name.trim() === '') {
    errors.push('药品名称不能为空');
  }

  if (medicine.name && medicine.name.length > 100) {
    errors.push('药品名称不能超过100个字符');
  }

  if (medicine.expiryDate) {
    const expiry = new Date(medicine.expiryDate);
    if (isNaN(expiry.getTime())) {
      errors.push('有效期日期格式无效');
    }
  }

  if (medicine.specification && medicine.specification.length > 50) {
    errors.push('规格不能超过50个字符');
  }

  if (medicine.manufacturer && medicine.manufacturer.length > 100) {
    errors.push('生产厂家不能超过100个字符');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证服药记录
 * @param {Object} record - 记录对象
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
function validateRecord(record) {
  const errors = [];

  if (!record.medicineId) {
    errors.push('药品ID不能为空');
  }

  if (!record.medicineName || record.medicineName.trim() === '') {
    errors.push('药品名称不能为空');
  }

  if (!record.takeTime) {
    errors.push('服药时间不能为空');
  } else {
    const takeTime = new Date(record.takeTime);
    if (isNaN(takeTime.getTime())) {
      errors.push('服药时间格式无效');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成唯一ID
 * @returns {number} 基于时间戳的唯一ID
 */
function generateId() {
  return Date.now();
}

/**
 * 创建药品对象
 * @param {Object} data - 药品数据
 * @returns {Object} 标准化的药品对象
 */
function createMedicine(data) {
  return {
    id: data.id || generateId(),
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
    createTime: data.createTime || new Date().toLocaleString()
  };
}

/**
 * 创建服药记录对象
 * @param {Object} data - 记录数据
 * @returns {Object} 标准化的记录对象
 */
function createRecord(data) {
  return {
    id: data.id || generateId(),
    medicineId: data.medicineId,
    medicineName: data.medicineName,
    takeTime: data.takeTime || new Date().toLocaleString()
  };
}

/**
 * 反转数组顺序（用于显示最新记录）
 * @param {Array} array - 要反转的数组
 * @returns {Array} 反转后的数组
 */
function reverseArray(array) {
  if (!Array.isArray(array)) {
    return [];
  }

  return [...array].reverse();
}

module.exports = {
  deleteById,
  filterRecords,
  getRecordsByMedicineId,
  findById,
  addRecord,
  updateById,
  validateMedicine,
  validateRecord,
  generateId,
  createMedicine,
  createRecord,
  reverseArray
};
