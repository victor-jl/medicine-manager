function filterExpiringMedicines(medicines, days = 30) {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return medicines.filter(m => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    return expiry <= threshold && expiry >= now;
  });
}

describe('Expiry Date Filter', () => {
  test('should return medicines expiring within 30 days', () => {
    const now = new Date();
    const nearDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const farDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    
    const medicines = [
      { id: 1, name: '药品A', expiryDate: nearDate.toISOString().split('T')[0] },
      { id: 2, name: '药品B', expiryDate: farDate.toISOString().split('T')[0] },
      { id: 3, name: '药品C', expiryDate: '' }
    ];
    
    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('药品A');
  });

  test('should exclude expired medicines', () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    
    const medicines = [
      { id: 1, name: '过期药', expiryDate: pastDate.toISOString().split('T')[0] },
      { id: 2, name: '有效期内', expiryDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ];
    
    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('有效期内');
  });

  test('should handle invalid date formats gracefully', () => {
    const medicines = [
      { id: 1, name: '无效日期', expiryDate: 'invalid-date' },
      { id: 2, name: '空日期', expiryDate: '' },
      { id: 3, name: '有效日期', expiryDate: '2025-12-31' }
    ];
    
    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('有效日期');
  });

  test('should handle medicines with no expiryDate', () => {
    const medicines = [
      { id: 1, name: '无有效期', expiryDate: undefined },
      { id: 2, name: '有有效期', expiryDate: '2025-06-30' }
    ];
    
    const result = filterExpiringMedicines(medicines);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('有有效期');
  });
});