// utils/ocr.js
// 多种OCR识别方案

/**
 * 方案1: 微信小程序自带文字识别（免费）
 * 推荐使用，无API费用
 */
async function recognizeWithWechat(imagePath) {
  return new Promise((resolve, reject) => {
    wx.cloud.init();

    // 使用微信小程序ocr识别（需要开通云开发）
    wx.cloud.callFunction({
      name: 'ocr',
      data: {
        type: 'photo',
        imgUrl: imagePath
      },
      success: (res) => {
        if (res.result && res.result.text) {
          resolve({
            success: true,
            words: res.result.text.split('\n').filter(t => t.trim()),
            text: res.result.text
          });
        } else {
          reject(new Error('识别失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 方案2: 百度文字识别（免费额度）
 * 每天500次调用
 */
const BAIDU_API_KEY = '';      // 百度API Key
const BAIDU_SECRET_KEY = '';    // 百度Secret Key

async function getBaiduToken() {
  const cacheKey = 'baidu_token';
  const cached = wx.getStorageSync(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.access_token;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token',
      method: 'POST',
      data: {
        grant_type: 'client_credentials',
        client_id: BAIDU_API_KEY,
        client_secret: BAIDU_SECRET_KEY
      },
      success: (res) => {
        if (res.data.access_token) {
          const tokenData = {
            access_token: res.data.access_token,
            expires: Date.now() + 25 * 24 * 60 * 60 * 1000
          };
          wx.setStorageSync(cacheKey, tokenData);
          resolve(res.data.access_token);
        }
      },
      fail: reject
    });
  });
}

async function recognizeWithBaidu(imagePath) {
  try {
    const token = await getBaiduToken();
    const fs = wx.getFileSystemManager();
    const base64 = fs.readFileSync(imagePath, 'base64');

    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
        method: 'POST',
        header: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: { image: base64 },
        success: (res) => {
          if (res.data.words_result) {
            const words = res.data.words_result.map(w => w.words);
            resolve({ success: true, words, text: words.join(' ') });
          } else {
            reject(new Error('识别失败'));
          }
        },
        fail: reject
      });
    });
  } catch (e) {
    throw e;
  }
}

/**
 * 方案3: 拍照后手动输入（完全免费）
 * 如果不想配置API，可以使用这个
 */

// 从识别文本中提取药品名称
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

  // 返回第一行作为默认
  return text.split('\n')[0].trim().substring(0, 30);
}

module.exports = {
  recognizeWithWechat,
  recognizeWithBaidu,
  extractMedicineName
};
