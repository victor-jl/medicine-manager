function isExpiringSoon(expiryDateStr, days = 30) {
  if (!expiryDateStr) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expiryDateStr);
  const daysLater = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return expiry <= daysLater && expiry >= today;
}

function isExpired(expiryDateStr) {
  if (!expiryDateStr) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expiryDateStr);
  return expiry < today;
}

describe('日期工具函数', () => {
  describe('isExpiringSoon', () => {
    test('30天内过期的药品应被识别为即将过期', () => {
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const result = isExpiringSoon(thirtyDaysLater.toISOString().split('T')[0]);
      expect(result).toBe(true);
    });

    test('31天后过期的药品不应被识别为即将过期', () => {
      const thirtyOneDaysLater = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
      const result = isExpiringSoon(thirtyOneDaysLater.toISOString().split('T')[0]);
      expect(result).toBe(false);
    });

    test('已过期的药品不应被识别为即将过期', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = isExpiringSoon(yesterday.toISOString().split('T')[0]);
      expect(result).toBe(false);
    });

    test('空日期应返回false', () => {
      const result = isExpiringSoon('');
      expect(result).toBe(false);
    });

    test('undefined日期应返回false', () => {
      const result = isExpiringSoon(undefined);
      expect(result).toBe(false);
    });

    test('今天过期的药品应被识别为即将过期', () => {
      const today = new Date();
      const result = isExpiringSoon(today.toISOString().split('T')[0]);
      expect(result).toBe(true);
    });
  });

  describe('isExpired', () => {
    test('已过期的药品应返回true', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = isExpired(yesterday.toISOString().split('T')[0]);
      expect(result).toBe(true);
    });

    test('未过期的药品应返回false', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = isExpired(tomorrow.toISOString().split('T')[0]);
      expect(result).toBe(false);
    });

    test('今天过期的药品应返回false（还未过期）', () => {
      const today = new Date();
      const result = isExpired(today.toISOString().split('T')[0]);
      expect(result).toBe(false);
    });

    test('空日期应返回false', () => {
      const result = isExpired('');
      expect(result).toBe(false);
    });
  });
});