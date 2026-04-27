'use strict';

describe('app factory', () => {
  const original = process.env.NODE_ENV;

  afterEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = original;
  });

  test('creates app in test mode (without morgan)', () => {
    process.env.NODE_ENV = 'test';
    const createApp = require('../../src/app');
    const app = createApp();
    expect(typeof app.use).toBe('function');
  });

  test('creates app in non-test mode (with morgan path)', () => {
    process.env.NODE_ENV = 'development';
    const createApp = require('../../src/app');
    const app = createApp();
    expect(typeof app.get).toBe('function');
  });
});
