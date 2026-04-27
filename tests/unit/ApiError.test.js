'use strict';

const ApiError = require('../../src/utils/ApiError');

describe('ApiError', () => {
  test('badRequest produces 400 with details', () => {
    const err = ApiError.badRequest('bad', [{ path: 'x', message: 'y' }]);
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad');
    expect(err.details).toEqual([{ path: 'x', message: 'y' }]);
    expect(err.isOperational).toBe(true);
  });

  test('unauthorized/forbidden/notFound/conflict use proper codes and defaults', () => {
    expect(ApiError.unauthorized().statusCode).toBe(401);
    expect(ApiError.forbidden().statusCode).toBe(403);
    expect(ApiError.notFound().statusCode).toBe(404);
    expect(ApiError.conflict().statusCode).toBe(409);
    expect(ApiError.unauthorized('x').message).toBe('x');
  });

  test('does not include details when not provided', () => {
    const err = new ApiError(500, 'oops');
    expect(err.details).toBeUndefined();
  });
});
