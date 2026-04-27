'use strict';

const User = require('../models/User');
const Role = require('../models/Role');
const ApiError = require('../utils/ApiError');

const DEFAULT_ROLE_NAME = 'Access User';

/**
 * Creates a user, ensuring they are assigned a valid role. If role lookup
 * fails, the user is NOT persisted — this satisfies the assignment's
 * "if user assignment to role fails, user creation should also fail" rule.
 */
async function createUser({ username, email, password, roleName }) {
  const targetRoleName = roleName || DEFAULT_ROLE_NAME;
  const role = await Role.findOne({ roleName: targetRoleName });
  if (!role) {
    throw ApiError.badRequest(`Role "${targetRoleName}" does not exist; user not created`);
  }

  const exists = await User.findOne({
    $or: [{ username }, { email: String(email).toLowerCase() }]
  });
  if (exists) {
    throw ApiError.conflict('Username or email already in use');
  }

  const user = new User({ username, email, password, roleId: role._id });
  await user.save();
  return { user, role };
}

async function findUserById(id) {
  return User.findById(id).populate('roleId');
}

async function findUserByUsername(username) {
  return User.findOne({ username }).populate('roleId');
}

module.exports = {
  createUser,
  findUserById,
  findUserByUsername,
  DEFAULT_ROLE_NAME
};
