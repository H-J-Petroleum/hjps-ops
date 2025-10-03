/**
 * Jest configuration for H&J Petroleum Ops platform
 */
module.exports = {
  verbose: true,
  testEnvironment: 'node',
  rootDir: '../..',
  testMatch: [
    '<rootDir>/packages/**/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/approval-api/src/tests/'
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'packages/**/src/**/*.js',
    '!**/node_modules/**'
  ]
};
