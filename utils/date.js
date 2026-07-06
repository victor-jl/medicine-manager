function getExpiringMedicines(medicines, days = 30) {
  if (!medicines || !Array.isArray(medicines)) return [];

  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    return expiry <= threshold && expiry >= now;
  });
}

function isExpired(expiryDate) {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  expiry.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return expiry < today;
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';
  return dateStr;
}

module.exports = {
  getExpiringMedicines,
  isExpired,
  formatExpiryDate
};