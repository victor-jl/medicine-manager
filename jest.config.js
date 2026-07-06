module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  coveragePathIgnorePatterns: ['node_modules', 'jest.setup.js']
};