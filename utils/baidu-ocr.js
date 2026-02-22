// utils/baidu-ocr.js
// 百度文字识别 API

const API_KEY = 'YOUR_BAIDU_API_KEY';      // 替换为你的 API Key
const SECRET_KEY = 'YOUR_BAIDU_SECRET_KEY'; // 替换为你的 Secret Key

/**
 * 获取百度OCR访问令牌
 */
async function getAccessToken() {
  const cacheKey = 'baidu_access_token';
  const cacheTimeKey = 'baidu_token_expires';

  // 检查缓存
  const cachedToken = wx.getStorageSync(cacheKey);
  const expiresTime = wx.getStorageSync(cacheTimeKey);

  if (cachedToken && expiresTime && Date.now() < expiresTime) {
    return cachedToken;
  }

  // 获取新token
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token',
      method: 'POST',
      data: {
        grant_type: 'client_credentials',
        client_id: API_KEY,
        client_secret: SECRET_KEY
      },
      success: (res) => {
        if (res.data && res.data.access_token) {
          // 缓存25天（token有效期30天）
          wx.setStorageSync(cacheKey, res.data.access_token);
          wx.setStorageSync(cacheTimeKey, Date.now() + 25 * 24 * 60 * 60 * 1000);
          resolve(res.data.access_token);
        } else {
          reject(new Error('获取token失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

/**
 * 调用百度通用文字识别API
 * @param {string} imagePath - 图片路径（base64或url）
 */
async function recognizeText(imagePath) {
  try {
    const accessToken = await getAccessToken();

    // 读取图片并转为base64
    const fs = wx.getFileSystemManager();
    const base64 = fs.readFileSync(imagePath, 'base64');

    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          image: base64
        },
        success: (res) => {
          if (res.data && res.data.words_result) {
            // 提取所有识别的文字
            const words = res.data.words_result.map(item => item.words);
            resolve({
              success: true,
              words: words,
              text: words.join(' ')
            });
          } else if (res.data && res.data.error_code) {
            reject(new Error(`OCR识别失败: ${res.data.error_msg}`));
          } else {
            reject(new Error('OCR识别失败，未返回有效数据'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error('百度OCR错误:', error);
    throw error;
  }
}

/**
 * 从识别结果中提取药品名称
 * 简单的关键词匹配
 */
function extractMedicineName(recognizedText) {
  if (!recognizedText) return '';

  const text = recognizedText.toLowerCase();

  // 常见药品关键词
  const medicineKeywords = [
    '胶囊', '片', '颗粒', '口服液', '注射液', '软膏', '贴剂',
    '阿莫西林', '布洛芬', '对乙酰氨基酚', '头孢', '阿奇霉素',
    '感冒灵', '退烧', '消炎', '维生素', '钙片', '胃药',
    '血压', '血糖', '血脂', '感冒', '咳嗽', '腹泻'
  ];

  // 查找包含关键词的文本
  for (const keyword of medicineKeywords) {
    if (text.includes(keyword)) {
      // 尝试找到包含关键词的完整词组
      const index = text.indexOf(keyword);
      const start = Math.max(0, index - 5);
      const end = Math.min(text.length, index + keyword.length + 10);
      return recognizedText.substring(start, end).trim();
    }
  }

  // 如果没有匹配关键词，返回第一行（通常是名称）
  const lines = recognizedText.split(/[\n\r]/).filter(line => line.trim());
  return lines.length > 0 ? lines[0] : recognizedText.substring(0, 20);
}

module.exports = {
  recognizeText,
  extractMedicineName,
  getAccessToken
};
