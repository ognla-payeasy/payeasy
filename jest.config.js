// jest.config.js
const nextJest = require('next/jest')

// Provide the path to your Next.js app to load next.config.js and .env files
const createJestConfig = nextJest({
  dir: './',
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // If you use aliases like "@/components", you need to map them here
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Use jsdom for React component testing
  testEnvironment: 'jest-environment-jsdom',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)