'use strict';

const generateUniqueId = require('../../src/utils/generateUniqueId');

describe('generateUniqueId', () => {
  test('returns a 12-digit numeric string', () => {
    const id = generateUniqueId();
    expect(id).toMatch(/^[0-9]{12}$/);
  });

  test('does not start with 0', () => {
    for (let i = 0; i < 50; i += 1) {
      const id = generateUniqueId();
      expect(id[0]).not.toBe('0');
    }
  });

  test('produces unique values across many calls', () => {
    const seen = new Set();
    for (let i = 0; i < 200; i += 1) {
      seen.add(generateUniqueId());
    }
    // overwhelmingly likely to be 200 distinct values
    expect(seen.size).toBeGreaterThan(195);
  });
});
