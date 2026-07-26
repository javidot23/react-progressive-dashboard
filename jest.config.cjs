module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test/styleMock.cjs',
  },
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
}
