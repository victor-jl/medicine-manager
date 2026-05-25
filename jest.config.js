module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'pages/**/*.js',
    '!pages/**/*.wxml',
    '!pages/**/*.wxss'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleFileExtensions: ['js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/']
};
