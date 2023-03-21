module.exports = {
  preset: 'ts-jest',

  testEnvironment: 'jsdom',

  // Test files are .js, .jsx, .ts and .tsx files inside of __tests__ folders and with a suffix of .test or .spec
  testMatch: [ "**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)" ],

  // Included files for test coverage (npm run test:coverage)
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/__tests__/**",
  ]
};
