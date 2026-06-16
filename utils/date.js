function getExpiringMedicines(medicines, days = 30) {
  if (!medicines || !Array.isArray(medicines)) return [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return expiry <= futureDate && expiry >= now;
  });
}

function getTodayRecords(records) {
  if (!records || !Array.isArray(records)) return [];

  const today = new Date().toDateString();
  return records.filter(r => {
    return new Date(r.takeTime).toDateString() === today;
  });
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  getExpiringMedicines,
  getTodayRecords,
  formatExpiryDate
};