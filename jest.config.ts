import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@app$': '<rootDir>/src/app/index.ts',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@core$': '<rootDir>/src/core/index.ts',
    '^@game/(.*)$': '<rootDir>/src/game/$1',
    '^@game$': '<rootDir>/src/game/index.ts',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@shared$': '<rootDir>/src/shared/index.ts',
  },
  globals: {
    __DEV__: true,   // テスト時は true
    __PROD__: false,
  },
};

export default config;
