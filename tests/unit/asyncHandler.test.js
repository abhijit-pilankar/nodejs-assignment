'use strict';

const asyncHandler = require('../../src/utils/asyncHandler');

describe('asyncHandler', () => {
  test('passes resolved value through (no error)', async () => {
    const next = jest.fn();
    const handler = asyncHandler(async (req, res) => {
      res.send('ok');
    });
    const res = { send: jest.fn() };
    await handler({}, res, next);
    expect(res.send).toHaveBeenCalledWith('ok');
    expect(next).not.toHaveBeenCalled();
  });

  test('forwards rejected errors to next', async () => {
    const next = jest.fn();
    const boom = new Error('boom');
    const handler = asyncHandler(async () => { throw boom; });
    await handler({}, {}, next);
    expect(next).toHaveBeenCalledWith(boom);
  });
});
