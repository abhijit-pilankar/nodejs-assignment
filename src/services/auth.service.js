'use strict';

const LoginStatus = require('../models/LoginStatus');
const userService = require('./user.service');
const { signToken } = require('../middleware/auth');
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

  await LoginStatus.create({
    username,
    loginForm: loginForm || 'web',
    ipAddress: ipAddress || '',
    success: true
  });

  return {
    token,
    user: {
      userId: user._id,
      username: user.username,
      email: user.email,
      roleName: role.roleName
    }
  };
}

module.exports = { register, login };
