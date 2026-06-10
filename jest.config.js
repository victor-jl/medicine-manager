// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    '!utils/*.test.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
