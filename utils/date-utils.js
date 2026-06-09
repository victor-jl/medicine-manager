function isExpiringWithinDays(medicine, days) {
  if (!medicine || !medicine.expiryDate) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(medicine.expiryDate);
  
  if (isNaN(expiry.getTime())) {
    return false;
  }

  const daysLater = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return expiry <= daysLater && expiry >= now;
}

function isExpired(medicine) {
  if (!medicine || !medicine.expiryDate) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(medicine.expiryDate);
  
  if (isNaN(expiry.getTime())) {
    return false;
  }

  return expiry < now;
}

function formatExpiryDate(dateStr) {
  if (!dateStr) {
    return '';
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

module.exports = {
  isExpiringWithinDays,
  isExpired,
  formatExpiryDate
};