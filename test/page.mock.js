// test/page.mock.js
// 微信小程序 Page 函数 Mock

const pageInstances = [];

// Mock Page 函数
function Page(options) {
  // 创建页面实例，包含 data 和所有方法
  const pageInstance = {
    data: { ...options.data } || {}
  };

  // 复制所有方法，并绑定正确的 this
  for (const key in options) {
    if (key !== 'data') {
      if (typeof options[key] === 'function') {
        // 绑定方法到 pageInstance，确保 this 正确
        pageInstance[key] = options[key].bind(pageInstance);
      } else {
        // 复制其他属性
        pageInstance[key] = options[key];
      }
    }
  }

  // 添加 setData 方法（如果 options 中没有定义）
  if (!pageInstance.setData) {
    pageInstance.setData = function(newData) {
      Object.assign(this.data, newData);
    }.bind(pageInstance);
  }

  pageInstances.push(pageInstance);
  return pageInstance;
}

// 获取最后一个创建的页面实例
function getLastPage() {
  return pageInstances[pageInstances.length - 1];
}

// 清理页面实例
function clearPages() {
  pageInstances.length = 0;
}

module.exports = {
  Page,
  getLastPage,
  clearPages
};