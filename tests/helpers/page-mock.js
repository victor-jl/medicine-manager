// tests/helpers/page-mock.js
// Captures Page({...}) definitions so tests can drive page lifecycle methods
// against a bound `this` context with a real setData implementation.

function installPage() {
  const captured = [];
  globalThis.Page = (config) => {
    captured.push(config);
  };
  // App() is also used by app.js; we capture its onLaunch the same way.
  globalThis.App = (config) => {
    captured.push(config);
  };
  return captured;
}

function getPage(captured, index = 0) {
  return captured[index];
}

function makeContext(initialData = {}) {
  return {
    data: { ...initialData },
    setData(partial) {
      Object.assign(this.data, partial);
    }
  };
}

module.exports = { installPage, getPage, makeContext };
