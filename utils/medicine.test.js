const { filterExpiringMedicines, getTodayRecords } = require('./medicine');

describe('medicine.js - filterExpiringMedicines', () => {
  const createMedicine = (daysFromNow, name = 'Test Medicine') => ({
    id: Date.now(),
    name,
    expiryDate: new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  test('should return empty array for empty input', () => {
    expect(filterExpiringMedicines([])).toEqual([]);
    expect(filterExpiringMedicines(null)).toEqual([]);
    expect(filterExpiringMedicines(undefined)).toEqual([]);
  });

  test('should filter medicines expiring within 30 days', () => {
    const medicines = [
      createMedicine(10, 'Medicine A'),
      createMedicine(25, 'Medicine B'),
      createMedicine(35, 'Medicine C'),
      createMedicine(-5, 'Medicine D')
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result).toHaveLength(2);
    expect(result.map(m => m.name)).toContain('Medicine A');
    expect(result.map(m => m.name)).toContain('Medicine B');
    expect(result.map(m => m.name)).not.toContain('Medicine C');
    expect(result.map(m => m.name)).not.toContain('Medicine D');
  });

  test('should exclude medicines without expiryDate', () => {
    const medicines = [
      { id: 1, name: 'No Expiry', expiryDate: '' },
      { id: 2, name: 'Null Expiry', expiryDate: null },
      { id: 3, name: 'Valid Expiry', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid Expiry');
  });

  test('should handle medicines expiring exactly on threshold date', () => {
    const exactly30DaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const medicines = [
      { id: 1, name: 'Expires Today', expiryDate: new Date().toISOString().split('T')[0] },
      { id: 2, name: 'Expires in 30 Days', expiryDate: exactly30DaysLater }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result).toHaveLength(2);
  });

  test('should handle custom threshold days', () => {
    const medicines = [
      createMedicine(5, '5 days'),
      createMedicine(15, '15 days'),
      createMedicine(25, '25 days')
    ];

    const result10 = filterExpiringMedicines(medicines, 10);
    expect(result10).toHaveLength(1);
    expect(result10[0].name).toBe('5 days');

    const result20 = filterExpiringMedicines(medicines, 20);
    expect(result20).toHaveLength(2);
  });

  test('should handle expired medicines', () => {
    const medicines = [
      createMedicine(-10, 'Expired'),
      createMedicine(5, 'Valid')
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid');
  });

  test('should handle invalid date formats gracefully', () => {
    const medicines = [
      { id: 1, name: 'Invalid Date', expiryDate: 'not-a-date' },
      { id: 2, name: 'Valid Date', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ];

    const result = filterExpiringMedicines(medicines);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid Date');
  });
});

describe('medicine.js - getTodayRecords', () => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  test('should return empty array for empty input', () => {
    expect(getTodayRecords([])).toEqual([]);
    expect(getTodayRecords(null)).toEqual([]);
    expect(getTodayRecords(undefined)).toEqual([]);
  });

  test('should filter only today records', () => {
    const records = [
      { id: 1, medicineName: 'Medicine A', takeTime: new Date().toLocaleString() },
      { id: 2, medicineName: 'Medicine B', takeTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString() },
      { id: 3, medicineName: 'Medicine C', takeTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toLocaleString() }
    ];

    const result = getTodayRecords(records);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.medicineName)).toContain('Medicine A');
    expect(result.map(r => r.medicineName)).toContain('Medicine B');
    expect(result.map(r => r.medicineName)).not.toContain('Medicine C');
  });

  test('should handle records with different time formats', () => {
    const records = [
      { id: 1, medicineName: 'ISO Format', takeTime: new Date().toISOString() },
      { id: 2, medicineName: 'Locale Format', takeTime: new Date().toLocaleString() },
      { id: 3, medicineName: 'UTC Format', takeTime: new Date().toUTCString() }
    ];

    const result = getTodayRecords(records);
    expect(result).toHaveLength(3);
  });

  test('should handle records with future dates', () => {
    const records = [
      { id: 1, medicineName: 'Today', takeTime: new Date().toLocaleString() },
      { id: 2, medicineName: 'Future', takeTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString() }
    ];

    const result = getTodayRecords(records);
    expect(result).toHaveLength(1);
    expect(result[0].medicineName).toBe('Today');
  });
});