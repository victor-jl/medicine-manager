describe('边界条件与异常处理', () => {
  describe('OCR解析边界条件', () => {
    function extractMedicineName(text) {
      if (!text) return '';
      
      const keywords = [
        '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂', '滴眼液', '糖浆',
        '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素', '罗红霉素',
        '感冒灵', '感冒清热', '板蓝根', '双黄连', '莲花清瘟',
        '维生素', '钙片', '铁剂', '锌', '叶酸',
        '奥美拉唑', '兰索拉唑', '泮托拉唑',
        '硝苯地平', '氨氯地平', '贝那普利',
        '二甲双胍', '格列本脲', '胰岛素',
        '阿司匹林', '氯吡格雷', '他汀',
        '氯雷他定', '西替利嗪', '蒙脱石',
        '止咳', '祛痰', '平喘', '消炎', '退烧', '止痛'
      ];
      
      const lowerText = text.toLowerCase();
      
      for (const kw of keywords) {
        if (lowerText.includes(kw)) {
          const idx = lowerText.indexOf(kw);
          const start = Math.max(0, idx - 8);
          const end = Math.min(text.length, idx + kw.length + 10);
          return text.substring(start, end).trim();
        }
      }
      
      return text.split('\n')[0].trim().substring(0, 30);
    }

    test('空字符串返回空字符串', () => {
      expect(extractMedicineName('')).toBe('');
    });

    test('纯空白字符串返回空字符串', () => {
      expect(extractMedicineName('   ')).toBe('');
    });

    test('仅包含数字的字符串返回部分内容', () => {
      const result = extractMedicineName('1234567890');
      expect(typeof result).toBe('string');
    });

    test('超长字符串应截断', () => {
      const longText = 'A'.repeat(100) + '胶囊' + 'B'.repeat(100);
      const result = extractMedicineName(longText);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    test('包含换行符的文本应处理', () => {
      const text = '第一行\n第二行胶囊\n第三行';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });

    test('包含特殊字符的文本应处理', () => {
      const text = '药品名称: 阿莫西林胶囊 (0.25g)';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('关键词在开头应正确提取', () => {
      const text = '胶囊装的药';
      const result = extractMedicineName(text);
      expect(result).toContain('胶囊');
    });

    test('关键词在结尾应正确提取', () => {
      const text = '阿莫西林';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('关键词在中间应正确提取', () => {
      const text = 'XXX制药生产的阿莫西林胶囊';
      const result = extractMedicineName(text);
      expect(result).toContain('阿莫西林');
    });

    test('Unicode字符应正确处理', () => {
      const text = '维生素C片 100mg';
      const result = extractMedicineName(text);
      expect(result).toBeTruthy();
    });
  });

  describe('日期处理边界条件', () => {
    function isValidDate(dateStr) {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }

    function parseExpiryDate(dateStr) {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date;
    }

    test('空字符串不是有效日期', () => {
      expect(isValidDate('')).toBe(false);
    });

    test('null不是有效日期', () => {
      expect(isValidDate(null)).toBe(false);
    });

    test('undefined不是有效日期', () => {
      expect(isValidDate(undefined)).toBe(false);
    });

    test('无效日期字符串返回null', () => {
      expect(parseExpiryDate('not-a-date')).toBeNull();
    });

    test('无效日期字符串不是有效日期', () => {
      expect(isValidDate('not-a-date')).toBe(false);
    });

    test('YYYY-MM-DD格式应有效', () => {
      expect(isValidDate('2025-12-31')).toBe(true);
    });

    test('YYYY/MM/DD格式应有效', () => {
      expect(isValidDate('2025/12/31')).toBe(true);
    });

    test('未来很远日期应有效', () => {
      const farFuture = new Date(Date.now() + 365 * 10 * 24 * 60 * 60 * 1000);
      expect(isValidDate(farFuture.toISOString())).toBe(true);
    });

    test('过去日期应有效', () => {
      const past = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      expect(isValidDate(past.toISOString())).toBe(true);
    });
  });

  describe('数据操作边界条件', () => {
    function filterById(items, id) {
      return items.filter(item => item.id === id);
    }

    function removeById(items, id) {
      return items.filter(item => item.id !== id);
    }

    test('空数组过滤应返回空数组', () => {
      expect(filterById([], 1).length).toBe(0);
    });

    test('空数组删除应返回空数组', () => {
      expect(removeById([], 1).length).toBe(0);
    });

    test('删除不存在的ID应返回原数组', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = removeById(items, 999);
      expect(result.length).toBe(2);
    });

    test('多次删除同一ID应只删除一次', () => {
      const items = [{ id: 1 }, { id: 1 }, { id: 2 }];
      const result = removeById(items, 1);
      expect(result.length).toBe(1);
    });

    test('数组应保持原始顺序', () => {
      const items = [{ id: 3 }, { id: 1 }, { id: 2 }];
      const result = removeById(items, 1);
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
    });
  });

  describe('字符串处理边界条件', () => {
    function buildDescription(parts) {
      if (!parts || !Array.isArray(parts)) return '';
      const descParts = parts.filter(p => p).map(p => p.trim()).filter(p => p);
      return descParts.join('\n');
    }

    test('空数组应返回空字符串', () => {
      expect(buildDescription([])).toBe('');
    });

    test('包含空字符串的数组应过滤', () => {
      const result = buildDescription(['规格: 0.25g', '', '厂家: XXX']);
      expect(result).toBe('规格: 0.25g\n厂家: XXX');
    });

    test('全空字符串数组应返回空字符串', () => {
      expect(buildDescription(['', '', ''])).toBe('');
    });

    test('undefined应返回空字符串', () => {
      expect(buildDescription(undefined)).toBe('');
    });

    test('null应返回空字符串', () => {
      expect(buildDescription(null)).toBe('');
    });

    test('字符串两端空格应被修剪', () => {
      const result = buildDescription(['  规格: 0.25g  ', '厂家: XXX  ']);
      expect(result).toBe('规格: 0.25g\n厂家: XXX');
    });
  });
});
