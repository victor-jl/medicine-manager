// utils/validation.js
// 数据验证工具函数

/**
 * 验证药品数据的函数
 * @param {Object} medicine - 药品对象
 * @returns {Object} 验证结果 {valid: boolean, errors: string[]}
 */
function validateMedicine(medicine) {
  const errors = [];

  // 必填字段验证
  if (!medicine || typeof medicine !== 'object') {
    return { valid: false, errors: ['药品数据不能为空'] };
  }

  // 药品名称必填
  if (!medicine.name || medicine.name.trim() === '') {
    errors.push('药品名称不能为空');
  }

  // 名称长度限制
  if (medicine.name && medicine.name.length > 50) {
    errors.push('药品名称长度不能超过50个字符');
  }

  // 有效期验证
  if (medicine.expiryDate) {
    const date = new Date(medicine.expiryDate);
    if (isNaN(date.getTime())) {
      errors.push('有效期格式不正确');
    }
  }

  // 规格长度限制
  if (medicine.specification && medicine.specification.length > 100) {
    errors.push('规格长度不能超过100个字符');
  }

  // 生产厂家长度限制
  if (medicine.manufacturer && medicine.manufacturer.length > 100) {
    errors.push('生产厂家长度不能超过100个字符');
  }

  // 用法用量长度限制
  if (medicine.usage && medicine.usage.length > 200) {
    errors.push('用法用量长度不能超过200个字符');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * 验证服药记录数据
 * @param {Object} record - 记录对象
 * @returns {Object} 验证结果
 */
function validateRecord(record) {
  const errors = [];

  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['记录数据不能为空'] };
  }

  // 药品ID必填（允许 0，但必须有值）
  if (record.medicineId === undefined || record.medicineId === null || record.medicineId === '') {
    errors.push('药品ID不能为空');
  }

  // 药品名称必填
  if (!record.medicineName || record.medicineName.trim() === '') {
    errors.push('药品名称不能为空');
  }

  // 服药时间验证
  if (record.takeTime) {
    const date = new Date(record.takeTime);
    if (isNaN(date.getTime())) {
      errors.push('服药时间格式不正确');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * 验证病例数据
 * @param {Object} caseData - 病例对象
 * @returns {Object} 验证结果
 */
function validateCase(caseData) {
  const errors = [];

  if (!caseData || typeof caseData !== 'object') {
    return { valid: false, errors: ['病例数据不能为空'] };
  }

  // 病例内容必填
  if (!caseData.content || caseData.content.trim() === '') {
    errors.push('病例内容不能为空');
  }

  // 内容长度限制
  if (caseData.content && caseData.content.length > 500) {
    errors.push('病例内容长度不能超过500个字符');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  validateMedicine,
  validateRecord,
  validateCase
};