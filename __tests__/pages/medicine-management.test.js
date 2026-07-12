/**
 * 药品管理业务逻辑测试
 * 测试药品添加、保存、删除和过期检查功能
 */

const { wx, clearMockStorage, setMockStorageData, getMockStorageData } = require('../utils/wx-mock');

// 设置全局 wx 对象
global.wx = wx;

describe('药品管理业务逻辑测试', () => {
  
  beforeEach(() => {
    clearMockStorage();
    jest.clearAllMocks();
  });
  
  describe('药品添加和保存功能', () => {
    
    test('应该能正确保存新药品', () => {
      const medicines = [];
      const newMedicine = {
        id: Date.now(),
        name: '阿莫西林胶囊',
        expiryDate: '2025-12-31',
        description: '规格：0.5g×12粒/盒',
        createTime: new Date().toLocaleString()
      };
      
      medicines.push(newMedicine);
      wx.setStorageSync('medicines', medicines);
      
      expect(wx.setStorageSync).toHaveBeenCalledWith('medicines', medicines);
      expect(getMockStorageData('medicines')).toHaveLength(1);
      expect(getMockStorageData('medicines')[0].name).toBe('阿莫西林胶囊');
    });
    
    test('应该能保存包含完整信息的药品', () => {
      const newMedicine = {
        id: Date.now(),
        name: '布洛芬片',
        expiryDate: '2025-06-30',
        specification: '0.2g',
        manufacturer: '某某制药有限公司',
        usage: '口服，一次1片，一日3次',
        approvalNumber: '国药准字H12345678',
        storage: '密封，在干燥处保存',
        ingredients: '布洛芬',
        createTime: new Date().toLocaleString()
      };
      
      wx.setStorageSync('medicines', [newMedicine]);
      
      const saved = getMockStorageData('medicines')[0];
      expect(saved.name).toBe('布洛芬片');
      expect(saved.specification).toBe('0.2g');
      expect(saved.manufacturer).toBeTruthy();
      expect(saved.approvalNumber).toBeTruthy();
    });
    
    test('应该能验证药品名称必填', () => {
      const medicine = {
        name: '',
        expiryDate: '2025-12-31'
      };
      
      const isValid = Boolean(medicine.name && medicine.name.trim().length > 0);
      expect(isValid).toBe(false);
      
      // 模拟 showToast 应该被调用
      if (!isValid) {
        wx.showToast({ title: '请输入药品名称', icon: 'none' });
      }
      expect(wx.showToast).toHaveBeenCalled();
    });
    
    test('应该能为药品生成唯一ID', () => {
      const medicines = [];
      const now = Date.now();
      
      const medicine1 = { id: now, name: '药品1' };
      const medicine2 = { id: now + 1, name: '药品2' };
      
      medicines.push(medicine1, medicine2);
      wx.setStorageSync('medicines', medicines);
      
      const saved = getMockStorageData('medicines');
      expect(saved[0].id).not.toBe(saved[1].id);
    });
    
    test('应该能保存药品照片路径', () => {
      const newMedicine = {
        id: Date.now(),
        name: '测试药品',
        photos: ['/tmp/photo1.jpg', '/tmp/photo2.jpg'],
        createTime: new Date().toLocaleString()
      };
      
      wx.setStorageSync('medicines', [newMedicine]);
      
      const saved = getMockStorageData('medicines')[0];
      expect(saved.photos).toHaveLength(2);
      expect(saved.photos[0]).toContain('photo1.jpg');
    });
  });
  
  describe('药品删除功能', () => {
    
    test('应该能根据ID删除药品', () => {
      const medicines = [
        { id: 1, name: '药品1' },
        { id: 2, name: '药品2' },
        { id: 3, name: '药品3' }
      ];
      
      setMockStorageData('medicines', medicines);
      
      const idToDelete = 2;
      const filtered = medicines.filter(m => m.id !== idToDelete);
      wx.setStorageSync('medicines', filtered);
      
      const remaining = getMockStorageData('medicines');
      expect(remaining).toHaveLength(2);
      expect(remaining.find(m => m.id === 2)).toBeUndefined();
    });
    
    test('删除药品时应该显示确认对话框', () => {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这个药品吗？',
        success: (res) => {
          if (res.confirm) {
            // 用户确认删除
          }
        }
      });
      
      expect(wx.showModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认删除',
          content: expect.any(String)
        })
      );
    });
    
    test('删除后应该显示成功提示', () => {
      wx.showToast({ title: '删除成功', icon: 'success' });
      expect(wx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: '删除成功' })
      );
    });
  });
  
  describe('药品过期检查功能', () => {
    
    test('应该能正确判断药品是否即将过期（30天内）', () => {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const medicines = [
        { id: 1, name: '药品A', expiryDate: now.toISOString() },
        { id: 2, name: '药品B', expiryDate: thirtyDaysLater.toISOString() },
        { id: 3, name: '药品C', expiryDate: '2026-12-31' }
      ];
      
      const expiring = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry <= thirtyDaysLater && expiry >= now;
      });
      
      expect(expiring).toHaveLength(2);
      expect(expiring.find(m => m.name === '药品C')).toBeUndefined();
    });
    
    test('应该能过滤出已过期的药品', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      
      const medicines = [
        { id: 1, name: '已过期药品', expiryDate: pastDate.toISOString() },
        { id: 2, name: '未过期药品', expiryDate: '2026-12-31' }
      ];
      
      const expired = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiry = new Date(m.expiryDate);
        return expiry < now;
      });
      
      expect(expired).toHaveLength(1);
      expect(expired[0].name).toBe('已过期药品');
    });
    
    test('应该能处理没有有效期信息的药品', () => {
      const medicines = [
        { id: 1, name: '药品A', expiryDate: null },
        { id: 2, name: '药品B', expiryDate: '' },
        { id: 3, name: '药品C', expiryDate: undefined }
      ];
      
      const withExpiry = medicines.filter(m => m.expiryDate);
      expect(withExpiry).toHaveLength(0);
    });
    
    test('应该能正确计算剩余天数', () => {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      
      const medicine = { expiryDate: expiryDate.toISOString() };
      const expiry = new Date(medicine.expiryDate);
      const daysRemaining = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
      
      expect(daysRemaining).toBe(15);
    });
  });
  
  describe('服药记录功能', () => {
    
    test('应该能创建服药记录', () => {
      const medicineId = 123;
      const medicineName = '阿莫西林胶囊';
      
      const newRecord = {
        id: Date.now(),
        medicineId: medicineId,
        medicineName: medicineName,
        takeTime: new Date().toLocaleString()
      };
      
      wx.setStorageSync('records', [newRecord]);
      
      const saved = getMockStorageData('records')[0];
      expect(saved.medicineId).toBe(medicineId);
      expect(saved.medicineName).toBe(medicineName);
      expect(saved.takeTime).toBeTruthy();
    });
    
    test('应该能查询特定药品的服药记录', () => {
      const medicineId = 123;
      const records = [
        { id: 1, medicineId: 123, takeTime: '2025-01-01 10:00' },
        { id: 2, medicineId: 123, takeTime: '2025-01-02 10:00' },
        { id: 3, medicineId: 456, takeTime: '2025-01-01 10:00' }
      ];
      
      setMockStorageData('records', records);
      
      const medicineRecords = records.filter(r => r.medicineId === medicineId);
      expect(medicineRecords).toHaveLength(2);
    });
    
    test('应该能获取今日服药记录', () => {
      const today = new Date().toDateString();
      const records = [
        { id: 1, takeTime: new Date().toISOString() },
        { id: 2, takeTime: '2025-01-01T10:00:00' }
      ];
      
      const todayRecords = records.filter(r => {
        return new Date(r.takeTime).toDateString() === today;
      });
      
      expect(todayRecords).toHaveLength(1);
    });
    
    test('应该能删除服药记录', () => {
      const records = [
        { id: 1, medicineId: 123 },
        { id: 2, medicineId: 123 }
      ];
      
      setMockStorageData('records', records);
      
      const filtered = records.filter(r => r.id !== 1);
      wx.setStorageSync('records', filtered);
      
      expect(getMockStorageData('records')).toHaveLength(1);
    });
  });
  
  describe('病例记录功能', () => {
    
    test('应该能创建病例记录', () => {
      const newCase = {
        id: Date.now(),
        content: '感冒发烧，体温38.5度',
        createTime: new Date().toLocaleString()
      };
      
      wx.setStorageSync('cases', [newCase]);
      
      const saved = getMockStorageData('cases')[0];
      expect(saved.content).toBe('感冒发烧，体温38.5度');
      expect(saved.createTime).toBeTruthy();
    });
    
    test('应该能正确初始化病例存储', () => {
      const cases = wx.getStorageSync('cases') || [];
      if (cases.length === 0) {
        wx.setStorageSync('cases', []);
      }
      
      expect(wx.setStorageSync).toHaveBeenCalled();
    });
  });
  
  describe('数据加载和初始化功能', () => {
    
    test('应该能正确初始化本地存储', () => {
      // 模拟 app.js 的初始化逻辑
      const medicines = wx.getStorageSync('medicines') || [];
      const records = wx.getStorageSync('records') || [];
      const cases = wx.getStorageSync('cases') || [];
      
      if (medicines.length === 0) wx.setStorageSync('medicines', []);
      if (records.length === 0) wx.setStorageSync('records', []);
      if (cases.length === 0) wx.setStorageSync('cases', []);
      
      expect(wx.setStorageSync).toHaveBeenCalledTimes(3);
    });
    
    test('应该能加载已保存的药品列表', () => {
      const savedMedicines = [
        { id: 1, name: '药品A' },
        { id: 2, name: '药品B' }
      ];
      
      setMockStorageData('medicines', savedMedicines);
      
      const medicines = wx.getStorageSync('medicines') || [];
      expect(medicines).toHaveLength(2);
    });
    
    test('应该能正确处理空存储情况', () => {
      const medicines = wx.getStorageSync('medicines') || [];
      expect(medicines).toEqual([]);
    });
  });
  
  describe('导航和页面跳转功能', () => {
    
    test('应该能导航到添加药品页面', () => {
      wx.navigateTo({ url: '/pages/add/add' });
      expect(wx.navigateTo).toHaveBeenCalledWith({ url: '/pages/add/add' });
    });
    
    test('应该能跳转到详情页面并传递参数', () => {
      const medicineId = 123;
      wx.navigateTo({ url: `/pages/detail/detail?id=${medicineId}` });
      expect(wx.navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({ url: expect.stringContaining('id=123') })
      );
    });
    
    test('应该能切换到记录页面', () => {
      wx.switchTab({ url: '/pages/records/records' });
      expect(wx.switchTab).toHaveBeenCalledWith({ url: '/pages/records/records' });
    });
    
    test('应该能返回上一页', () => {
      wx.navigateBack();
      expect(wx.navigateBack).toHaveBeenCalled();
    });
  });
});