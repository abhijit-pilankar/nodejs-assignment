'use strict';

const db = require('../../src/config/db');

describe('config/db', () => {
  test('exports connect, disconnect, mongoose', () => {
    expect(typeof db.connect).toBe('function');
    expect(typeof db.disconnect).toBe('function');
    expect(db.mongoose).toBeDefined();
  });

  test('connect rejects when no URI is provided', async () => {
    await expect(db.connect('')).rejects.toThrow(/MongoDB URI/);
  });
});
