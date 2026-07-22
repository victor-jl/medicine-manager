// tests/helpers/load-page.js
// Captures a WeChat Page() definition so tests can invoke lifecycle methods.

function capturePage(modulePath) {
  let captured = null;
  global.Page = (options) => {
    captured = options;
    return options;
  };
  // require()ing the module triggers Page({...}) at the top level
  require(modulePath);
  return captured;
}

function captureApp(modulePath) {
  let captured = null;
  global.App = (options) => {
    captured = options;
    return options;
  };
  require(modulePath);
  return captured;
}

// Make a fake "this" context that wires setData and the data object,
// matching what the WeChat runtime provides to a Page instance.
// All function properties from pageOptions are bound to the context so
// that `this.loadData()` etc. work just like in the real runtime.
function makePageContext(pageOptions, initialData = {}) {
  const data = { ...initialData };
  const ctx = {
    data,
    setData(patch) {
      Object.assign(data, patch);
    }
  };
  // Bind all methods from the Page definition so `this.otherMethod()` works.
  for (const key of Object.keys(pageOptions)) {
    if (typeof pageOptions[key] === 'function' && !(key in ctx)) {
      ctx[key] = pageOptions[key].bind(ctx);
    }
  }
  return ctx;
}

module.exports = { capturePage, captureApp, makePageContext };
