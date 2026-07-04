function filterExpiringMedicines(medicines, days = 30) {
  if (!medicines || medicines.length === 0) return [];

  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    return expiry <= threshold && expiry >= now;
  });
}

function getTodayRecords(records) {
  if (!records || records.length === 0) return [];

  const today = new Date().toDateString();
  return records.filter(r => {
    return new Date(r.takeTime).toDateString() === today;
  });
}

module.exports = {
  filterExpiringMedicines,
  getTodayRecords
};