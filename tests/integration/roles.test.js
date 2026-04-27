'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { startTestDb, stopTestDb, clearDb } = require('../setup');
const { seedRoles, makeUser, tokenFor, authHeader } = require('../helpers');
const Role = require('../../src/models/Role');

let app;

beforeAll(async () => { await startTestDb(); app = createApp(); });
afterAll(async () => { await stopTestDb(); });
beforeEach(async () => { await clearDb(); await seedRoles(); });

describe('Roles routes', () => {
  test('GET /api/roles requires auth', async () => {
    const res = await request(app).get('/api/roles');
    expect(res.status).toBe(401);
  });

  test('non-admin gets 403', async () => {
    const { user } = await makeUser({ username: 'oper1', roleName: 'Operator' });
    const token = tokenFor(user, 'Operator');
    const res = await request(app).get('/api/roles').set(authHeader(token));
    expect(res.status).toBe(403);
  });

  test('admin can list roles', async () => {
    const { user } = await makeUser({ username: 'admin', roleName: 'Administrator' });
    const token = tokenFor(user, 'Administrator');
    const res = await request(app).get('/api/roles').set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  test('admin creating an existing role returns 409', async () => {
    const { user } = await makeUser({ username: 'admin', roleName: 'Administrator' });
    const token = tokenFor(user, 'Administrator');
    const res = await request(app)
      .post('/api/roles')
      .set(authHeader(token))
      .send({ roleName: 'Administrator' });
    expect(res.status).toBe(409);
  });

  test('admin creates a new role after deleting one', async () => {
    await Role.deleteOne({ roleName: 'Operator' });
    const { user } = await makeUser({ username: 'admin', roleName: 'Administrator' });
    const token = tokenFor(user, 'Administrator');
    const res = await request(app)
      .post('/api/roles')
      .set(authHeader(token))
      .send({ roleName: 'Operator', description: 'Recreated' });
    expect(res.status).toBe(201);
    expect(res.body.roleName).toBe('Operator');
  });

  test('invalid roleName returns 400', async () => {
    const { user } = await makeUser({ username: 'admin', roleName: 'Administrator' });
    const token = tokenFor(user, 'Administrator');
    const res = await request(app)
      .post('/api/roles')
      .set(authHeader(token))
      .send({ roleName: 'God' });
    expect(res.status).toBe(400);
  });
});
