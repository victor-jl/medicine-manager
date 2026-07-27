module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js'],
  verbose: true,
  collectCoverageFrom: [
    'utils/**/*.js',
    '!**/node_modules/**'
  ]
};
