'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { startTestDb, stopTestDb, clearDb } = require('../setup');
const { seedRoles, makeUser, tokenFor, authHeader } = require('../helpers');
const User = require('../../src/models/User');
const Role = require('../../src/models/Role');

let app;
beforeAll(async () => { await startTestDb(); app = createApp(); });
afterAll(async () => { await stopTestDb(); });
beforeEach(async () => { await clearDb(); await seedRoles(); });

async function adminToken() {
  const { user } = await makeUser({ username: 'admin', roleName: 'Administrator' });
  return tokenFor(user, 'Administrator');
}

describe('Users routes', () => {
  test('admin creates a user with a specific role', async () => {
    const token = await adminToken();
    const res = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({ username: 'newop', email: 'op@example.com', password: 'Password@123', roleName: 'Operator' });
    expect(res.status).toBe(201);
    expect(res.body.roleName).toBe('Operator');
  });

  test('default role is Access User when roleName omitted', async () => {
    const token = await adminToken();
    const res = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({ username: 'newuser', email: 'newuser@example.com', password: 'Password@123' });
    expect(res.status).toBe(201);
    expect(res.body.roleName).toBe('Access User');
  });

  test('user creation fails if role does not exist', async () => {
    const token = await adminToken();
    await Role.deleteOne({ roleName: 'Operator' });
    const before = await User.countDocuments();
    const res = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({ username: 'opx', email: 'opx@example.com', password: 'Password@123', roleName: 'Operator' });
    expect(res.status).toBe(400);
    const after = await User.countDocuments();
    expect(after).toBe(before); // user was NOT persisted
  });

  test('duplicate username returns 409', async () => {
    const token = await adminToken();
    await makeUser({ username: 'dup', roleName: 'Operator' });
    const res = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({ username: 'dup', email: 'd@example.com', password: 'Password@123' });
    expect(res.status).toBe(409);
  });

  test('non-admin cannot list users', async () => {
    const { user } = await makeUser({ username: 'oper1', roleName: 'Operator' });
    const token = tokenFor(user, 'Operator');
    const res = await request(app).get('/api/users').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  test('admin can list and fetch users', async () => {
    const token = await adminToken();
    const list = await request(app).get('/api/users').set(authHeader(token));
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);

    const userId = list.body[0].userId;
    const one = await request(app).get(`/api/users/${userId}`).set(authHeader(token));
    expect(one.status).toBe(200);
    expect(one.body.username).toBeDefined();
  });

  test('GET /api/users/:id 404 for unknown id', async () => {
    const token = await adminToken();
    const res = await request(app)
      .get('/api/users/507f1f77bcf86cd799439011')
      .set(authHeader(token));
    expect(res.status).toBe(404);
  });

  test('invalid Bearer token rejected by requireAuth', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
});
