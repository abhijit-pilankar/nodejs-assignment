'use strict';

const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const { user, role } = await authService.register({ username, email, password });
  res.status(201).json({
    user: {
      userId: user._id,
      username: user.username,
      email: user.email,
      roleName: role.roleName
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { username, password, loginForm } = req.body;
  const result = await authService.login({
    username,
    password,
    loginForm,
    ipAddress: req.ip
  });
  res.json(result);
});

module.exports = { register, login };
