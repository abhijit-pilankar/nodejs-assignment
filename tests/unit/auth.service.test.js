'use strict';

jest.mock('../../src/models/LoginStatus', () => ({ create: jest.fn() }));
jest.mock('../../src/services/user.service', () => ({
  createUser: jest.fn(),
  findUserByUsername: jest.fn()
}));
jest.mock('../../src/middleware/auth', () => ({ signToken: jest.fn() }));

const LoginStatus = require('../../src/models/LoginStatus');
const userService = require('../../src/services/user.service');
const { signToken } = require('../../src/middleware/auth');
const authService = require('../../src/services/auth.service');

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register always forces Access User role', async () => {
    userService.createUser.mockResolvedValue({
      user: { _id: 'u1', username: 'x', email: 'x@y.com' },
      role: { roleName: 'Access User' }
    });

    const out = await authService.register({
      username: 'x',
      email: 'x@y.com',
      password: 'Password@123',
      roleName: 'Administrator'
    });

    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ roleName: 'Access User' })
    );
    expect(out.role.roleName).toBe('Access User');
  });

  test('login throws unauthorized and logs failure when user not found', async () => {
    userService.findUserByUsername.mockResolvedValue(null);

    await expect(
      authService.login({ username: 'ghost', password: 'x' })
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(LoginStatus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'ghost',
        loginForm: 'web',
        ipAddress: '',
        success: false
      })
    );
  });

  test('login throws unauthorized and logs failure when password invalid', async () => {
    userService.findUserByUsername.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false)
    });

    await expect(
      authService.login({ username: 'u1', password: 'bad', loginForm: 'mobile', ipAddress: '1.1.1.1' })
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(LoginStatus.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'u1',
        loginForm: 'mobile',
        ipAddress: '1.1.1.1',
        success: false
      })
    );
  });

  test('login returns token and logs success for valid credentials', async () => {
    const comparePassword = jest.fn().mockResolvedValue(true);
    userService.findUserByUsername.mockResolvedValue({
      _id: { toString: () => 'abc123' },
      username: 'u1',
      email: 'u1@example.com',
      comparePassword,
      roleId: { roleName: 'Operator' }
    });
    signToken.mockReturnValue('signed.jwt');

    const out = await authService.login({
      username: 'u1',
      password: 'Password@123',
      loginForm: 'web',
      ipAddress: '127.0.0.1'
    });

    expect(signToken).toHaveBeenCalledWith({
      userId: 'abc123',
      username: 'u1',
      roleName: 'Operator'
    });
    expect(LoginStatus.create).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, ipAddress: '127.0.0.1' })
    );
    expect(out).toEqual(
      expect.objectContaining({
        token: 'signed.jwt',
        user: expect.objectContaining({ username: 'u1', roleName: 'Operator' })
      })
    );
  });
});
