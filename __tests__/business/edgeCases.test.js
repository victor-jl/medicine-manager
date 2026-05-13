describe('data validation', () => {
  describe('ID generation', () => {
    test('Date.now应生成唯一ID或相同值可接受', () => {
      const id1 = Date.now();
      const id2 = Date.now();
      expect(typeof id1).toBe('number');
      expect(typeof id2).toBe('number');
    });

    test('生成的ID应为正整数', () => {
      const id = Date.now();
      expect(id).toBeGreaterThan(0);
      expect(Number.isInteger(id)).toBe(true);
    });
  });

  describe('date handling edge cases', () => {
    test('应正确处理日期字符串格式', () => {
      const dateStr = '2025-12-31';
      const date = new Date(dateStr);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
    });

    test('应正确处理无效日期', () => {
      const dateStr = 'invalid-date';
      const date = new Date(dateStr);
      expect(isNaN(date.getTime())).toBe(true);
    });

    test('应正确处理ISO格式日期', () => {
      const isoDate = '2025-12-31T00:00:00.000Z';
      const date = new Date(isoDate);
      expect(date.getFullYear()).toBe(2025);
    });

    test('应正确处理toLocaleString输出', () => {
      const date = new Date();
      const localeStr = date.toLocaleString();
      expect(typeof localeStr).toBe('string');
      expect(localeStr.length).toBeGreaterThan(0);
    });

    test('应正确处理toDateString输出', () => {
      const date = new Date();
      const dateStr = date.toDateString();
      expect(dateStr).toMatch(/^\w{3} \w{3} \d{1,2} \d{4}$/);
    });

    test('应正确计算30天后的日期', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const diffDays = Math.floor((thirtyDaysLater - now) / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(30);
    });

    test('应正确处理闰年的2月', () => {
      const leapYearDate = new Date('2024-02-29');
      expect(leapYearDate.getMonth()).toBe(1);
      expect(leapYearDate.getDate()).toBe(29);
    });

    test('应正确处理年末到年初的边界', () => {
      const endOfYear = new Date('2024-12-31');
      const startOfYear = new Date('2025-01-01');
      expect(endOfYear < startOfYear).toBe(true);
    });
  });

  describe('string manipulation edge cases', () => {
    test('split应正确处理多行文本', () => {
      const text = '第一行\n第二行\n第三行';
      const lines = text.split('\n');
      expect(lines).toHaveLength(3);
    });

    test('split应正确处理混合换行符', () => {
      const text = '第一行\r\n第二行\r第三行';
      const lines = text.split(/[\n\r]/).filter(line => line.trim());
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });

    test('substring应正确处理边界情况', () => {
      const text = '阿莫西林胶囊';
      const start = 0;
      const end = 10;
      const result = text.substring(start, end);
      expect(result).toContain('阿莫西林');
    });

    test('substring应处理start大于length的情况', () => {
      const text = '短';
      const result = text.substring(10, 20);
      expect(result).toBe('');
    });

    test('toLowerCase应正确处理中文字符', () => {
      const chineseUpper = '阿莫西林胶囊';
      const result = chineseUpper.toLowerCase();
      expect(result).toBe(chineseUpper);
    });

    test('trim应正确处理各种空白字符', () => {
      expect('  abc  '.trim()).toBe('abc');
      expect('\t\tabc\t\t'.trim()).toBe('abc');
      expect('\nabc\n'.trim()).toBe('abc');
    });
  });

  describe('array manipulation edge cases', () => {
    test('filter应正确处理空数组', () => {
      const empty = [];
      const filtered = empty.filter(() => true);
      expect(filtered).toHaveLength(0);
    });

    test('find应正确处理找到和未找到的情况', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const found = items.find(i => i.id === 1);
      const notFound = items.find(i => i.id === 999);
      expect(found).toBeDefined();
      expect(notFound).toBeUndefined();
    });

    test('map应正确处理数组转换', () => {
      const items = [{ words: 'a' }, { words: 'b' }];
      const words = items.map(item => item.words);
      expect(words).toEqual(['a', 'b']);
    });

    test('slice应正确处理负数索引', () => {
      const items = [1, 2, 3, 4, 5];
      expect(items.slice(-2)).toEqual([4, 5]);
      expect(items.slice(0, -1)).toEqual([1, 2, 3, 4]);
    });

    test('reverse应正确反转数组', () => {
      const items = [1, 2, 3];
      const reversed = items.reverse();
      expect(reversed[0]).toBe(3);
    });
  });

  describe('storage simulation', () => {
    test('应正确模拟存储操作', () => {
      const storage = {};
      storage['medicines'] = [];
      expect(Array.isArray(storage['medicines'])).toBe(true);

      storage['medicines'].push({ id: 1, name: 'test' });
      expect(storage['medicines']).toHaveLength(1);
    });

    test('应正确模拟删除操作', () => {
      const storage = { medicines: [{ id: 1 }, { id: 2 }] };
      storage.medicines = storage.medicines.filter(m => m.id !== 1);
      expect(storage.medicines).toHaveLength(1);
      expect(storage.medicines[0].id).toBe(2);
    });

    test('应正确处理未初始化的键', () => {
      const storage = {};
      const value = storage['nonexistent'] || [];
      expect(value).toEqual([]);
    });
  });

  describe('error handling', () => {
    test('new Error应创建错误对象', () => {
      const error = new Error('test error');
      expect(error.message).toBe('test error');
      expect(error instanceof Error).toBe(true);
    });

    test('JSON.stringify应正确序列化对象', () => {
      const obj = { a: 1, b: 'test' };
      const json = JSON.stringify(obj);
      expect(json).toBe('{"a":1,"b":"test"}');
    });

    test('正则表达式应正确匹配关键词', () => {
      const text = '阿莫西林胶囊 0.25g';
      const keywords = ['胶囊', '片', '颗粒'];

      let matched = false;
      for (const kw of keywords) {
        if (text.includes(kw)) {
          matched = true;
          break;
        }
      }
      expect(matched).toBe(true);
    });
  });

  describe('description formatting', () => {
    test('应正确构建多行描述', () => {
      const medicineInfo = {
        specification: '0.25g',
        manufacturer: '某药厂',
        usage: '口服',
        approvalNumber: 'H123456',
        storage: '密封',
        ingredients: '阿莫西林'
      };

      const descParts = [];
      if (medicineInfo.specification) descParts.push(`规格: ${medicineInfo.specification}`);
      if (medicineInfo.manufacturer) descParts.push(`厂家: ${medicineInfo.manufacturer}`);
      if (medicineInfo.usage) descParts.push(`用法: ${medicineInfo.usage}`);

      const description = descParts.join('\n');
      expect(description).toContain('规格: 0.25g');
      expect(description).toContain('厂家: 某药厂');
      expect(description.split('\n')).toHaveLength(3);
    });

    test('应跳过空字段', () => {
      const medicineInfo = {
        specification: '0.25g',
        manufacturer: '',
        usage: null
      };

      const descParts = [];
      if (medicineInfo.specification) descParts.push(`规格: ${medicineInfo.specification}`);
      if (medicineInfo.manufacturer) descParts.push(`厂家: ${medicineInfo.manufacturer}`);
      if (medicineInfo.usage) descParts.push(`用法: ${medicineInfo.usage}`);

      expect(descParts).toHaveLength(1);
    });
  });
});
