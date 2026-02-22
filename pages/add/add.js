// pages/add/add.js
const { recognizeWithBaidu, extractMedicineName } = require('../../utils/ocr');

Page({
  data: {
    name: '',
    expiryDate: '',
    description: '',
    photos: [],
    isIdentifying: false,
    // 百度API配置
    baiduApiKey: 'AWWs4izOHOWa7jhiKkCASDts',
    baiduSecretKey: 'fbxKdLTrl5gz1OmLtTUD9UcOLopQP0ru'
  },

  onLoad() {
    // 首次使用时保存配置
    wx.setStorageSync('baiduApiKey', 'AWWs4izOHOWa7jhiKkCASDts');
    wx.setStorageSync('baiduSecretKey', 'fbxKdLTrl5gz1OmLtTUD9UcOLopQP0ru');
  },

  // 保存API配置
  saveApiConfig() {
    wx.setStorageSync('baiduApiKey', this.data.baiduApiKey);
    wx.setStorageSync('baiduSecretKey', this.data.baiduSecretKey);
    wx.showToast({ title: '配置已保存', icon: 'success' });
  },

  onApiKeyInput(e) {
    this.setData({ baiduApiKey: e.detail.value });
  },

  onSecretKeyInput(e) {
    this.setData({ baiduSecretKey: e.detail.value });
  },

  // 拍照识别药品
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ photos: [tempFilePath] });
        this.doIdentify(tempFilePath);
      }
    });
  },

  // 从相册选择
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ photos: [tempFilePath] });
        this.doIdentify(tempFilePath);
      }
    });
  },

  // 执行识别
  async doIdentify(imagePath) {
    const apiKey = wx.getStorageSync('baiduApiKey');
    const secretKey = wx.getStorageSync('baiduSecretKey');

    if (!apiKey || !secretKey) {
      wx.showModal({
        title: '需要配置API',
        content: '请先配置百度OCR API Key（免费额度每天500次）',
        confirmText: '去配置',
        success: (res) => {
          if (res.confirm) {
            this.setData({ showApiConfig: true });
          }
        }
      });
      return;
    }

    this.setData({ isIdentifying: true });
    wx.showLoading({ title: '识别中...' });

    try {
      // 调用百度OCR
      const result = await this.callBaiduOCR(imagePath, apiKey, secretKey);

      // 提取药品名称
      const medicineName = extractMedicineName(result.text);

      this.setData({
        name: medicineName,
        isIdentifying: false
      });

      wx.hideLoading();
      wx.showToast({ title: '识别成功', icon: 'success' });

    } catch (error) {
      wx.hideLoading();
      this.setData({ isIdentifying: false });
      wx.showToast({ title: '识别失败: ' + error.message, icon: 'none' });
    }
  },

  // 调用百度OCR API
  callBaiduOCR(imagePath, apiKey, secretKey) {
    return new Promise((resolve, reject) => {
      // 先获取token
      wx.request({
        url: 'https://aip.baidubce.com/oauth/2.0/token',
        method: 'POST',
        header: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: secretKey
        },
        success: (res) => {
          console.log('Token响应:', res.data);
          if (res.data && res.data.access_token) {
            this.doOCR(imagePath, res.data.access_token, resolve, reject);
          } else if (res.data && res.data.error_description) {
            reject(new Error(res.data.error_description));
          } else {
            reject(new Error('获取Token失败: ' + JSON.stringify(res.data)));
          }
        },
        fail: (err) => {
          console.error('Token请求失败:', err);
          reject(new Error('API请求失败: ' + err.errMsg));
        }
      });
    });
  },

  doOCR(imagePath, token, resolve, reject) {
    const fs = wx.getFileSystemManager();
    // 使用正确的base64转换方式
    const fileData = fs.readFileSync(imagePath, 'base64');

    wx.request({
      url: `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
      method: 'POST',
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: { image: fileData },
      success: (res) => {
        console.log('OCR结果:', res.data);
        if (res.data.words_result && res.data.words_result.length > 0) {
          const words = res.data.words_result.map(item => item.words);
          resolve({ text: words.join(' ') });
        } else if (res.data.error_msg) {
          reject(new Error(res.data.error_msg));
        } else {
          reject(new Error('未识别到文字'));
        }
      },
      fail: (err) => {
        console.error('OCR请求失败:', err);
        reject(new Error('OCR请求失败'));
      }
    });
  },

  // 输入药品名称
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 选择有效期
  onExpiryDateChange(e) {
    this.setData({ expiryDate: e.detail.value });
  },

  // 输入描述
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 保存药品
  saveMedicine() {
    if (!this.data.name) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' });
      return;
    }

    const medicines = wx.getStorageSync('medicines') || [];
    const newMedicine = {
      id: Date.now(),
      name: this.data.name,
      expiryDate: this.data.expiryDate,
      description: this.data.description,
      photos: this.data.photos,
      createTime: new Date().toLocaleString()
    };

    medicines.push(newMedicine);
    wx.setStorageSync('medicines', medicines);

    wx.showToast({ title: '保存成功', icon: 'success' });

    setTimeout(() => wx.navigateBack(), 1500);
  },

  // 记录吃药
  recordTake() {
    if (!this.data.name) {
      wx.showToast({ title: '请先添加药品', icon: 'none' });
      return;
    }

    const records = wx.getStorageSync('records') || [];
    const newRecord = {
      id: Date.now(),
      medicineId: Date.now(),
      medicineName: this.data.name,
      takeTime: new Date().toLocaleString()
    };

    records.push(newRecord);
    wx.setStorageSync('records', records);

    wx.showToast({ title: '记录成功', icon: 'success' });
  },

  // 显示/隐藏API配置
  toggleApiConfig() {
    this.setData({ showApiConfig: !this.data.showApiConfig });
  }
})
