// pages/records/records.js
Page({
  data: {
    currentTab: 'medicines',
    medicines: [],
    records: [],
    cases: []
  },

  onShow() {
    this.loadData();
  },

  onLoad() {
    // 创建病例记录
    const cases = wx.getStorageSync('cases') || [];
    if (cases.length === 0) {
      wx.setStorageSync('cases', []);
    }
  },

  loadData() {
    const medicines = wx.getStorageSync('medicines') || [];
    const records = wx.getStorageSync('records') || [];
    const cases = wx.getStorageSync('cases') || [];

    this.setData({
      medicines: medicines.reverse(),
      records: records.reverse(),
      cases: cases.reverse()
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  // 跳转到详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 添加病例
  addCase() {
    wx.showModal({
      title: '添加病例',
      editable: true,
      placeholderText: '请输入病例描述',
      success: (res) => {
        if (res.confirm && res.content) {
          const cases = wx.getStorageSync('cases') || [];
          const newCase = {
            id: Date.now(),
            content: res.content,
            createTime: new Date().toLocaleString()
          };
          cases.push(newCase);
          wx.setStorageSync('cases', cases);
          this.loadData();
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除药品
  deleteMedicine(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个药品吗？',
      success: (res) => {
        if (res.confirm) {
          let medicines = wx.getStorageSync('medicines') || [];
          medicines = medicines.filter(m => m.id !== id);
          wx.setStorageSync('medicines', medicines);
          this.loadData();
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除记录
  deleteRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          let records = wx.getStorageSync('records') || [];
          records = records.filter(r => r.id !== id);
          wx.setStorageSync('records', records);
          this.loadData();
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 记录服药
  recordTake(e) {
    const id = e.currentTarget.dataset.id;
    const medicine = this.data.medicines.find(m => m.id === id);

    const records = wx.getStorageSync('records') || [];
    const newRecord = {
      id: Date.now(),
      medicineId: id,
      medicineName: medicine.name,
      takeTime: new Date().toLocaleString()
    };

    records.push(newRecord);
    wx.setStorageSync('records', records);

    wx.showToast({
      title: '记录成功',
      icon: 'success'
    });

    this.loadData();
  }
})
