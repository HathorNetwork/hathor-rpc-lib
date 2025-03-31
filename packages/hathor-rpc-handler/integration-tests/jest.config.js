/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.', // Look for tests in the integration-tests directory
  roots: [
    '<rootDir>/__tests__', // Tests are now in __tests__ directory
    '<rootDir>/utils'      // Utility functions are in utils directory
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+.tsx?$': ['ts-jest', {
      // ts-jest configuration options
      tsconfig: '<rootDir>/tsconfig.json' // Use integration-tests tsconfig
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Specify global setup and teardown scripts
  globalSetup: '<rootDir>/jest.globalSetup.ts',
  globalTeardown: '<rootDir>/jest.globalTeardown.ts',
  // Run tests sequentially because they share the Docker environment
  maxWorkers: 1,
  // Set a longer timeout for integration tests and hooks
  testTimeout: 90000, // 90 seconds
}; 