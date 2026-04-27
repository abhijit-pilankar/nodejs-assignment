'use strict';

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const userService = require('../services/user.service');

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, roleName } = req.body;
  const { user, role } = await userService.createUser({
    username,
    email,
    password,
    roleName
  });
  res.status(201).json({
    userId: user._id,
    username: user.username,
    email: user.email,
    roleName: role.roleName
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('roleId').sort({ username: 1 });
  res.json(
    users.map((u) => ({
      userId: u._id,
      username: u.username,
      email: u.email,
      roleName: u.roleId ? u.roleId.roleName : null,
      personId: u.personId
    }))
  );
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('roleId');
  if (!user) throw ApiError.notFound('User not found');
  res.json({
    userId: user._id,
    username: user.username,
    email: user.email,
    roleName: user.roleId ? user.roleId.roleName : null,
    personId: user.personId
  });
});

module.exports = { createUser, listUsers, getUser };
