'use strict';

const LoginStatus = require('../models/LoginStatus');
const RefreshToken = require('../models/RefreshToken');
const userService = require('./user.service');
const { signToken, signRefreshToken, verifyRefreshToken, generateJti } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');

async function register({ username, email, password, roleName }) {
  // Public registration is always Access User regardless of caller-supplied roleName.
  const { user, role } = await userService.createUser({
    username,
    email,
    password,
    roleName: 'Access User'
  });
  return { user, role };
}

async function issueRefreshToken({ userId, ipAddress }) {
  const jti = generateJti();
  const refreshToken = signRefreshToken({ userId, jti });
  const decoded = verifyRefreshToken(refreshToken);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId,
    jti,
    expiresAt,
    createdByIp: ipAddress || ''
  });
  return refreshToken;
}

async function login({ username, password, loginForm, ipAddress }) {
  const user = await userService.findUserByUsername(username);
  if (!user) {
    await LoginStatus.create({
      username,
      loginForm: loginForm || 'web',
      ipAddress: ipAddress || '',
      success: false
    });
    throw ApiError.unauthorized('Invalid credentials');
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    await LoginStatus.create({
      username,
      loginForm: loginForm || 'web',
      ipAddress: ipAddress || '',
      success: false
    });
    throw ApiError.unauthorized('Invalid credentials');
  }

  const role = user.roleId; // populated
  const token = signToken({
    userId: user._id.toString(),
    username: user.username,
    roleName: role.roleName
  });
  const refreshToken = await issueRefreshToken({ userId: user._id, ipAddress });

  await LoginStatus.create({
    username,
    loginForm: loginForm || 'web',
    ipAddress: ipAddress || '',
    success: true
  });

  return {
    token,
    refreshToken,
    user: {
      userId: user._id,
      username: user.username,
      email: user.email,
      roleName: role.roleName
    }
  };
}

async function refresh({ refreshToken, ipAddress }) {
  try {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const { userId, jti } = decoded || {};
    if (!userId || !jti) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const tokenDoc = await RefreshToken.findOne({ jti });
    if (!tokenDoc || !tokenDoc.isActive()) {
      throw ApiError.unauthorized('Refresh token expired or revoked');
    }

    tokenDoc.revokedAt = new Date();
    tokenDoc.revokedByIp = ipAddress || '';

    const user = await userService.findUserById(userId);
    if (!user) {
      await tokenDoc.save();
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const role = user.roleId; // populated
    const newAccessToken = signToken({
      userId: user._id.toString(),
      username: user.username,
      roleName: role.roleName
    });

    const newRefreshToken = await issueRefreshToken({ userId: user._id, ipAddress });
    const newDecoded = verifyRefreshToken(newRefreshToken);
    tokenDoc.replacedByJti = newDecoded.jti;
    await tokenDoc.save();

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (err) {
    if (err && err.statusCode) throw err;
    throw ApiError.unauthorized('Invalid refresh token');
  }
}

async function logout({ refreshToken, ipAddress }) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    return;
  }

  const { jti } = decoded || {};
  if (!jti) return;

  await RefreshToken.updateOne(
    { jti, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedByIp: ipAddress || '' } }
  );
}

module.exports = { register, login, refresh, logout };
