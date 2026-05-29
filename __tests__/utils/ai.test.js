const { analyzeMedicineInfo, formatExpiryDate } = require('../../utils/ai');

describe('utils/ai.js', () => {
  describe('analyzeMedicineInfo', () => {
    test('应处理空输入', () => {
      const result = analyzeMedicineInfo('');
      
      expect(result.name).toBe('');
      expect(result.expiryDate).toBe('');
      expect(result.specification).toBe('');
      expect(result.manufacturer).toBe('');
    });

    test('应处理null输入', () => {
      const result = analyzeMedicineInfo(null);
      
      expect(result.name).toBe('');
      expect(result.expiryDate).toBe('');
    });

    test('应提取药品名称', () => {
      const text = '阿莫西林胶囊\n有效期至2025-12-31';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toContain('阿莫西林');
    });

    test('应提取有效期', () => {
      const text = '布洛芬缓释片\n有效期至2026-06-30';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2026-06-30');
    });

    test('应处理点号分隔有效期', () => {
      const text = '阿奇霉素片\n有效期至 2026.08.15';
      const result = analyzeMedicineInfo(text);
      
      expect(result.expiryDate).toBe('2026-08-15');
    });

    test('应提取规格信息', () => {
      const text = '阿莫西林胶囊\n规格: 0.25gx12粒';
      const result = analyzeMedicineInfo(text);
      
      expect(result.specification).toContain('0.25g');
    });

    test('应提取生产厂家', () => {
      const text = '生产企业: 某某制药有限公司\n阿莫西林胶囊';
      const result = analyzeMedicineInfo(text);
      
      expect(result.manufacturer).toContain('某某制药');
    });

    test('应提取国药准字', () => {
      const text = '国药准字H12345678\n阿莫西林胶囊';
      const result = analyzeMedicineInfo(text);
      
      expect(result.approvalNumber).toBe('H12345678');
    });

    test('应提取贮藏条件', () => {
      const text = '贮藏: 遮光密封保存\n阿莫西林胶囊';
      const result = analyzeMedicineInfo(text);
      
      expect(result.storage).toContain('遮光');
    });

    test('应提取用法用量', () => {
      const text = '用法用量: 口服，成人一次1粒，一日2次\n阿莫西林胶囊';
      const result = analyzeMedicineInfo(text);
      
      expect(result.usage).toContain('口服');
    });

    test('应提取主要成分', () => {
      const text = '主要成分: 阿莫西林\n阿莫西林胶囊';
      const result = analyzeMedicineInfo(text);
      
      expect(result.ingredients).toContain('阿莫西林');
    });

    test('应处理OCR识别结果格式', () => {
      const ocrResult = `阿莫西林胶囊 0.25gx12粒
生产企业: 北京某某制药
有效期至 2025-12-31
国药准字H12345678
贮藏: 遮光密封保存`;

      const result = analyzeMedicineInfo(ocrResult);

      expect(result.name).toContain('阿莫西林');
      expect(result.specification).toContain('0.25g');
      expect(result.manufacturer).toContain('某某制药');
      expect(result.expiryDate).toBe('2025-12-31');
      expect(result.approvalNumber).toBe('H12345678');
    });

    test('应处理不完整的OCR文本', () => {
      const text = '阿莫西林';
      const result = analyzeMedicineInfo(text);
      
      expect(result.name).toContain('阿莫西林');
      expect(result.expiryDate).toBe('');
    });
  });

  describe('formatExpiryDate', () => {
    test('应处理标准ISO格式', () => {
      expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
    });

    test('应处理斜杠分隔格式', () => {
      expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
    });

    test('应处理点号分隔格式', () => {
      expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
    });

    test('应处理无分隔符8位数字', () => {
      expect(formatExpiryDate('20251231')).toBe('2025-12-31');
    });

    test('应处理无分隔符6位数字', () => {
      expect(formatExpiryDate('202512')).toBe('2025-12-01');
    });

    test('应处理空输入', () => {
      expect(formatExpiryDate('')).toBe('');
    });

    test('应处理null输入', () => {
      expect(formatExpiryDate(null)).toBe('');
    });

    test('应处理undefined输入', () => {
      expect(formatExpiryDate(undefined)).toBe('');
    });

    test('应保留已格式化日期', () => {
      expect(formatExpiryDate('2025-01-15')).toBe('2025-01-15');
    });

    test('应处理单月份', () => {
      expect(formatExpiryDate('2025-6-15')).toBe('2025-06-15');
    });
  });
});
