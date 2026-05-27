const { extractMedicineName } = require('../baidu-ocr');

describe('baidu-ocr extractMedicineName', () => {
  test('提取药品名称 - 包含关键词', () => {
    expect(extractMedicineName('头孢克肟胶囊 100mg*6粒')).toContain('头孢克肟胶囊');
    expect(extractMedicineName('阿奇霉素片 0.25g*6片')).toContain('阿奇霉素片');
    expect(extractMedicineName('维生素D钙片 60片')).toContain('维生素D钙片');
  });

  test('提取药品名称 - 中药类', () => {
    expect(extractMedicineName('感冒清热颗粒 12g*10袋')).toContain('感冒清热颗粒');
    expect(extractMedicineName('川贝枇杷膏 300ml')).toContain('川贝枇杷膏');
  });

  test('提取药品名称 - 特殊剂型', () => {
    expect(extractMedicineName('云南白药气雾剂 85g+30g')).toContain('云南白药气雾剂');
    expect(extractMedicineName('创可贴 100片')).toContain('贴');
  });

  test('处理无匹配关键词的文本', () => {
    expect(extractMedicineName('复方丹参片')).toBe('复方丹参片');
    expect(extractMedicineName('健胃消食片')).toBe('健胃消食片');
  });

  test('处理空输入', () => {
    expect(extractMedicineName('')).toBe('');
    expect(extractMedicineName(null)).toBe('');
    expect(extractMedicineName(undefined)).toBe('');
  });

  test('处理医疗相关词汇', () => {
    expect(extractMedicineName('退烧药 布洛芬')).toContain('布洛芬');
    expect(extractMedicineName('消炎药 头孢')).toContain('头孢');
    expect(extractMedicineName('感冒药 白加黑')).toContain('白加黑');
  });

  test('处理血压血糖类药物', () => {
    expect(extractMedicineName('降压药 硝苯地平')).toContain('硝苯地平');
    expect(extractMedicineName('降糖药 二甲双胍')).toContain('二甲双胍');
  });

  test('处理消化系统药物', () => {
    expect(extractMedicineName('胃药 奥美拉唑')).toContain('奥美拉唑');
    expect(extractMedicineName('蒙脱石散 3g*10袋')).toContain('蒙脱石散');
  });

  test('处理呼吸系统药物', () => {
    expect(extractMedicineName('止咳糖浆 100ml')).toContain('止咳糖浆');
    expect(extractMedicineName('祛痰药 氨溴索')).toContain('氨溴索');
  });

  test('处理抗炎药物', () => {
    expect(extractMedicineName('阿莫西林克拉维酸钾分散片 156.25mg*12片')).toContain('维酸钾');
    expect(extractMedicineName('头孢拉定胶囊 0.25g*24粒')).toContain('头孢拉定');
  });

  test('处理外用药物', () => {
    expect(extractMedicineName('红霉素软膏 1%*10g')).toContain('红霉素软膏');
    expect(extractMedicineName('炉甘石洗剂 100ml')).toContain('炉甘石洗剂');
  });
});
