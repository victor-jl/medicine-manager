// Stub module for utils/ai.js. The real module is missing from the
// repo (referenced by pages/add/add.js) — we use this file as the
// resolution target when Module._resolveFilename is redirected by
// the installAiStub helper.

module.exports = {
  analyzeMedicineInfo(text) {
    return {
      name: text ? '阿莫西林胶囊' : '',
      expiryDate: '2027-01-31',
      specification: '0.25g*24粒',
      manufacturer: '测试制药',
      usage: '口服',
      approvalNumber: '国药准字H10900001',
      storage: '密封',
      ingredients: '阿莫西林'
    };
  },
  formatExpiryDate(input) {
    if (!input) return '';
    return String(input).replace(/[./]/g, '-');
  }
};
