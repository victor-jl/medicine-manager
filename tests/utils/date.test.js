describe('药品有效期管理 - 日期处理逻辑', () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  describe('过期检测逻辑', () => {
    function isExpiringSoon(expiryDate, thresholdDays = 30) {
      if (!expiryDate) return false;
      const expiry = new Date(expiryDate);
      const threshold = new Date(now.getTime() + thresholdDays * 24 * 60 * 60 * 1000);
      return expiry <= threshold && expiry >= todayStart;
    }

    function isExpired(expiryDate) {
      if (!expiryDate) return false;
      const expiry = new Date(expiryDate);
      return expiry < todayStart;
    }

    test('应在30天内过期的药品被标记为即将过期', () => {
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      expect(isExpiringSoon(futureDate.toISOString())).toBe(true);
    });

    test('应在31天后过期的药品不应被标记为即将过期', () => {
      const futureDate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
      expect(isExpiringSoon(futureDate.toISOString())).toBe(false);
    });

    test('应在今天过期的药品应被标记为即将过期', () => {
      const todayStr = todayStart.toISOString().split('T')[0];
      expect(isExpiringSoon(todayStr)).toBe(true);
    });

    test('已过期的药品应被标记为过期', () => {
      const pastDate = new Date(todayStart.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(isExpired(pastDate.toISOString())).toBe(true);
    });

    test('未过期的药品不应被标记为过期', () => {
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expect(isExpired(futureDate.toISOString())).toBe(false);
    });

    test('空日期应返回安全的默认值', () => {
      expect(isExpiringSoon('')).toBe(false);
      expect(isExpiringSoon(null)).toBe(false);
      expect(isExpiringSoon(undefined)).toBe(false);
      expect(isExpired('')).toBe(false);
      expect(isExpired(null)).toBe(false);
      expect(isExpired(undefined)).toBe(false);
    });

    test('应在1年后过期的药品不应被标记', () => {
      const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      expect(isExpiringSoon(futureDate.toISOString())).toBe(false);
      expect(isExpired(futureDate.toISOString())).toBe(false);
    });

    test('应在29天后过期的药品应被标记', () => {
      const futureDate = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
      expect(isExpiringSoon(futureDate.toISOString())).toBe(true);
    });

    test('应在90天后过期的药品可配置阈值', () => {
      const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      expect(isExpiringSoon(futureDate.toISOString(), 90)).toBe(true);
      expect(isExpiringSoon(futureDate.toISOString(), 30)).toBe(false);
    });
  });

  describe('日期格式化逻辑', () => {
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    test('应正确格式化日期字符串', () => {
      const dateStr = '2025-12-25';
      expect(formatDate(dateStr)).toBe('2025-12-25');
    });

    test('应正确格式化单月单日', () => {
      const dateStr = '2025-01-05';
      expect(formatDate(dateStr)).toBe('2025-01-05');
    });

    test('空字符串应返回空字符串', () => {
      expect(formatDate('')).toBe('');
    });

    test('null应返回空字符串', () => {
      expect(formatDate(null)).toBe('');
    });

    test('应处理ISO格式日期', () => {
      const isoStr = '2025-06-15T00:00:00.000Z';
      expect(formatDate(isoStr)).toBeTruthy();
    });
  });
});
