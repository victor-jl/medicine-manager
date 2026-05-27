const { extractMedicineName } = require('../ocr');

describe('extractMedicineName', () => {
  test('提取包含关键词的药品名称', () => {
    expect(extractMedicineName('阿莫西林胶囊 0.5g*20粒')).toContain('阿莫西林胶囊');
    expect(extractMedicineName('布洛芬缓释片 200mg')).toContain('布洛芬缓释片');
    expect(extractMedicineName('感冒灵颗粒 10g*9袋')).toContain('感冒灵颗粒');
  });

  test('提取口服液类药品', () => {
    expect(extractMedicineName('京都念慈菴蜜炼川贝枇杷膏 300ml')).toContain('京都念慈菴蜜炼川贝枇杷膏');
    expect(extractMedicineName('双黄连口服液 10ml*10支')).toContain('双黄连口服液');
  });

  test('处理注射液类型', () => {
    expect(extractMedicineName('氯化钠注射液 500ml:4.5g')).toContain('氯化钠注射液');
  });

  test('处理维生素类药品', () => {
    expect(extractMedicineName('维生素C片 100mg*60片')).toContain('维生素C片');
    expect(extractMedicineName('钙片 60片')).toContain('钙片');
  });

  test('处理无关键词的文本', () => {
    expect(extractMedicineName('复方甘草片\n国药准字H11020572')).toContain('复方甘草片');
    expect(extractMedicineName('云南白药胶囊')).toBe('云南白药胶囊');
  });

  test('处理空字符串', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('处理中药名称', () => {
    expect(extractMedicineName('板蓝根颗粒 10g*20袋')).toContain('板蓝根颗粒');
    expect(extractMedicineName('莲花清瘟胶囊 0.35g*24粒')).toContain('莲花清瘟胶囊');
  });

  test('处理心血管类药物', () => {
    expect(extractMedicineName('硝苯地平缓释片 20mg*30片')).toContain('硝苯地平缓释片');
    expect(extractMedicineName('阿司匹林肠溶片 100mg*30片')).toContain('阿司匹林肠溶片');
  });

  test('处理抗过敏药物', () => {
    expect(extractMedicineName('氯雷他定片 10mg*7片')).toContain('氯雷他定片');
    expect(extractMedicineName('西替利嗪滴剂 10ml')).toContain('西替利嗪滴剂');
  });

  test('处理西药名称', () => {
    expect(extractMedicineName('奥美拉唑肠溶胶囊 20mg*14粒')).toContain('奥美拉唑');
    expect(extractMedicineName('二甲双胍片 0.5g*30片')).toContain('二甲双胍片');
  });

  test('处理中成药名称', () => {
    expect(extractMedicineName('藿香正气水 10ml*10支')).toContain('藿香正气水');
    expect(extractMedicineName('牛黄解毒片 24片')).toContain('牛黄解毒片');
  });
});
