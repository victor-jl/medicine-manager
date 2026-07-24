function getExpiringMedicines(medicines, now = new Date(), daysThreshold = 30) {
  if (!Array.isArray(medicines)) {
    return [];
  }

  const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    if (isNaN(expiry.getTime())) return false;
    return expiry <= thresholdDate && expiry >= now;
  });
}

function getTodayRecords(records, now = new Date()) {
  if (!Array.isArray(records)) {
    return [];
  }

  const today = now.toDateString();
  return records.filter(r => {
    if (!r.takeTime) return false;
    try {
      return new Date(r.takeTime).toDateString() === today;
    } catch (e) {
      return false;
    }
  });
}

function saveMedicine(medicines, medicineData) {
  if (!medicineData || !medicineData.name) {
    return { success: false, error: '请输入药品名称' };
  }

  const newMedicine = {
    id: Date.now(),
    name: medicineData.name,
    expiryDate: medicineData.expiryDate || '',
    description: medicineData.description || '',
    specification: medicineData.specification || '',
    manufacturer: medicineData.manufacturer || '',
    usage: medicineData.usage || '',
    approvalNumber: medicineData.approvalNumber || '',
    storage: medicineData.storage || '',
    ingredients: medicineData.ingredients || '',
    photos: medicineData.photos || [],
    createTime: new Date().toLocaleString()
  };

  const updated = Array.isArray(medicines) ? [...medicines] : [];
  updated.push(newMedicine);

  return { success: true, medicines: updated, medicine: newMedicine };
}

function deleteMedicine(medicines, id) {
  if (!Array.isArray(medicines)) {
    return [];
  }
  return medicines.filter(m => m.id !== id);
}

function createTakeRecord(medicineId, medicineName) {
  if (!medicineId || !medicineName) {
    return { success: false, error: '缺少药品信息' };
  }

  return {
    success: true,
    record: {
      id: Date.now(),
      medicineId: medicineId,
      medicineName: medicineName,
      takeTime: new Date().toLocaleString()
    }
  };
}

function getMedicineRecords(records, medicineId) {
  if (!Array.isArray(records)) {
    return [];
  }
  return records.filter(r => r.medicineId === medicineId).reverse();
}

function deleteRecord(records, id) {
  if (!Array.isArray(records)) {
    return [];
  }
  return records.filter(r => r.id !== id);
}

module.exports = {
  getExpiringMedicines,
  getTodayRecords,
  saveMedicine,
  deleteMedicine,
  createTakeRecord,
  getMedicineRecords,
  deleteRecord
};
