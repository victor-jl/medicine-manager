describe('首页过期药品筛选逻辑', () => {
  test('筛选30天内过期的药品', () => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const medicines = [
      { id: 1, name: '药品A', expiryDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { id: 2, name: '药品B', expiryDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { id: 3, name: '药品C', expiryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { id: 4, name: '药品D', expiryDate: '' }
    ];

    const expiring = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    expect(expiring).toHaveLength(1);
    expect(expiring[0].name).toBe('药品A');
  });

  test('不含过期日期的药品不应被筛选', () => {
    const medicines = [
      { id: 1, name: '药品A', expiryDate: '' },
      { id: 2, name: '药品B', expiryDate: null },
      { id: 3, name: '药品C', expiryDate: undefined }
    ];

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiring = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    expect(expiring).toHaveLength(0);
  });

  test('今日记录筛选逻辑', () => {
    const today = new Date().toDateString();
    
    const records = [
      { id: 1, medicineName: '药品A', takeTime: new Date().toLocaleString() },
      { id: 2, medicineName: '药品B', takeTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toLocaleString() },
      { id: 3, medicineName: '药品C', takeTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString() }
    ];

    const todayRecords = records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });

    expect(todayRecords).toHaveLength(2);
  });
});