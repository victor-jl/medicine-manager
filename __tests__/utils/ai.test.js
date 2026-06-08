/**
 * utils/ai.js 单元测试
 * 测试重点：药品信息解析、日期格式化、边界条件处理
 */
const { analyzeMedicineInfo, formatExpiryDate } = require('../../utils/ai');

describe('utils/ai.js', () => {
  describe('analyzeMedicineInfo - 药品信息分析', () => {
    describe('基础功能', () => {
      test('应处理空输入', () => {
        const result = analyzeMedicineInfo('');
        expect(result).toEqual({
          name: '',
          expiryDate: '',
          specification: '',
          manufacturer: '',
          usage: '',
          approvalNumber: '',
          storage: '',
          ingredients: ''
        });
      });

      test('应处理null输入', () => {
        const result = analyzeMedicineInfo(null);
        expect(result.name).toBe('');
      });

      test('应处理undefined输入', () => {
        const result = analyzeMedicineInfo(undefined);
        expect(result.name).toBe('');
      });

      test('应处理非字符串输入', () => {
        const result = analyzeMedicineInfo(123);
        expect(result.name).toBe('');
      });
    });

    describe('药品名称提取', () => {
      test('应从剂型关键词提取名称', () => {
        const text = '阿莫西林胶囊\n规格：0.5g';
        const result = analyzeMedicineInfo(text);
        expect(result.name).toContain('阿莫西林');
        expect(result.name).toContain('胶囊');
      });

      test('应识别片剂', () => {
        const text = '布洛芬片\n有效期至2025年12月';
        const result = analyzeMedicineInfo(text);
        expect(result.name).toContain('布洛芬');
        expect(result.name).toContain('片');
      });

      test('应识别颗粒剂', () => {
        const text = '感冒灵颗粒';
        const result = analyzeMedicineInfo(text);
        expect(result.name).toContain('颗粒');
      });

      test('应识别口服液', () => {
        const text = '双黄连口服液';
        const result = analyzeMedicineInfo(text);
        expect(result.name).toContain('口服液');
      });

      test('应识别注射液', () => {
        const text = '头孢注射液';
        const result = analyzeMedicineInfo(text);
        expect(result.name).toContain('注射液');
      });

      test('无关键词时应使用第一行', () => {
        const text = '未知药品\n第二行';
        const result = analyzeMedicineInfo(text);
        expect(result.name).toBe('未知药品');
      });

      test('应截断过长的名称', () => {
        const longName = '阿莫西林胶囊'.repeat(20);
        const result = analyzeMedicineInfo(longName);
        expect(result.name.length).toBeLessThanOrEqual(50);
      });
    });

    describe('有效期提取', () => {
      test('应提取"有效期至"格式', () => {
        const text = '有效期至：2025年12月31日';
        const result = analyzeMedicineInfo(text);
        expect(result.expiryDate).toContain('2025');
        expect(result.expiryDate).toContain('12');
      });

      test('应提取"有效期:"格式', () => {
        const text = '有效期: 2025-12-31';
        const result = analyzeMedicineInfo(text);
        expect(result.expiryDate).toBe('2025-12-31');
      });

      test('应提取EXP格式', () => {
        const text = 'EXP: 2025/12/31';
        const result = analyzeMedicineInfo(text);
        expect(result.expiryDate).toContain('2025');
      });

      test('应提取"前使用"格式', () => {
        const text = '2025年12月31日前使用';
        const result = analyzeMedicineInfo(text);
        expect(result.expiryDate).toContain('2025');
      });
    });

    describe('规格提取', () => {
      test('应提取规格信息', () => {
        const text = '阿莫西林胶囊\n规格：0.5g*12粒';
        const result = analyzeMedicineInfo(text);
        expect(result.specification).toBe('0.5g*12粒');
      });

      test('应处理规格：格式', () => {
        const text = '规格: 10mg*30片';
        const result = analyzeMedicineInfo(text);
        expect(result.specification).toBe('10mg*30片');
      });
    });

    describe('生产厂家提取', () => {
      test('应提取生产企业', () => {
        const text = '生产企业：XX制药有限公司';
        const result = analyzeMedicineInfo(text);
        expect(result.manufacturer).toBe('XX制药有限公司');
      });

      test('应提取生产厂家', () => {
        const text = '生产厂家：YY药业';
        const result = analyzeMedicineInfo(text);
        expect(result.manufacturer).toBe('YY药业');
      });

      test('应提取厂家', () => {
        const text = '厂家：ZZ制药';
        const result = analyzeMedicineInfo(text);
        expect(result.manufacturer).toBe('ZZ制药');
      });
    });

    describe('用法用量提取', () => {
      test('应提取用法用量', () => {
        const text = '用法用量：口服，一次1粒，一日3次';
        const result = analyzeMedicineInfo(text);
        expect(result.usage).toBe('口服，一次1粒，一日3次');
      });

      test('应提取用法', () => {
        const text = '用法：口服';
        const result = analyzeMedicineInfo(text);
        expect(result.usage).toBe('口服');
      });

      test('应提取用量', () => {
        const text = '用量：一次1片';
        const result = analyzeMedicineInfo(text);
        expect(result.usage).toBe('一次1片');
      });
    });

    describe('批准文号提取', () => {
      test('应提取国药准字', () => {
        const text = '国药准字H12345678';
        const result = analyzeMedicineInfo(text);
        expect(result.approvalNumber).toContain('H12345678');
      });

      test('应提取批准文号', () => {
        const text = '批准文号：国药准字Z20201234';
        const result = analyzeMedicineInfo(text);
        expect(result.approvalNumber).toContain('Z20201234');
      });
    });

    describe('贮藏条件提取', () => {
      test('应提取贮藏条件', () => {
        const text = '贮藏：密封，在阴凉处保存';
        const result = analyzeMedicineInfo(text);
        expect(result.storage).toBe('密封，在阴凉处保存');
      });
    });

    describe('成分提取', () => {
      test('应提取成分', () => {
        const text = '成分：阿莫西林三水合物';
        const result = analyzeMedicineInfo(text);
        expect(result.ingredients).toBe('阿莫西林三水合物');
      });

      test('应提取主要成分', () => {
        const text = '主要成分：布洛芬';
        const result = analyzeMedicineInfo(text);
        expect(result.ingredients).toBe('布洛芬');
      });
    });

    describe('综合测试', () => {
      test('应正确解析完整的药品包装信息', () => {
        const text = `
          阿莫西林胶囊
          批准文号：国药准字H12345678
          规格：0.5g*12粒/盒
          生产企业：XX制药有限公司
          用法用量：口服，一次1粒，一日3次
          有效期至：2025年12月31日
          贮藏：密封，在干燥处保存
          成分：阿莫西林三水合物
        `;

        const result = analyzeMedicineInfo(text);

        expect(result.name).toContain('阿莫西林');
        expect(result.approvalNumber).toContain('H12345678');
        expect(result.specification).toBe('0.5g*12粒/盒');
        expect(result.manufacturer).toBe('XX制药有限公司');
        expect(result.usage).toBe('口服，一次1粒，一日3次');
        expect(result.expiryDate).toContain('2025');
        expect(result.storage).toBe('密封，在干燥处保存');
        expect(result.ingredients).toBe('阿莫西林三水合物');
      });
    });
  });

  describe('formatExpiryDate - 日期格式化', () => {
    describe('基础功能', () => {
      test('应处理空输入', () => {
        expect(formatExpiryDate('')).toBe('');
        expect(formatExpiryDate(null)).toBe('');
        expect(formatExpiryDate(undefined)).toBe('');
      });

      test('应处理非字符串输入', () => {
        expect(formatExpiryDate(123)).toBe('');
      });
    });

    describe('中文日期格式', () => {
      test('应格式化"2025年12月31日"', () => {
        expect(formatExpiryDate('2025年12月31日')).toBe('2025-12-31');
      });

      test('应格式化"2025年12月"', () => {
        expect(formatExpiryDate('2025年12月')).toBe('2025-12-01');
      });

      test('应格式化单数字月份', () => {
        expect(formatExpiryDate('2025年1月5日')).toBe('2025-01-05');
      });
    });

    describe('标准日期格式', () => {
      test('应格式化"2025-12-31"', () => {
        expect(formatExpiryDate('2025-12-31')).toBe('2025-12-31');
      });

      test('应格式化"2025/12/31"', () => {
        expect(formatExpiryDate('2025/12/31')).toBe('2025-12-31');
      });

      test('应格式化"2025.12.31"', () => {
        expect(formatExpiryDate('2025.12.31')).toBe('2025-12-31');
      });
    });

    describe('月/年格式', () => {
      test('应格式化"12/2025"', () => {
        expect(formatExpiryDate('12/2025')).toBe('2025-12-01');
      });

      test('应格式化"12-2025"', () => {
        expect(formatExpiryDate('12-2025')).toBe('2025-12-01');
      });
    });

    describe('边界条件', () => {
      test('应处理带空格的日期', () => {
        expect(formatExpiryDate('  2025-12-31  ')).toBe('2025-12-31');
      });

      test('应返回无法解析的原始字符串', () => {
        expect(formatExpiryDate('invalid-date')).toBe('invalid-date');
      });

      test('应处理不完整的日期', () => {
        expect(formatExpiryDate('2025-12')).toBe('2025-12-01');
      });
    });
  });
});
