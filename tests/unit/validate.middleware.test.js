'use strict';

const Joi = require('joi');
const validate = require('../../src/middleware/validate');

describe('validate middleware', () => {
  const schema = Joi.object({
    name: Joi.string().required(),
    age: Joi.number().integer().min(0).required()
  });

  test('passes through and strips unknown keys when valid', () => {
    const req = { body: { name: 'a', age: 30, extra: 'x' } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'a', age: 30 });
  });

  test('returns 400 with details when invalid', () => {
    const req = { body: { name: '', age: -1 } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(Array.isArray(err.details)).toBe(true);
    expect(err.details.length).toBeGreaterThan(0);
  });

  test('passes through when no schema provided', () => {
    const req = { body: { x: 1 } };
    const next = jest.fn();
    validate(null)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('reads alternate sources like query', () => {
    const querySchema = Joi.object({ limit: Joi.number() });
    const req = { query: { limit: '10' } };
    const next = jest.fn();
    validate(querySchema, 'query')(req, {}, next);
    expect(req.query).toEqual({ limit: 10 });
  });
});
