module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.@(ts|tsx)', '**/?(*.)+(spec|test).@(ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\\.(ts|tsx)$': 'babel-jest',
    '^.+\\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: ['node_modules/(?!(react-native|@react-native|@expo|expo(-.*)?)/)'],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^react-native$': 'react-native',
    '^expo-linear-gradient$': '<rootDir>/__mocks__/expo-linear-gradient.js'
  }
};
