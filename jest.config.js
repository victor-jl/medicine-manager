module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/__mocks__/wx.js'],
  testPathIgnorePatterns: ['node_modules'],
  collectCoverage: true,
  coverageDirectory: 'coverage'
};