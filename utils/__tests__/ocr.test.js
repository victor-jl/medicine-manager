// utils/__tests__/ocr.test.js
const { extractMedicineName } = require('../ocr.js');

describe('OCR Utils - extractMedicineName', () => {
  describe('输入验证', () => {
    test('应处理 null 输入', () => {
      expect(extractMedicineName(null)).toBe('');
    });

    test('应处理 undefined 输入', () => {
      expect(extractMedicineName(undefined)).toBe('');
    });

    test('应处理空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });
  });

  describe('药品剂型关键词识别', () => {
    test('应识别胶囊关键词', () => {
      const text = '阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
      expect(result).toContain('阿莫西林');
    });

    test('应识别片剂关键词', () => {
      const text = '布洛芬片';
      const result = extractMedicineName(text);
      expect(result).toContain('片');
      expect(result).toContain('布洛芬');
    });

    test('应识别颗粒关键词', () => {
      const text = '感冒清热颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('颗粒');
      expect(result).toContain('感冒清热');
    });

    test('应识别口服液关键词', () => {
      const text = '某品牌口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('口服液');
    });

    test('应识别注射液关键词', () => {
      const text = '青霉素注射液';
      const result = extractMedicineName(text);
      expect(result).toContain('注射液');
    });

    test('应识别软膏关键词', () => {
      const text = '皮炎平软膏';
      const result = extractMedicineName(text);
      expect(result).toContain('软膏');
    });

    test('应识别贴剂关键词', () => {
      const text = '伤湿止痛贴剂';
      const result = extractMedicineName(text);
      expect(result).toContain('贴剂');
    });

    test('应识别滴眼液关键词', () => {
      const text = '氯霉素滴眼液';
      const result = extractMedicineName(text);
      expect(result).toContain('滴眼液');
    });

    test('应识别糖浆关键词', () => {
      const text = '止咳糖浆';
      const result = extractMedicineName(text);
      expect(result).toContain('糖浆');
    });
  });

  describe('常见药品名称识别', () => {
    test('应识别阿莫西林', () => {
      const text = '阿莫西林胶囊 0.5g';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('应识别布洛芬', () => {
      const text = '布洛芬缓释胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应识别对乙酰氨基酚', () => {
      const text = '对乙酰氨基酚片';
      const result = extractMedicineName(text);
      expect(result).toContain('对乙酰氨基酚');
    });

    test('应识别头孢类药物', () => {
      const text = '头孢克肟分散片';
      const result = extractMedicineName(text);
      expect(result).toContain('头孢');
    });

    test('应识别阿奇霉素', () => {
      const text = '阿奇霉素片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿奇霉素');
    });

    test('应识别罗红霉素', () => {
      const text = '罗红霉素胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('罗红霉素');
    });
  });

  describe('中成药识别', () => {
    test('应识别感冒灵', () => {
      const text = '999感冒灵颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应识别感冒清热', () => {
      const text = '感冒清热颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒清热');
    });

    test('应识别板蓝根', () => {
      const text = '板蓝根颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('板蓝根');
    });

    test('应识别双黄连', () => {
      const text = '双黄连口服液';
      const result = extractMedicineName(text);
      expect(result).toContain('双黄连');
    });

    test('应识别莲花清瘟', () => {
      const text = '莲花清瘟胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('莲花清瘟');
    });
  });

  describe('维生素和保健品识别', () => {
    test('应识别维生素类药物', () => {
      const text = '维生素C片';
      const result = extractMedicineName(text);
      expect(result).toContain('维生素');
    });

    test('应识别钙片', () => {
      const text = '碳酸钙D3钙片';
      const result = extractMedicineName(text);
      expect(result).toContain('钙片');
    });

    test('应识别铁剂', () => {
      const text = '琥珀酸亚铁铁剂';
      const result = extractMedicineName(text);
      expect(result).toContain('铁剂');
    });

    test('应识别锌补充剂', () => {
      const text = '葡萄糖酸锌锌';
      const result = extractMedicineName(text);
      expect(result).toContain('锌');
    });

    test('应识别叶酸', () => {
      const text = '叶酸片';
      const result = extractMedicineName(text);
      expect(result).toContain('叶酸');
    });
  });

  describe('常见慢性病药物识别', () => {
    test('应识别奥美拉唑', () => {
      const text = '奥美拉唑肠溶胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('奥美拉唑');
    });

    test('应识别硝苯地平', () => {
      const text = '硝苯地平控释片';
      const result = extractMedicineName(text);
      expect(result).toContain('硝苯地平');
    });

    test('应识别二甲双胍', () => {
      const text = '盐酸二甲双胍片';
      const result = extractMedicineName(text);
      expect(result).toContain('二甲双胍');
    });

    test('应识别阿司匹林', () => {
      const text = '阿司匹林肠溶片';
      const result = extractMedicineName(text);
      expect(result).toContain('阿司匹林');
    });

    test('应识别氯雷他定', () => {
      const text = '氯雷他定片';
      const result = extractMedicineName(text);
      expect(result).toContain('氯雷他定');
    });

    test('应识别西替利嗪', () => {
      const text = '盐酸西替利嗪片';
      const result = extractMedicineName(text);
      expect(result).toContain('西替利嗪');
    });
  });

  describe('症状相关关键词识别', () => {
    test('应识别止咳类药物', () => {
      const text = '止咳化痰胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('止咳');
    });

    test('应识别祛痰类药物', () => {
      const text = '祛痰止咳颗粒';
      const result = extractMedicineName(text);
      expect(result).toContain('祛痰');
    });

    test('应识别平喘类药物', () => {
      const text = '平喘胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('平喘');
    });

    test('应识别消炎类药物', () => {
      const text = '消炎止痛膏';
      const result = extractMedicineName(text);
      expect(result).toContain('消炎');
    });

    test('应识别退烧类药物', () => {
      const text = '退烧贴';
      const result = extractMedicineName(text);
      expect(result).toContain('退烧');
    });

    test('应识别止痛类药物', () => {
      const text = '止痛喷雾剂';
      const result = extractMedicineName(text);
      expect(result).toContain('止痛');
    });
  });

  describe('边界条件', () => {
    test('应处理关键词在文本开头', () => {
      const text = '胶囊制剂';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应处理关键词在文本末尾', () => {
      const text = '这是某种胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('应处理包含多个关键词的文本（优先匹配第一个）', () => {
      const text = '感冒灵颗粒和止咳片';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });

    test('应处理超长药品名称', () => {
      const longName = '复方氨酚烷胺片布洛芬胶囊阿莫西林胶囊';
      const result = extractMedicineName(longName);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(30);
    });

    test('应处理包含特殊字符的文本', () => {
      const text = '药品@#$胶囊%&*';
      const result = extractMedicineName(text);
      expect(result).toBeDefined();
    });

    test('应处理混合大小写的文本', () => {
      const text = 'AMOXICILLIN胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });
  });

  describe('默认行为', () => {
    test('在没有关键词时应返回第一行', () => {
      const text = '未知药品名称\n其他信息';
      const result = extractMedicineName(text);
      expect(result).toBe('未知药品名称');
    });

    test('在没有关键词且只有一行时应返回该行', () => {
      const text = '某种未知药品';
      const result = extractMedicineName(text);
      expect(result).toBe('某种未知药品');
    });

    test('在没有关键词且文本很长时应截取前30个字符', () => {
      const text = '这是一段很长的没有任何药品关键词的文本内容';
      const result = extractMedicineName(text);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('真实场景模拟', () => {
    test('应从OCR识别结果中提取药品名称（多行文本）', () => {
      const text = `
阿莫西林胶囊
国药准字H12345678
规格: 0.5g*12粒/盒
生产企业: 某某制药有限公司
有效期至: 2025年12月
      `.trim();
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
      expect(result).toContain('胶囊');
    });

    test('应从混乱OCR文本中提取药品名称', () => {
      const text = '包装盒上印有布洛芬缓释胶囊，有效期2025-12-31';
      const result = extractMedicineName(text);
      expect(result).toContain('布洛芬');
    });

    test('应从模糊OCR文本中提取药品名称', () => {
      const text = '部分文字不清，可见感冒灵颗粒字样';
      const result = extractMedicineName(text);
      expect(result).toContain('感冒灵');
    });
  });
});