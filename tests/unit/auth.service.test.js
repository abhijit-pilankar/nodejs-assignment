'use strict';

jest.mock('../../src/models/LoginStatus', () => ({ create: jest.fn() }));
jest.mock('../../src/models/RefreshToken', () => ({ create: jest.fn(), findOne: jest.fn(), updateOne: jest.fn() }));
jest.mock('../../src/services/user.service', () => ({
  createUser: jest.fn(),
  findUserByUsername: jest.fn(),
  findUserById: jest.fn()
}));
jest.mock('../../src/middleware/auth', () => ({
  signToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  generateJti: jest.fn()
}));

const LoginStatus = require('../../src/models/LoginStatus');
const RefreshToken = require('../../src/models/RefreshToken');
const userService = require('../../src/services/user.service');
const { signToken, signRefreshToken, verifyRefreshToken, generateJti } = require('../../src/middleware/auth');
const authService = require('../../src/services/auth.service');

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REFRESH_TOKEN_EXPIRES_IN;
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
    generateJti.mockReturnValue('jti1');
    signRefreshToken.mockReturnValue('refresh.jwt');
    verifyRefreshToken.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

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
    expect(signRefreshToken).toHaveBeenCalledWith({ userId: expect.anything(), jti: 'jti1' });
    expect(RefreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({ jti: 'jti1', createdByIp: '127.0.0.1' })
    );
    expect(LoginStatus.create).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, ipAddress: '127.0.0.1' })
    );
    expect(out).toEqual(
      expect.objectContaining({
        token: 'signed.jwt',
        refreshToken: 'refresh.jwt',
        user: expect.objectContaining({ username: 'u1', roleName: 'Operator' })
      })
    );
  });

  test('refresh rotates refresh token and returns new tokens', async () => {
    verifyRefreshToken
      .mockReturnValueOnce({ userId: 'u1', jti: 'old' })
      .mockReturnValueOnce({ userId: 'u1', jti: 'new' });
    RefreshToken.findOne.mockResolvedValue({
      isActive: () => true,
      save: jest.fn(),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 10000)
    });
    userService.findUserById.mockResolvedValue({
      _id: { toString: () => 'u1' },
      username: 'x',
      roleId: { roleName: 'Operator' }
    });
    signToken.mockReturnValue('new.access');
    generateJti.mockReturnValue('new');
    signRefreshToken.mockReturnValue('new.refresh');
    verifyRefreshToken.mockReturnValueOnce({ userId: 'u1', jti: 'old' });
    verifyRefreshToken.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) + 3600 });
    verifyRefreshToken.mockReturnValueOnce({ userId: 'u1', jti: 'new' });

    const out = await authService.refresh({ refreshToken: 'old.refresh', ipAddress: '1.1.1.1' });
    expect(out).toEqual({ token: 'new.access', refreshToken: 'new.refresh' });
  });

  test('login uses safe default refresh expiry when exp is missing', async () => {
    const comparePassword = jest.fn().mockResolvedValue(true);
    userService.findUserByUsername.mockResolvedValue({
      _id: { toString: () => 'abc123' },
      username: 'u1',
      email: 'u1@example.com',
      comparePassword,
      roleId: { roleName: 'Operator' }
    });
    signToken.mockReturnValue('signed.jwt');
    generateJti.mockReturnValue('jti1');
    signRefreshToken.mockReturnValue('refresh.jwt');
    verifyRefreshToken.mockReturnValue({});

    await authService.login({
      username: 'u1',
      password: 'Password@123',
      loginForm: 'web',
      ipAddress: '127.0.0.1'
    });

    expect(RefreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        jti: 'jti1',
        expiresAt: expect.any(Date)
      })
    );
  });

  test('refresh rejects when refresh token cannot be verified', async () => {
    verifyRefreshToken.mockImplementation(() => {
      throw new Error('bad token');
    });
    await expect(authService.refresh({ refreshToken: 'x' })).rejects.toMatchObject({ statusCode: 401 });
  });

  test('refresh rejects when token record is missing or inactive', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 'u1', jti: 'missing' });
    RefreshToken.findOne.mockResolvedValue(null);
    await expect(authService.refresh({ refreshToken: 'rt' })).rejects.toMatchObject({ statusCode: 401 });

    RefreshToken.findOne.mockResolvedValue({ isActive: () => false });
    await expect(authService.refresh({ refreshToken: 'rt' })).rejects.toMatchObject({ statusCode: 401 });
  });

  test('refresh rejects when decoded refresh token is missing required claims', async () => {
    verifyRefreshToken.mockReturnValue({});
    await expect(authService.refresh({ refreshToken: 'rt' })).rejects.toMatchObject({ statusCode: 401 });
  });

  test('refresh rejects when user no longer exists (and revokes token)', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 'u1', jti: 'old' });
    const save = jest.fn();
    RefreshToken.findOne.mockResolvedValue({
      isActive: () => true,
      save,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 10000)
    });
    userService.findUserById.mockResolvedValue(null);

    await expect(authService.refresh({ refreshToken: 'rt', ipAddress: '1.1.1.1' })).rejects.toMatchObject({ statusCode: 401 });
    expect(save).toHaveBeenCalled();
  });

  test('logout is no-op if refresh token cannot be verified', async () => {
    verifyRefreshToken.mockImplementation(() => {
      throw new Error('bad token');
    });
    await authService.logout({ refreshToken: 'x' });
    expect(RefreshToken.updateOne).not.toHaveBeenCalled();
  });

  test('logout is no-op if decoded token has no jti', async () => {
    verifyRefreshToken.mockReturnValue({});
    await authService.logout({ refreshToken: 'x' });
    expect(RefreshToken.updateOne).not.toHaveBeenCalled();
  });

  test('logout revokes refresh token when jti is present', async () => {
    verifyRefreshToken.mockReturnValue({ jti: 't1' });
    await authService.logout({ refreshToken: 'x', ipAddress: '2.2.2.2' });
    expect(RefreshToken.updateOne).toHaveBeenCalledWith(
      { jti: 't1', revokedAt: null },
      { $set: { revokedAt: expect.any(Date), revokedByIp: '2.2.2.2' } }
    );
  });
});
