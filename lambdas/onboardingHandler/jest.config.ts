module.exports = {
  testEnvironment: 'node',
  preset: "ts-jest",
  roots: ['<rootDir>'],
  testMatch: ["**/*.test.ts", "**/*.steps.ts"],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testTimeout: 100000,
    testPathIgnorePatterns: ["<rootDir>/.aws-sam", "<rootDir>/node_modules/"],
    collectCoverage: true,
    coverageProvider: "babel",
};
