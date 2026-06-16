const assert = require('assert');
const { extractMedicineName } = require('../../utils/ocr');

describe('extractMedicineName', function() {
  describe('关键词匹配', function() {
    it('应该识别包含胶囊的药品名称', function() {
      const result = extractMedicineName('阿莫西林胶囊 0.5g*24粒');
      assert.ok(result.includes('胶囊'), `Expected result to include '胶囊', got: ${result}`);
    });

    it('应该识别包含片的药品名称', function() {
      const result = extractMedicineName('布洛芬片 0.2g*100片');
      assert.ok(result.includes('片'), `Expected result to include '片', got: ${result}`);
    });

    it('应该识别包含颗粒的药品名称', function() {
      const result = extractMedicineName('感冒灵颗粒 10g*9袋');
      assert.ok(result.includes('颗粒'), `Expected result to include '颗粒', got: ${result}`);
    });

    it('应该识别包含口服液的药品名称', function() {
      const result = extractMedicineName('双黄连口服液 10ml*10支');
      assert.ok(result.includes('口服液'), `Expected result to include '口服液', got: ${result}`);
    });

    it('应该识别包含注射液的药品名称', function() {
      const result = extractMedicineName('生理盐水注射液 500ml');
      assert.ok(result.includes('注射液'), `Expected result to include '注射液', got: ${result}`);
    });

    it('应该识别包含阿莫西林的药品', function() {
      const result = extractMedicineName('阿莫西林胶囊 0.5g*24粒');
      assert.ok(result.includes('阿莫西林'), `Expected result to include '阿莫西林', got: ${result}`);
    });

    it('应该识别包含布洛芬的药品', function() {
      const result = extractMedicineName('布洛芬缓释胶囊');
      assert.ok(result.includes('布洛芬'), `Expected result to include '布洛芬', got: ${result}`);
    });

    it('应该识别包含头孢的药品', function() {
      const result = extractMedicineName('头孢克肟胶囊 50mg*12粒');
      assert.ok(result.includes('头孢'), `Expected result to include '头孢', got: ${result}`);
    });

    it('应该识别包含维生素的药品', function() {
      const result = extractMedicineName('维生素C片 100mg*60片');
      assert.ok(result.includes('维生素'), `Expected result to include '维生素', got: ${result}`);
    });

    it('应该识别包含钙片的药品', function() {
      const result = extractMedicineName('碳酸钙D3片 60片');
      assert.ok(result.includes('钙片') || result.includes('钙'), `Expected result to include '钙', got: ${result}`);
    });
  });

  describe('边界条件', function() {
    it('应该处理空字符串', function() {
      const result = extractMedicineName('');
      assert.strictEqual(result, '');
    });

    it('应该处理null输入', function() {
      const result = extractMedicineName(null);
      assert.strictEqual(result, '');
    });

    it('应该处理undefined输入', function() {
      const result = extractMedicineName(undefined);
      assert.strictEqual(result, '');
    });

    it('应该处理不包含任何关键词的文本', function() {
      const result = extractMedicineName('这是一个没有药品关键词的文本');
      assert.ok(result.length > 0);
    });

    it('应该返回第一行作为默认结果', function() {
      const result = extractMedicineName('第一行文本\n第二行文本\n第三行文本');
      assert.ok(result.startsWith('第一行'));
    });

    it('应该限制返回长度不超过30个字符', function() {
      const longText = '这是一个非常长的药品名称文本，超过了30个字符的限制';
      const result = extractMedicineName(longText);
      assert.ok(result.length <= 30, `Expected result length <= 30, got: ${result.length}`);
    });

    it('应该处理只有一个字符的输入', function() {
      const result = extractMedicineName('药');
      assert.strictEqual(result, '药');
    });
  });

  describe('实际场景', function() {
    it('应该从多行文本中提取药品名称', function() {
      const text = `
        阿莫西林胶囊
        规格：0.5g*24粒
        生产厂家：XX制药
        有效期至：2025-12-31
      `;
      const result = extractMedicineName(text);
      assert.ok(result.includes('阿莫西林'), `Expected result to include '阿莫西林', got: ${result}`);
    });

    it('应该从复杂包装文本中提取药品名称', function() {
      const text = `
        【药品名称】布洛芬缓释胶囊
        【商品名称】芬必得
        【规格】0.4g*20粒
        【适应症】用于缓解轻至中度疼痛如头痛、关节痛、偏头痛、牙痛、肌肉痛、神经痛、痛经。也用于普通感冒或流行性感冒引起的发热。
      `;
      const result = extractMedicineName(text);
      assert.ok(result.includes('布洛芬'), `Expected result to include '布洛芬', got: ${result}`);
    });

    it('应该从感冒灵文本中提取药品名称', function() {
      const text = `
        999感冒灵颗粒
        10g*9袋
        华润三九医药股份有限公司
      `;
      const result = extractMedicineName(text);
      assert.ok(result.includes('感冒灵'), `Expected result to include '感冒灵', got: ${result}`);
    });
  });
});