'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { startTestDb, stopTestDb, clearDb } = require('../setup');
const {
  seedRoles,
  makeUser,
  tokenFor,
  authHeader,
  samplePersonPayload,
  makePerson
} = require('../helpers');
const ChangeRequest = require('../../src/models/ChangeRequest');
const Person = require('../../src/models/Person');

let app;

beforeAll(async () => { await startTestDb(); app = createApp(); });
afterAll(async () => { await stopTestDb(); });
beforeEach(async () => { await clearDb(); await seedRoles(); });

async function makeTokenFor(roleName, username = roleName.toLowerCase().replace(/\s+/g, '')) {
  const { user } = await makeUser({ username, roleName });
  return { user, token: tokenFor(user, roleName) };
}

describe('Person create/update via change_requests', () => {
  test('Operator can submit create -> change_request status pending', async () => {
    const { token } = await makeTokenFor('Operator');
    const res = await request(app)
      .post('/api/persons')
      .set(authHeader(token))
      .send(samplePersonPayload());
    expect(res.status).toBe(202);
    expect(res.body.status).toBe('pending');
    const cr = await ChangeRequest.findById(res.body.changeRequestId);
    expect(cr.action).toBe('create');
  });

  test('Access User cannot create persons (403)', async () => {
    const { token } = await makeTokenFor('Access User', 'accessuser1');
    const res = await request(app)
      .post('/api/persons')
      .set(authHeader(token))
      .send(samplePersonPayload());
    expect(res.status).toBe(403);
  });

  test('POST /api/persons rejects invalid payload (400)', async () => {
    const { token } = await makeTokenFor('Operator');
    const res = await request(app)
      .post('/api/persons')
      .set(authHeader(token))
      .send({ firstName: 'a' });
    expect(res.status).toBe(400);
  });

  test('Admin approves create -> Person inserted with personalUniqueId', async () => {
    const { token: opToken } = await makeTokenFor('Operator');
    const { token: adminToken } = await makeTokenFor('Administrator', 'admin');
    const submit = await request(app)
      .post('/api/persons')
      .set(authHeader(opToken))
      .send(samplePersonPayload());

    const approve = await request(app)
      .post(`/api/change-requests/${submit.body.changeRequestId}/approve`)
      .set(authHeader(adminToken));
    expect(approve.status).toBe(200);
    expect(approve.body.changeRequest.status).toBe('approved');
    expect(approve.body.person.personalUniqueId).toMatch(/^[0-9]{12}$/);

    const person = await Person.findById(approve.body.person.personId);
    expect(person).not.toBeNull();
  });

  test('Admin rejects -> no Person created and request status=rejected', async () => {
    const { token: opToken } = await makeTokenFor('Operator');
    const { token: adminToken } = await makeTokenFor('Administrator', 'admin');
    const submit = await request(app)
      .post('/api/persons')
      .set(authHeader(opToken))
      .send(samplePersonPayload());

    const reject = await request(app)
      .post(`/api/change-requests/${submit.body.changeRequestId}/reject`)
      .set(authHeader(adminToken))
      .send({ reason: 'incomplete' });
    expect(reject.status).toBe(200);
    expect(reject.body.status).toBe('rejected');
    expect(reject.body.reason).toBe('incomplete');
    expect(await Person.countDocuments()).toBe(0);
  });

  test('Cannot approve already-rejected change request', async () => {
    const { token: opToken } = await makeTokenFor('Operator');
    const { token: adminToken } = await makeTokenFor('Administrator', 'admin');
    const submit = await request(app)
      .post('/api/persons')
      .set(authHeader(opToken))
      .send(samplePersonPayload());
    await request(app)
      .post(`/api/change-requests/${submit.body.changeRequestId}/reject`)
      .set(authHeader(adminToken))
      .send({});
    const second = await request(app)
      .post(`/api/change-requests/${submit.body.changeRequestId}/approve`)
      .set(authHeader(adminToken));
    expect(second.status).toBe(400);
  });

  test('approve unknown id -> 404', async () => {
    const { token: adminToken } = await makeTokenFor('Administrator', 'admin');
    const res = await request(app)
      .post('/api/change-requests/507f1f77bcf86cd799439011/approve')
      .set(authHeader(adminToken));
    expect(res.status).toBe(404);
  });

  test('reject unknown id -> 404', async () => {
    const { token: adminToken } = await makeTokenFor('Administrator', 'admin');
    const res = await request(app)
      .post('/api/change-requests/507f1f77bcf86cd799439011/reject')
      .set(authHeader(adminToken))
      .send({});
    expect(res.status).toBe(404);
  });

  test('non-admin cannot approve', async () => {
    const { token: opToken } = await makeTokenFor('Operator');
    const submit = await request(app)
      .post('/api/persons')
      .set(authHeader(opToken))
      .send(samplePersonPayload());
    const res = await request(app)
      .post(`/api/change-requests/${submit.body.changeRequestId}/approve`)
      .set(authHeader(opToken));
    expect(res.status).toBe(403);
  });

  test('Admin updates person via approval workflow', async () => {
    const { token: adminToken } = await makeTokenFor('Administrator', 'admin');
    const person = await makePerson();
    const submit = await request(app)
      .put(`/api/persons/${person._id}`)
      .set(authHeader(adminToken))
      .send({ city: 'Mumbai' });
    expect(submit.status).toBe(202);

    const approve = await request(app)
      .post(`/api/change-requests/${submit.body.changeRequestId}/approve`)
      .set(authHeader(adminToken));
    expect(approve.status).toBe(200);

    const reloaded = await Person.findById(person._id);
    expect(reloaded.city).toBe('Mumbai');
  });

  test('PUT 404 if person does not exist', async () => {
    const { token: opToken } = await makeTokenFor('Operator');
    const res = await request(app)
      .put('/api/persons/507f1f77bcf86cd799439011')
      .set(authHeader(opToken))
      .send({ city: 'X' });
    expect(res.status).toBe(404);
  });

  test('PUT validation: empty body rejected (min 1 key)', async () => {
    const { token: opToken } = await makeTokenFor('Operator');
    const person = await makePerson();
    const res = await request(app)
      .put(`/api/persons/${person._id}`)
      .set(authHeader(opToken))
      .send({});
    expect(res.status).toBe(400);
  });

  test('Access User can only update their own record', async () => {
    const { user: au, token: auToken } = await makeTokenFor('Access User', 'accessuser2');
    const ownPerson = await makePerson({
      personalUniqueId: '999988887777',
      ownerUserId: au._id
    });
    const otherPerson = await makePerson({ personalUniqueId: '111122223333' });

    const ok = await request(app)
      .put(`/api/persons/${ownPerson._id}`)
      .set(authHeader(auToken))
      .send({ city: 'Nashik' });
    expect(ok.status).toBe(202);

    const denied = await request(app)
      .put(`/api/persons/${otherPerson._id}`)
      .set(authHeader(auToken))
      .send({ city: 'Anywhere' });
    expect(denied.status).toBe(403);
  });

  test('Approving update for deleted person rejects request and 404s', async () => {
    const { token: adminToken } = await makeTokenFor('Administrator', 'admin');
    const person = await makePerson();
    const submit = await request(app)
      .put(`/api/persons/${person._id}`)
      .set(authHeader(adminToken))
      .send({ city: 'Bangalore' });
    await Person.deleteOne({ _id: person._id });
    const approve = await request(app)
      .post(`/api/change-requests/${submit.body.changeRequestId}/approve`)
      .set(authHeader(adminToken));
    expect(approve.status).toBe(404);
    const cr = await ChangeRequest.findById(submit.body.changeRequestId);
    expect(cr.status).toBe('rejected');
  });

  test('GET /api/persons/:id - role-based access', async () => {
    const { token: opToken } = await makeTokenFor('Operator');
    const { user: au, token: auToken } = await makeTokenFor('Access User', 'accessuser3');
    const own = await makePerson({ personalUniqueId: '123412341234', ownerUserId: au._id });
    const other = await makePerson({ personalUniqueId: '432143214321' });

    const opSeesOther = await request(app).get(`/api/persons/${other._id}`).set(authHeader(opToken));
    expect(opSeesOther.status).toBe(200);

    const auSeesOwn = await request(app).get(`/api/persons/${own._id}`).set(authHeader(auToken));
    expect(auSeesOwn.status).toBe(200);

    const auBlocked = await request(app).get(`/api/persons/${other._id}`).set(authHeader(auToken));
    expect(auBlocked.status).toBe(403);

    const notFound = await request(app)
      .get('/api/persons/507f1f77bcf86cd799439011')
      .set(authHeader(opToken));
    expect(notFound.status).toBe(404);
  });

  test('Admin can list change-requests, with optional status filter', async () => {
    const { token: opToken } = await makeTokenFor('Operator');
    const { token: adminToken } = await makeTokenFor('Administrator', 'admin');
    await request(app).post('/api/persons').set(authHeader(opToken)).send(samplePersonPayload());
    await request(app).post('/api/persons').set(authHeader(opToken)).send(samplePersonPayload());

    const all = await request(app).get('/api/change-requests').set(authHeader(adminToken));
    expect(all.status).toBe(200);
    expect(all.body.length).toBe(2);

    const pending = await request(app)
      .get('/api/change-requests?status=pending')
      .set(authHeader(adminToken));
    expect(pending.body.length).toBe(2);

    const approved = await request(app)
      .get('/api/change-requests?status=approved')
      .set(authHeader(adminToken));
    expect(approved.body.length).toBe(0);
  });
});

describe('404 handler', () => {
  test('unknown route returns structured 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });

  test('health endpoint works', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
