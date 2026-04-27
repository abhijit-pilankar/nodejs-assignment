'use strict';

const { notFoundHandler, errorHandler } = require('../../src/middleware/errorHandler');
const ApiError = require('../../src/utils/ApiError');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
  });

  test('notFoundHandler forwards a 404 error', () => {
    const req = { method: 'GET', originalUrl: '/missing' };
    const next = jest.fn();
    notFoundHandler(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  test('uses default 500 for non-ApiError', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.message).toBe('boom');
  });

  test('returns ApiError statusCode and details', () => {
    const res = mockRes();
    const err = ApiError.badRequest('bad', [{ path: 'x', message: 'y' }]);
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.details).toBeDefined();
  });

  test('maps Mongoose ValidationError to 400', () => {
    const res = mockRes();
    const err = new Error('validation');
    err.name = 'ValidationError';
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('maps CastError to 400 with friendly message', () => {
    const res = mockRes();
    const err = new Error('cast');
    err.name = 'CastError';
    err.path = 'id';
    err.value = 'abc';
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.message).toMatch(/Invalid id/);
  });

  test('maps duplicate key error to 409', () => {
    const res = mockRes();
    const err = new Error('dup');
    err.code = 11000;
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('includes stack in development', () => {
    process.env.NODE_ENV = 'development';
    const res = mockRes();
    errorHandler(new Error('boom'), {}, res, jest.fn());
    expect(res.json.mock.calls[0][0].error.stack).toBeDefined();
    process.env.NODE_ENV = 'test';
  });
});
