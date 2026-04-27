'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { startTestDb, stopTestDb, clearDb } = require('../setup');
const {
  seedRoles,
  makeUser,
  tokenFor,
  authHeader,
  makePerson
} = require('../helpers');

let app;

beforeAll(async () => { await startTestDb(); app = createApp(); });
afterAll(async () => { await stopTestDb(); });
beforeEach(async () => { await clearDb(); await seedRoles(); });

describe('GET /api/persons/search', () => {
  let opToken;
  let auUser;
  let auToken;

  beforeEach(async () => {
    const { user: opUser } = await makeUser({ username: 'oper1', roleName: 'Operator' });
    opToken = tokenFor(opUser, 'Operator');
    const { user } = await makeUser({ username: 'accessuser', roleName: 'Access User' });
    auUser = user;
    auToken = tokenFor(auUser, 'Access User');

    await makePerson({
      personalUniqueId: '111111111111',
      firstName: 'Asha',
      lastName: 'Kulkarni',
      city: 'Pune',
      age: 35,
      gender: 'Female'
    });
    await makePerson({
      personalUniqueId: '222222222222',
      firstName: 'Bhavin',
      lastName: 'Mehta',
      city: 'Mumbai',
      age: 50,
      gender: 'Male'
    });
    await makePerson({
      personalUniqueId: '333333333333',
      firstName: 'Carol',
      lastName: 'D\'Souza',
      city: 'Pune',
      age: 22,
      gender: 'Female',
      ownerUserId: auUser._id
    });
  });

  test('Operator can search by City', async () => {
    const res = await request(app)
      .get('/api/persons/search?City=Pune')
      .set(authHeader(opToken));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  test('Operator can search by PersonName regex', async () => {
    const res = await request(app)
      .get('/api/persons/search?PersonName=asha')
      .set(authHeader(opToken));
    expect(res.body.total).toBe(1);
    expect(res.body.results[0].firstName).toBe('Asha');
  });

  test('Operator can search by Age range', async () => {
    const res = await request(app)
      .get('/api/persons/search?AgeGt=30&AgeLt=60')
      .set(authHeader(opToken));
    expect(res.body.total).toBe(2);
  });

  test('Operator gets no results when criteria do not match', async () => {
    const res = await request(app)
      .get('/api/persons/search?City=Delhi')
      .set(authHeader(opToken));
    expect(res.body.total).toBe(0);
  });

  test('Access User search is scoped to own record only', async () => {
    const res = await request(app)
      .get('/api/persons/search?City=Pune')
      .set(authHeader(auToken));
    expect(res.body.total).toBe(1);
    expect(res.body.results[0].firstName).toBe('Carol');
  });

  test('pagination with limit and skip', async () => {
    const res = await request(app)
      .get('/api/persons/search?limit=1&skip=1')
      .set(authHeader(opToken));
    expect(res.body.limit).toBe(1);
    expect(res.body.skip).toBe(1);
    expect(res.body.results.length).toBe(1);
    expect(res.body.total).toBe(3);
  });

  test('combined criteria: Gender=Female & City=Pune', async () => {
    const res = await request(app)
      .get('/api/persons/search?Gender=Female&City=Pune')
      .set(authHeader(opToken));
    expect(res.body.total).toBe(2);
  });

  test('search requires authentication', async () => {
    const res = await request(app).get('/api/persons/search?City=Pune');
    expect(res.status).toBe(401);
  });
});
