'use strict';

describe('config/env', () => {
  test('loads sane defaults under test', () => {
    jest.resetModules();
    const env = require('../../src/config/env');
    expect(env.nodeEnv).toBe('test');
    expect(env.jwtSecret).toBeDefined();
    expect(env.jwtExpiresIn).toBeDefined();
    expect(env.admin).toEqual(
      expect.objectContaining({ username: expect.any(String), email: expect.any(String) })
    );
  });

  test('throws when MONGODB_URI is missing in non-test mode', () => {
    jest.isolateModules(() => {
      jest.doMock('dotenv', () => ({ config: () => ({ parsed: {} }) }));
      const original = process.env.NODE_ENV;
      const originalUri = process.env.MONGODB_URI;
      process.env.NODE_ENV = 'production';
      delete process.env.MONGODB_URI;
      try {
        expect(() => require('../../src/config/env')).toThrow(/MONGODB_URI/);
      } finally {
        process.env.NODE_ENV = original;
        if (originalUri !== undefined) process.env.MONGODB_URI = originalUri;
      }
    });
  });
});
