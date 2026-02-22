// pages/index/index.js
Page({
  data: {
    medicines: [],
    expiringMedicines: [],
    todayRecords: []
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const medicines = wx.getStorageSync('medicines') || [];
    const records = wx.getStorageSync('records') || [];

    // 获取即将过期的药品（30天内）
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiring = medicines.filter(m => {
      if (!m.expiryDate) return false;
      const expiry = new Date(m.expiryDate);
      return expiry <= thirtyDaysLater && expiry >= now;
    });

    // 获取今日记录
    const today = new Date().toDateString();
    const todayRecords = records.filter(r => {
      return new Date(r.takeTime).toDateString() === today;
    });

    this.setData({
      medicines: medicines.slice(0, 5),
      expiringMedicines: expiring,
      todayRecords: todayRecords
    });
  },

  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    });
  },

  goToRecords() {
    wx.switchTab({
      url: '/pages/records/records'
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
})
