'use strict';

const { startTestDb, stopTestDb, clearDb } = require('../setup');
const { seedRoles, makeUser, samplePersonPayload } = require('../helpers');
const changeRequestService = require('../../src/services/changeRequest.service');
const ChangeRequest = require('../../src/models/ChangeRequest');
const Person = require('../../src/models/Person');

beforeAll(async () => { await startTestDb(); });
afterAll(async () => { await stopTestDb(); });
beforeEach(async () => { await clearDb(); await seedRoles(); });

describe('changeRequest.service edge cases', () => {
  test('approve unknown action throws', async () => {
    const { user } = await makeUser({ username: 'admin', roleName: 'Administrator' });
    const cr = new ChangeRequest({
      action: 'create',
      payload: samplePersonPayload(),
      submittedBy: user._id
    });
    cr.action = 'create';
    await cr.save();
    cr.action = 'weird';
    await cr.save({ validateBeforeSave: false });
    await expect(
      changeRequestService.approveChangeRequest({ changeRequestId: cr._id, reviewerId: user._id })
    ).rejects.toThrow(/Unknown action/);
  });

  test('cannot reject already-approved request', async () => {
    const { user } = await makeUser({ username: 'admin', roleName: 'Administrator' });
    const cr = await ChangeRequest.create({
      action: 'create',
      payload: samplePersonPayload(),
      submittedBy: user._id,
      status: 'approved'
    });
    await expect(
      changeRequestService.rejectChangeRequest({ changeRequestId: cr._id, reviewerId: user._id })
    ).rejects.toThrow(/already approved/);
  });

  test('reject 404 for unknown id (service-level)', async () => {
    const { user } = await makeUser({ username: 'admin', roleName: 'Administrator' });
    await expect(
      changeRequestService.rejectChangeRequest({
        changeRequestId: '507f1f77bcf86cd799439011',
        reviewerId: user._id
      })
    ).rejects.toThrow(/not found/i);
  });

  test('generateUnusedUniqueId returns when first candidate is unique', async () => {
    const id = await changeRequestService.generateUnusedUniqueId();
    expect(id).toMatch(/^[0-9]{12}$/);
  });

  test('generateUnusedUniqueId throws after exhausting attempts when collisions persist', async () => {
    const spy = jest.spyOn(Person, 'findOne').mockResolvedValue({ _id: 'collision' });
    await expect(changeRequestService.generateUnusedUniqueId(3)).rejects.toThrow(/unique/);
    spy.mockRestore();
  });

  test('listChangeRequests with no filter returns all', async () => {
    const { user } = await makeUser({ username: 'oper1', roleName: 'Operator' });
    await ChangeRequest.create({ action: 'create', payload: {}, submittedBy: user._id });
    await ChangeRequest.create({ action: 'create', payload: {}, submittedBy: user._id, status: 'rejected' });
    const all = await changeRequestService.listChangeRequests();
    expect(all.length).toBe(2);
  });
});
