// pages/detail/detail.js
Page({
  data: {
    medicine: null,
    records: []
  },

  onLoad(options) {
    const id = parseInt(options.id);
    const medicines = wx.getStorageSync('medicines') || [];
    const medicine = medicines.find(m => m.id === id);

    if (medicine) {
      // 获取该药品的服药记录
      const records = wx.getStorageSync('records') || [];
      const medicineRecords = records.filter(r => r.medicineId === id);

      this.setData({
        medicine: medicine,
        records: medicineRecords.reverse()
      });
    }
  },

  // 记录服药
  recordTake() {
    const records = wx.getStorageSync('records') || [];
    const newRecord = {
      id: Date.now(),
      medicineId: this.data.medicine.id,
      medicineName: this.data.medicine.name,
      takeTime: new Date().toLocaleString()
    };

    records.push(newRecord);
    wx.setStorageSync('records', records);

    // 更新页面记录
    this.setData({
      records: [newRecord, ...this.data.records]
    });

    wx.showToast({
      title: '记录成功',
      icon: 'success'
    });
  },

  // 删除药品
  deleteMedicine() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个药品吗？',
      success: (res) => {
        if (res.confirm) {
          let medicines = wx.getStorageSync('medicines') || [];
          medicines = medicines.filter(m => m.id !== this.data.medicine.id);
          wx.setStorageSync('medicines', medicines);

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });

          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  }
})
