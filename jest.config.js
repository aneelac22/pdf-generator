const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  displayName: 'unit-test',
  bail: 0,
  testTimeout: 30000,
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    ...tsjPreset.transform,
  },
  testMatch: ['./**/*.spec.ts'],
};
