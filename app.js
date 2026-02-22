// app.js
App({
  onLaunch() {
    // 初始化本地存储
    const medicines = wx.getStorageSync('medicines') || [];
    const records = wx.getStorageSync('records') || [];
    const cases = wx.getStorageSync('cases') || [];

    if (medicines.length === 0) {
      wx.setStorageSync('medicines', []);
    }
    if (records.length === 0) {
      wx.setStorageSync('records', []);
    }
    if (cases.length === 0) {
      wx.setStorageSync('cases', []);
    }
  },

  globalData: {
    userInfo: null
  }
})
