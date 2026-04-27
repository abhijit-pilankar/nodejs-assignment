'use strict';

const { startTestDb, stopTestDb, clearDb } = require('../setup');
const { seedRoles, makeUser } = require('../helpers');
const userService = require('../../src/services/user.service');

beforeAll(async () => { await startTestDb(); });
afterAll(async () => { await stopTestDb(); });
beforeEach(async () => { await clearDb(); await seedRoles(); });

describe('user.service', () => {
  test('findUserByUsername populates role', async () => {
    await makeUser({ username: 'oper1', roleName: 'Operator' });
    const u = await userService.findUserByUsername('oper1');
    expect(u).not.toBeNull();
    expect(u.roleId.roleName).toBe('Operator');
  });

  test('findUserById populates role', async () => {
    const { user } = await makeUser({ username: 'oper1', roleName: 'Operator' });
    const u = await userService.findUserById(user._id);
    expect(u.roleId.roleName).toBe('Operator');
  });

  test('createUser defaults to Access User when roleName omitted', async () => {
    const { role } = await userService.createUser({
      username: 'plain',
      email: 'p@example.com',
      password: 'Password@123'
    });
    expect(role.roleName).toBe('Access User');
  });
});
