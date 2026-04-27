'use strict';

const jwt = require('jsonwebtoken');
const { signToken, verifyToken, requireAuth, requireRole } = require('../../src/middleware/auth');

describe('auth middleware', () => {
  test('signToken/verifyToken round-trip', () => {
    const token = signToken({ userId: 'u1', username: 'a', roleName: 'Operator' });
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.username).toBe('a');
    expect(decoded.roleName).toBe('Operator');
  });

  test('requireAuth rejects missing header', () => {
    const req = { headers: {} };
    const next = jest.fn();
    requireAuth(req, {}, next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  test('requireAuth rejects malformed scheme', () => {
    const req = { headers: { authorization: 'Token abc' } };
    const next = jest.fn();
    requireAuth(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  test('requireAuth rejects invalid token', () => {
    const req = { headers: { authorization: 'Bearer not-a-token' } };
    const next = jest.fn();
    requireAuth(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toMatch(/invalid/i);
  });

  test('requireAuth rejects expired token', () => {
    const expired = jwt.sign({ userId: 'u1', roleName: 'Administrator' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const next = jest.fn();
    requireAuth(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toMatch(/expired/i);
  });

  test('requireAuth attaches user on valid token', () => {
    const token = signToken({ userId: 'u1', username: 'a', roleName: 'Administrator' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    requireAuth(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ userId: 'u1', username: 'a', roleName: 'Administrator' });
  });

  test('requireRole rejects when not authenticated', () => {
    const next = jest.fn();
    requireRole('Administrator')({}, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  test('requireRole rejects when role not allowed', () => {
    const next = jest.fn();
    requireRole('Administrator')({ user: { roleName: 'Operator' } }, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  test('requireRole passes when role matches', () => {
    const next = jest.fn();
    requireRole('Administrator', 'Operator')({ user: { roleName: 'Operator' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
