const { analyzeMedicineInfo, extractMedicineName, formatExpiryDate } = require('../ai');

describe('utils/ai.js', () => {
  describe('analyzeMedicineInfo', () => {
    test('应返回空字段的空对象当输入为空', () => {
      const result = analyzeMedicineInfo('');
      expect(result.name).toBe('');
      expect(result.expiryDate).toBe('');
      expect(result.specification).toBe('');
      expect(result.manufacturer).toBe('');
      expect(result.usage).toBe('');
      expect(result.approvalNumber).toBe('');
      expect(result.storage).toBe('');
      expect(result.ingredients).toBe('');
    });

    test('应返回空字段的空对象当输入为null', () => {
      const result = analyzeMedicineInfo(null);
      expect(result.name).toBe('');
    });

    test('应提取药品名称', () => {
      const text = '布洛芬缓释胶囊\n规格：0.3g*20片';
      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('布洛芬');
    });

    test('应识别有效期日期格式 YYYY-MM-DD', () => {
      const text = '布洛芬缓释胶囊\n有效期至：2025-12-31';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2025-12-31');
    });

    test('应识别有效期日期格式 YYYY.MM.DD', () => {
      const text = '阿莫西林胶囊\nEXP:2026.06.15';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2026-06-15');
    });

    test('应识别有效期日期格式带中文年月日', () => {
      const text = '维生素C片\n有效期至2026年08月20日';
      const result = analyzeMedicineInfo(text);
      expect(result.expiryDate).toBe('2026-08-20');
    });

    test('应识别规格信息', () => {
      const text = '阿奇霉素片\n规格：0.25g*6片';
      const result = analyzeMedicineInfo(text);
      expect(result.specification).toContain('0.25g');
    });

    test('应识别生产厂家', () => {
      const text = '头孢克肟胶囊\n生产厂家：某某制药有限公司';
      const result = analyzeMedicineInfo(text);
      expect(result.manufacturer).toContain('某某制药');
    });

    test('应识别用法用量', () => {
      const text = '布洛芬片\n用法：口服\n用量：一次1片';
      const result = analyzeMedicineInfo(text);
      expect(result.usage).toContain('1片');
    });

    test('应识别国药准字', () => {
      const text = '感冒灵颗粒\n国药准字H12345678';
      const result = analyzeMedicineInfo(text);
      expect(result.approvalNumber).toBe('H12345678');
    });

    test('应识别贮藏条件', () => {
      const text = '维生素D滴剂\n贮藏：遮光，密封，在干燥处保存';
      const result = analyzeMedicineInfo(text);
      expect(result.storage).toContain('遮光');
    });

    test('应识别主要成分', () => {
      const text = '复方感冒灵\n主要成分：对乙酰氨基酚、金银花、野菊花';
      const result = analyzeMedicineInfo(text);
      expect(result.ingredients).toContain('对乙酰氨基酚');
    });

    test('应处理包含多个字段的复杂文本', () => {
      const text = `布洛芬缓释胶囊
规格：0.3g*20粒
生产厂家：某某药业有限公司
国药准字H12345678
有效期至2026-12-31
用法：口服，一次1粒
贮藏：遮光保存`;

      const result = analyzeMedicineInfo(text);
      expect(result.name).toContain('布洛芬');
      expect(result.specification).toContain('0.3g');
      expect(result.manufacturer).toContain('某某药业');
      expect(result.approvalNumber).toBe('H12345678');
      expect(result.expiryDate).toBe('2026-12-31');
      expect(result.usage).toContain('1粒');
      expect(result.storage).toContain('遮光');
    });
  });

  describe('extractMedicineName', () => {
    test('应返回空字符串当输入为空', () => {
      expect(extractMedicineName('')).toBe('');
      expect(extractMedicineName(null)).toBe('');
    });

    test('应提取包含胶囊的药品名', () => {
      const text = '阿莫西林胶囊\n规格：0.25g';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应提取包含片的药品名', () => {
      const text = '维生素C片\n规格：100mg';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素C');
    });

    test('应提取包含颗粒的药品名', () => {
      const text = '感冒灵颗粒\n用法：冲服';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应提取包含口服液的药品名', () => {
      const text = '止咳口服液\n规格：100ml';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应提取包含注射液的药品名', () => {
      const text = '胰岛素注射液';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应返回第一行当没有关键词匹配时', () => {
      const text = 'XYZ12345\n其他信息';
      const result = extractMedicineName(text);
      expect(result).toBe('XYZ12345');
    });

    test('应处理中英文混合文本', () => {
      const text = 'Tylenol 退烧片\n规格：500mg';
      const result = extractMedicineName(text);
      expect(result).toContain('退烧');
    });

    test('应返回最长50字符的药品名', () => {
      const longName = 'A'.repeat(60) + '胶囊';
      const result = extractMedicineName(longName);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    test('应匹配关键词边界', () => {
      const text = '布洛芬缓释胶囊0.3g';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
      expect(result).toContain('胶囊');
    });
  });

  describe('formatExpiryDate', () => {
    test('应返回空字符串当输入为空', () => {
      expect(formatExpiryDate('')).toBe('');
      expect(formatExpiryDate(null)).toBe('');
    });

    test('应格式化 YYYY-MM-DD 格式', () => {
      const result = formatExpiryDate('2026-06-15');
      expect(result).toBe('2026-06-15');
    });

    test('应格式化 YYYY/MM/DD 格式', () => {
      const result = formatExpiryDate('2026/06/15');
      expect(result).toBe('2026-06-15');
    });

    test('应格式化 YYYY.MM.DD 格式', () => {
      const result = formatExpiryDate('2026.06.15');
      expect(result).toBe('2026-06-15');
    });

    test('应格式化 YYYY年MM月DD日 格式', () => {
      const result = formatExpiryDate('2026年08月20日');
      expect(result).toBe('2026-08-20');
    });

    test('应处理单位数月份和日期', () => {
      const result = formatExpiryDate('2026-1-5');
      expect(result).toBe('2026-01-05');
    });

    test('应处理纯数字格式 YYYYMMDD', () => {
      const result = formatExpiryDate('20261231');
      expect(result).toBe('2026-12-31');
    });

    test('应处理带横线的纯数字格式', () => {
      const result = formatExpiryDate('2026-12-31');
      expect(result).toBe('2026-12-31');
    });

    test('应保留无法解析的日期格式', () => {
      const result = formatExpiryDate('invalid-date');
      expect(result).toBe('invalid-date');
    });

    test('应处理有效期至前缀', () => {
      const result = formatExpiryDate('有效期至:2026-12-31');
      expect(result).toBe('2026-12-31');
    });

    test('应处理EXP前缀', () => {
      const result = formatExpiryDate('EXP.2026.06.15');
      expect(result).toBe('2026-06-15');
    });
  });
});
