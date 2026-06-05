describe('Expiry Date Validation', () => {
  test('判断药品是否即将过期（30天内）', () => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const medicineExpiring = { expiryDate: thirtyDaysLater.toISOString().split('T')[0] };
    const medicineNotExpiring = { expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] };
    const medicineNoDate = {};

    const isExpiring = (medicine) => {
      if (!medicine.expiryDate) return false;
      const expiry = new Date(medicine.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    };

    expect(isExpiring(medicineExpiring)).toBe(true);
    expect(isExpiring(medicineNotExpiring)).toBe(false);
    expect(isExpiring(medicineNoDate)).toBe(false);
  });

  test('判断药品是否已过期', () => {
    const now = new Date();
    const expiredDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    
    const isExpired = (expiryDate) => {
      if (!expiryDate) return false;
      return new Date(expiryDate) < now;
    };

    expect(isExpired(expiredDate.toISOString().split('T')[0])).toBe(true);
    expect(isExpired(now.toISOString().split('T')[0])).toBe(false);
    expect(isExpired(null)).toBe(false);
    expect(isExpired(undefined)).toBe(false);
  });

  test('日期格式验证', () => {
    const isValidDate = (dateStr) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date instanceof Date && !isNaN(date);
    };

    expect(isValidDate('2025-12-31')).toBe(true);
    expect(isValidDate('2025/12/31')).toBe(true);
    expect(isValidDate('2025-13-01')).toBe(false);
    expect(isValidDate('2025-02-30')).toBe(false);
    expect(isValidDate('invalid')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });

  test('计算距过期天数', () => {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    
    const daysUntilExpiry = (expiryStr) => {
      if (!expiryStr) return null;
      const expiry = new Date(expiryStr);
      const diffTime = expiry.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    expect(daysUntilExpiry(expiryDate.toISOString().split('T')[0])).toBe(15);
    expect(daysUntilExpiry(null)).toBeNull();
    expect(daysUntilExpiry(undefined)).toBeNull();
  });

  test('有效期排序', () => {
    const medicines = [
      { id: 1, name: '药A', expiryDate: '2025-06-15' },
      { id: 2, name: '药B', expiryDate: '2025-06-05' },
      { id: 3, name: '药C', expiryDate: '2025-06-20' },
      { id: 4, name: '药D', expiryDate: '' }
    ];

    const sorted = medicines.sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(1);
    expect(sorted[2].id).toBe(3);
    expect(sorted[3].id).toBe(4);
  });
});