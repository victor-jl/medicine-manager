function filterExpiringMedicines(medicines, days = 30) {
  if (!medicines || !Array.isArray(medicines)) return [];

  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    return expiry <= futureDate && expiry >= now;
  });
}

function filterTodayRecords(records) {
  if (!records || !Array.isArray(records)) return [];

  const today = new Date().toDateString();
  return records.filter(r => {
    return new Date(r.takeTime).toDateString() === today;
  });
}

function validateMedicine(medicine) {
  if (!medicine || !medicine.name || medicine.name.trim() === '') {
    return { valid: false, error: '请输入药品名称' };
  }
  return { valid: true };
}

function generateMedicineId() {
  return Date.now();
}

module.exports = {
  filterExpiringMedicines,
  filterTodayRecords,
  validateMedicine,
  generateMedicineId
};
