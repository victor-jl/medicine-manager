const MEDICINES_KEY = 'medicines';
const RECORDS_KEY = 'records';
const CASES_KEY = 'cases';

function getMedicines() {
  return wx.getStorageSync(MEDICINES_KEY) || [];
}

function saveMedicine(medicine) {
  const medicines = getMedicines();
  const existingIndex = medicines.findIndex(m => m.id === medicine.id);
  
  if (existingIndex >= 0) {
    medicines[existingIndex] = medicine;
  } else {
    medicines.push(medicine);
  }
  
  wx.setStorageSync(MEDICINES_KEY, medicines);
  return medicines;
}

function deleteMedicine(id) {
  const medicines = getMedicines();
  const filtered = medicines.filter(m => m.id !== id);
  wx.setStorageSync(MEDICINES_KEY, filtered);
  return filtered;
}

function getExpiringMedicines(days = 30) {
  const medicines = getMedicines();
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    return expiry <= threshold && expiry >= now;
  });
}

function getRecords() {
  return wx.getStorageSync(RECORDS_KEY) || [];
}

function saveRecord(record) {
  const records = getRecords();
  records.push(record);
  wx.setStorageSync(RECORDS_KEY, records);
  return records;
}

function deleteRecord(id) {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);
  wx.setStorageSync(RECORDS_KEY, filtered);
  return filtered;
}

function getTodayRecords() {
  const records = getRecords();
  const today = new Date().toDateString();
  
  return records.filter(r => {
    return new Date(r.takeTime).toDateString() === today;
  });
}

function getRecordsByMedicineId(medicineId) {
  const records = getRecords();
  return records.filter(r => r.medicineId === medicineId).reverse();
}

function getCases() {
  return wx.getStorageSync(CASES_KEY) || [];
}

function saveCase(caseItem) {
  const cases = getCases();
  cases.push(caseItem);
  wx.setStorageSync(CASES_KEY, cases);
  return cases;
}

function deleteCase(id) {
  const cases = getCases();
  const filtered = cases.filter(c => c.id !== id);
  wx.setStorageSync(CASES_KEY, filtered);
  return filtered;
}

module.exports = {
  getMedicines,
  saveMedicine,
  deleteMedicine,
  getExpiringMedicines,
  getRecords,
  saveRecord,
  deleteRecord,
  getTodayRecords,
  getRecordsByMedicineId,
  getCases,
  saveCase,
  deleteCase
};
