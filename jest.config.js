module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'pages/**/*.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
