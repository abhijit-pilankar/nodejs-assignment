'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { startTestDb, stopTestDb, clearDb } = require('../setup');
const { seedRoles, makeUser } = require('../helpers');
const LoginStatus = require('../../src/models/LoginStatus');

let app;

beforeAll(async () => {
  await startTestDb();
  app = createApp();
});
afterAll(async () => { await stopTestDb(); });
beforeEach(async () => { await clearDb(); await seedRoles(); });

describe('POST /api/auth/register', () => {
  test('creates an Access User by default and ignores roleName', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user1', email: 'u1@example.com', password: 'Password@123', roleName: 'Administrator' });
    expect(res.status).toBe(201);
    expect(res.body.user.roleName).toBe('Access User');
  });

  test('returns 400 on invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'a', email: 'not-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test('returns 409 on duplicate username', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'dup', email: 'a@example.com', password: 'Password@123'
    });
    const res = await request(app).post('/api/auth/register').send({
      username: 'dup', email: 'b@example.com', password: 'Password@123'
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  test('returns a JWT and writes a successful LoginStatus', async () => {
    await makeUser({ username: 'oper1', roleName: 'Operator' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'oper1', password: 'Password@123', loginForm: 'web' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.user.roleName).toBe('Operator');
    const status = await LoginStatus.findOne({ username: 'oper1' });
    expect(status.success).toBe(true);
    expect(status.loginForm).toBe('web');
  });

  test('returns 401 on bad password and writes failed LoginStatus', async () => {
    await makeUser({ username: 'oper1', roleName: 'Operator' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'oper1', password: 'wrong' });
    expect(res.status).toBe(401);
    const status = await LoginStatus.findOne({ username: 'oper1' });
    expect(status.success).toBe(false);
  });

  test('returns 401 for unknown user (still logs)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'Password@123' });
    expect(res.status).toBe(401);
    const status = await LoginStatus.findOne({ username: 'ghost' });
    expect(status.success).toBe(false);
  });

  test('returns 400 on missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/refresh', () => {
  test('rotates refresh token and returns a new access token', async () => {
    await makeUser({ username: 'oper1', roleName: 'Operator' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'oper1', password: 'Password@123', loginForm: 'web' });
    expect(loginRes.status).toBe(200);

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginRes.body.refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(typeof refreshRes.body.token).toBe('string');
    expect(typeof refreshRes.body.refreshToken).toBe('string');
    expect(refreshRes.body.refreshToken).not.toBe(loginRes.body.refreshToken);
  });

  test('rejects invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'not-a-token' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  test('revokes refresh token (204) and prevents reuse', async () => {
    await makeUser({ username: 'oper1', roleName: 'Operator' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'oper1', password: 'Password@123', loginForm: 'web' });
    expect(loginRes.status).toBe(200);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: loginRes.body.refreshToken });
    expect(logoutRes.status).toBe(204);

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: loginRes.body.refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});
